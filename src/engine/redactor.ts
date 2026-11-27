import {
  DetectedEntity,
  PiiCategory,
  PseudonymMappingEntry,
  RedactionMode,
  RedactionResult,
} from '../types/pii';
import { extractDigits } from '../utils/luhn';
import { CATEGORY_META } from './categories';

/**
 * Produces a canonical key for consistent pseudonymization so repeated occurrences
 * of the same entity always map to the same placeholder within a session.
 */
export function canonicalizeEntityKey(
  value: string,
  category: PiiCategory
): string {
  const trimmed = value.trim();
  switch (category) {
    case 'email':
      return trimmed.toLowerCase();
    case 'pan':
      return trimmed.toUpperCase();
    case 'ip':
      return trimmed;
    case 'phone':
    case 'aadhaar':
    case 'credit_card':
      return trimmed.replace(/\s+/g, ' ');
    default:
      return trimmed;
  }
}

/**
 * Generates a partial mask preserving verification context (e.g., domain or last 4 digits).
 */
export function applyPartialMask(value: string, category: PiiCategory): string {
  switch (category) {
    case 'email': {
      const atIdx = value.indexOf('@');
      if (atIdx <= 0) {
        return '[REDACTED]';
      }
      const local = value.slice(0, atIdx);
      const domain = value.slice(atIdx);
      return `${local[0]}***${domain}`;
    }

    case 'phone': {
      // Mask all digits except the last 4 while preserving +, spaces, hyphens, parentheses
      const totalDigits = extractDigits(value).length;
      if (totalDigits <= 4) {
        return 'X'.repeat(value.length);
      }
      let digitsSeen = 0;
      const keepFrom = totalDigits - 4;
      let result = '';
      for (const ch of value) {
        if (ch >= '0' && ch <= '9') {
          result += digitsSeen < keepFrom ? 'X' : ch;
          digitsSeen += 1;
        } else {
          result += ch;
        }
      }
      return result;
    }

    case 'pan': {
      // ABCDE1234F -> XXXXX1234F
      if (value.length === 10) {
        return `XXXXX${value.slice(5)}`;
      }
      return 'X'.repeat(Math.max(0, value.length - 4)) + value.slice(-4);
    }

    case 'aadhaar': {
      // 1234 5678 9012 -> XXXX XXXX 9012 | 1234-5678-9012 -> XXXX-XXXX-9012 | 123456789012 -> XXXXXXXX9012
      const digits = extractDigits(value);
      const last4 = digits.slice(-4);
      if (value.includes(' ')) {
        return `XXXX XXXX ${last4}`;
      }
      if (value.includes('-')) {
        return `XXXX-XXXX-${last4}`;
      }
      return `XXXXXXXX${last4}`;
    }

    case 'credit_card': {
      // 4532015112830366 -> XXXX XXXX XXXX 0366
      const digits = extractDigits(value);
      const last4 = digits.slice(-4);
      if (value.includes('-')) {
        return `XXXX-XXXX-XXXX-${last4}`;
      }
      if (digits.length === 15) {
        return `XXXX XXXXXX X${last4}`;
      }
      return `XXXX XXXX XXXX ${last4}`;
    }

    case 'ip': {
      const parts = value.split('.');
      if (parts.length === 4) {
        return `XXX.XXX.XXX.${parts[3]}`;
      }
      return 'XXX.XXX.XXX.XXX';
    }

    default:
      return '[REDACTED]';
  }
}

export interface PseudonymSessionState {
  /** Map of `${category}::${canonicalKey}` -> assigned placeholder */
  map: Map<string, string>;
  /** Per-category incrementing counters */
  counters: Record<PiiCategory, number>;
  /** Metadata entries for authorized local preview */
  entries: Map<string, PseudonymMappingEntry>;
}

export function createPseudonymSession(): PseudonymSessionState {
  return {
    map: new Map(),
    counters: {
      email: 0,
      phone: 0,
      ip: 0,
      pan: 0,
      aadhaar: 0,
      credit_card: 0,
    },
    entries: new Map(),
  };
}

/**
 * Redacts all detected entities in `text` using the selected redaction mode.
 * Applies replacements using exact character offsets from right to left (without mutating `text`).
 *
 * When `mode === 'pseudonymize'`, maintains consistent per-category placeholders across
 * repeated occurrences using `session` (or creates a fresh session if omitted).
 */
export function redactText(
  text: string,
  entities: DetectedEntity[],
  mode: RedactionMode,
  existingSession?: PseudonymSessionState
): RedactionResult {
  if (!text || entities.length === 0) {
    return {
      sanitizedText: text,
      charactersMasked: 0,
      entitiesSanitized: 0,
      mappings: [],
    };
  }

  // Assign pseudonyms in left-to-right reading order so USER_01 appears before USER_02
  const session = existingSession ?? createPseudonymSession();
  const sortedAsc = [...entities].sort((a, b) => a.startIndex - b.startIndex);
  const replacementsById = new Map<string, string>();

  for (const entity of sortedAsc) {
    let replacement: string;

    if (mode === 'full_mask') {
      replacement = '[REDACTED]';
    } else if (mode === 'partial_mask') {
      replacement = applyPartialMask(entity.value, entity.category);
    } else {
      const canonicalKey = canonicalizeEntityKey(entity.value, entity.category);
      const lookupKey = `${entity.category}::${canonicalKey}`;
      let placeholder = session.map.get(lookupKey);

      if (!placeholder) {
        session.counters[entity.category] += 1;
        const seq = String(session.counters[entity.category]).padStart(2, '0');
        const prefix = CATEGORY_META[entity.category].pseudonymPrefix;
        placeholder = `${prefix}_${seq}`;
        session.map.set(lookupKey, placeholder);
        session.entries.set(lookupKey, {
          category: entity.category,
          placeholder,
          canonicalKey,
          originalValue: entity.value,
          occurrences: 1,
        });
      } else {
        const entry = session.entries.get(lookupKey);
        if (entry) {
          entry.occurrences += 1;
        }
      }

      replacement = placeholder;
    }

    replacementsById.set(entity.id, replacement);
  }

  // Apply replacements from right to left to keep all earlier character offsets intact
  let output = text;
  let charactersMasked = 0;

  for (let i = sortedAsc.length - 1; i >= 0; i -= 1) {
    const entity = sortedAsc[i];
    const replacement = replacementsById.get(entity.id) ?? '[REDACTED]';
    output =
      output.slice(0, entity.startIndex) +
      replacement +
      output.slice(entity.endIndex);
    charactersMasked += entity.value.length;
  }

  return {
    sanitizedText: output,
    charactersMasked,
    entitiesSanitized: sortedAsc.length,
    mappings: Array.from(session.entries.values()),
  };
}
