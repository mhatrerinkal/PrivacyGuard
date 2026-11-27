import { DetectedEntity, PiiCategory, ScanResult } from '../types/pii';
import { isValidLuhn } from '../utils/luhn';
import {
  isValidEmail,
  isValidIPv4,
  isValidPAN,
  validateAadhaarStyle,
  validatePhoneNumber,
} from '../utils/validators';
import { createEmptyCounts } from './categories';

interface RawCandidate {
  value: string;
  category: PiiCategory;
  startIndex: number;
  endIndex: number;
  validationStatus: string;
  priority: number;
}

/**
 * Priority order when resolving overlapping matches.
 * Higher number wins if startIndex is equal or spans overlap.
 */
const CATEGORY_PRIORITY: Record<PiiCategory, number> = {
  credit_card: 6,
  aadhaar: 5,
  email: 4,
  pan: 3,
  ip: 2,
  phone: 1,
};

function collectMatches(
  text: string,
  regex: RegExp,
  category: PiiCategory,
  validate: (match: string) => { valid: boolean; status: string }
): RawCandidate[] {
  const candidates: RawCandidate[] = [];
  regex.lastIndex = 0;

  let match: RegExpExecArray | null;
  while ((match = regex.exec(text)) !== null) {
    const value = match[0];
    const startIndex = match.index;
    const endIndex = startIndex + value.length;

    const result = validate(value);
    if (result.valid) {
      candidates.push({
        value,
        category,
        startIndex,
        endIndex,
        validationStatus: result.status,
        priority: CATEGORY_PRIORITY[category],
      });
    }

    // Safety guard against zero-width infinite loops
    if (match.index === regex.lastIndex) {
      regex.lastIndex += 1;
    }
  }

  return candidates;
}

/**
 * Resolves duplicate and overlapping detections deterministically:
 * 1. Sorts by startIndex ascending.
 * 2. On identical startIndex, prefers longer span, then higher category priority.
 * 3. Drops any subsequent candidate that overlaps an already accepted span.
 */
function resolveOverlaps(candidates: RawCandidate[]): DetectedEntity[] {
  const sorted = [...candidates].sort((a, b) => {
    if (a.startIndex !== b.startIndex) {
      return a.startIndex - b.startIndex;
    }
    const lengthDiff = (b.endIndex - b.startIndex) - (a.endIndex - a.startIndex);
    if (lengthDiff !== 0) {
      return lengthDiff;
    }
    return b.priority - a.priority;
  });

  const accepted: DetectedEntity[] = [];
  let lastEnd = -1;

  for (const candidate of sorted) {
    // Skip duplicate or overlapping span
    if (candidate.startIndex < lastEnd) {
      continue;
    }

    accepted.push({
      id: `${candidate.category}-${candidate.startIndex}-${candidate.endIndex}`,
      value: candidate.value,
      category: candidate.category,
      startIndex: candidate.startIndex,
      endIndex: candidate.endIndex,
      validationStatus: candidate.validationStatus,
    });
    lastEnd = candidate.endIndex;
  }

  return accepted;
}

/**
 * Runs the 100% local pattern-based & algorithmic PII detection engine.
 * Preserves exact character offsets and never mutates the input text.
 */
export function detectPii(text: string): ScanResult {
  const counts = createEmptyCounts();
  const scannedAt = new Date().toISOString();

  if (!text) {
    return {
      entities: [],
      counts,
      totalEntities: 0,
      scannedAt,
    };
  }

  // 1. Emails (excludes trailing sentence punctuation)
  const emailRegex =
    /(?<![A-Za-z0-9._%+-])[A-Za-z0-9](?:[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]{0,62}[A-Za-z0-9])?@[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)+(?![A-Za-z0-9@._-])/g;
  const emailMatches = collectMatches(text, emailRegex, 'email', (val) => ({
    valid: isValidEmail(val),
    status: 'Valid Email Pattern',
  }));

  // 2. Credit Card Numbers (13-19 digits, spaces/hyphens allowed, MANDATORY Luhn check)
  const cardRegex =
    /(?<![\dA-Za-z-])(?:\d{4}(?:[ -]\d{4}){2,3}(?:[ -]\d{1,3})?|\d{4}[ -]\d{6}[ -]\d{5}|\d{13,19})(?![\dA-Za-z-])/g;
  const cardMatches = collectMatches(text, cardRegex, 'credit_card', (val) => {
    // Reject mixed separators (e.g., 4532-0151 1283-0366)
    if (val.includes(' ') && val.includes('-')) {
      return { valid: false, status: 'Mixed Separators' };
    }
    const passed = isValidLuhn(val);
    return {
      valid: passed,
      status: passed ? 'Luhn Checksum Passed' : 'Failed Luhn Checksum',
    };
  });

  // 3. Aadhaar-Style 12-Digit Numbers (space, hyphen, or contiguous)
  const aadhaarRegex =
    /(?<![\dA-Za-z-])(?:\d{4}[ -]\d{4}[ -]\d{4}|\d{12})(?![\dA-Za-z-])/g;
  const aadhaarMatches = collectMatches(text, aadhaarRegex, 'aadhaar', (val) =>
    validateAadhaarStyle(val)
  );

  // 4. Indian PAN Numbers (5 letters + 4 digits + 1 letter)
  const panRegex = /(?<![A-Za-z0-9])[A-Za-z]{5}[0-9]{4}[A-Za-z](?![A-Za-z0-9])/g;
  const panMatches = collectMatches(text, panRegex, 'pan', (val) => ({
    valid: isValidPAN(val),
    status: 'Valid PAN Structure',
  }));

  // 5. IPv4 Addresses (strict 0-255 per octet)
  const ipRegex = /(?<![\d.A-Za-z])(?:\d{1,3}\.){3}\d{1,3}(?!\.\d)(?!\d)/g;
  const ipMatches = collectMatches(text, ipRegex, 'ip', (val) => ({
    valid: isValidIPv4(val),
    status: 'Valid IPv4 Octets (0-255)',
  }));

  // 6. Phone Numbers (International + Indian)
  const intlPhoneRegex =
    /(?<![\dA-Za-z+])\+(?:91[\s-]?\d{10}|1[\s.-]?(?:\(\d{3}\)|\d{3})[\s.-]?\d{3}[\s.-]?\d{4}|\d{1,3}(?:[\s.-]?\(?\d{1,5}\)?){1,5})(?![\dA-Za-z-])/g;
  const nanpPhoneRegex =
    /(?<![\dA-Za-z+-])(?:\(\d{3}\)[\s.-]?|\d{3}[\s.-])\d{3}[\s.-]\d{4}(?![\dA-Za-z-])/g;
  const indianMobileRegex =
    /(?<![\dA-Za-z+.-])[6-9]\d{9}(?![\dA-Za-z.-])/g;

  const phoneMatches = [
    ...collectMatches(text, intlPhoneRegex, 'phone', validatePhoneNumber),
    ...collectMatches(text, nanpPhoneRegex, 'phone', validatePhoneNumber),
    ...collectMatches(text, indianMobileRegex, 'phone', validatePhoneNumber),
  ];

  const allCandidates: RawCandidate[] = [
    ...emailMatches,
    ...cardMatches,
    ...aadhaarMatches,
    ...panMatches,
    ...ipMatches,
    ...phoneMatches,
  ];

  const entities = resolveOverlaps(allCandidates);

  for (const entity of entities) {
    counts[entity.category] += 1;
  }

  return {
    entities,
    counts,
    totalEntities: entities.length,
    scannedAt,
  };
}
