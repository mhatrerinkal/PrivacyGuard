export interface CsvParseResult {
  rows: string[][];
  delimiter: string;
  lineEnding: '\r\n' | '\n';
  hasMalformedQuotes: boolean;
  warning?: string;
  rowCount: number;
  columnCount: number;
}

/**
 * Heuristically detects the CSV delimiter from the first non-empty line
 * outside quoted segments. Defaults to ','.
 */
export function detectCsvDelimiter(rawText: string): string {
  const firstLine = rawText.split(/\r?\n/)[0] ?? '';
  const candidates = [',', ';', '\t'];
  let bestDelimiter = ',';
  let bestCount = 0;

  for (const delim of candidates) {
    let inQuotes = false;
    let count = 0;
    for (let i = 0; i < firstLine.length; i += 1) {
      const ch = firstLine[i];
      if (ch === '"') {
        inQuotes = !inQuotes;
      } else if (!inQuotes && ch === delim) {
        count += 1;
      }
    }
    if (count > bestCount) {
      bestCount = count;
      bestDelimiter = delim;
    }
  }

  return bestDelimiter;
}

/**
 * Safely parses CSV text according to RFC 4180 rules.
 * Handles quoted fields, escaped double-quotes (""), embedded delimiters,
 * embedded newlines, CRLF/LF line endings, and recovers gracefully from malformed quotes.
 */
export function parseCsv(rawText: string): CsvParseResult {
  const lineEnding: '\r\n' | '\n' = rawText.includes('\r\n') ? '\r\n' : '\n';
  const delimiter = detectCsvDelimiter(rawText);

  if (!rawText) {
    return {
      rows: [],
      delimiter,
      lineEnding,
      hasMalformedQuotes: false,
      rowCount: 0,
      columnCount: 0,
    };
  }

  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentField = '';
  let inQuotes = false;
  let hasMalformedQuotes = false;

  for (let i = 0; i < rawText.length; i += 1) {
    const ch = rawText[i];
    const next = rawText[i + 1];

    if (inQuotes) {
      if (ch === '"') {
        if (next === '"') {
          // Escaped quote inside quoted field
          currentField += '"';
          i += 1;
        } else {
          // Closing quote; check if unexpectedly followed by non-delimiter/non-newline
          inQuotes = false;
          if (
            next !== undefined &&
            next !== delimiter &&
            next !== '\r' &&
            next !== '\n'
          ) {
            hasMalformedQuotes = true;
          }
        }
      } else {
        currentField += ch;
      }
    } else if (ch === '"') {
      if (currentField.length === 0) {
        inQuotes = true;
      } else {
        // Quote appearing mid-unquoted field (malformed CSV)
        hasMalformedQuotes = true;
        currentField += ch;
      }
    } else if (ch === delimiter) {
      currentRow.push(currentField);
      currentField = '';
    } else if (ch === '\r' && next === '\n') {
      currentRow.push(currentField);
      rows.push(currentRow);
      currentRow = [];
      currentField = '';
      i += 1;
    } else if (ch === '\n' || ch === '\r') {
      currentRow.push(currentField);
      rows.push(currentRow);
      currentRow = [];
      currentField = '';
    } else {
      currentField += ch;
    }
  }

  // Unclosed quote at EOF
  if (inQuotes) {
    hasMalformedQuotes = true;
  }

  // Push trailing field/row if non-empty or if line ended with delimiter
  if (currentField.length > 0 || currentRow.length > 0) {
    currentRow.push(currentField);
    rows.push(currentRow);
  }

  const columnCount = rows.reduce((max, r) => Math.max(max, r.length), 0);
  const inconsistentColumns =
    rows.length > 1 && rows.some((r) => r.length !== columnCount);

  let warning: string | undefined;
  if (hasMalformedQuotes) {
    warning =
      'Malformed CSV quoting detected. PrivacyGuard recovered safely and will properly escape exported fields.';
  } else if (inconsistentColumns) {
    warning =
      'Inconsistent column counts detected across CSV rows. Structure has been preserved safely.';
  }

  return {
    rows,
    delimiter,
    lineEnding,
    hasMalformedQuotes,
    warning,
    rowCount: rows.length,
    columnCount,
  };
}

/**
 * Escapes a single CSV field per RFC 4180.
 */
export function escapeCsvField(field: string, delimiter = ','): string {
  const mustQuote =
    field.includes(delimiter) ||
    field.includes('"') ||
    field.includes('\n') ||
    field.includes('\r');

  if (!mustQuote) {
    return field;
  }

  return `"${field.replace(/"/g, '""')}"`;
}

/**
 * Serializes a 2D array of CSV fields back into valid RFC-4180 CSV text.
 */
export function serializeCsv(
  rows: string[][],
  delimiter = ',',
  lineEnding: '\r\n' | '\n' = '\n'
): string {
  return rows
    .map((row) => row.map((cell) => escapeCsvField(cell, delimiter)).join(delimiter))
    .join(lineEnding);
}

/**
 * Sanitizes a CSV document while preserving row/column structure, delimiters, and proper escaping.
 * Accepts a cell-level sanitizer callback so offsets/mappings remain consistent across the document.
 */
export function sanitizeCsvStructure(
  rawSanitizedCsv: string
): string {
  const parsed = parseCsv(rawSanitizedCsv);
  if (parsed.rows.length === 0) {
    return rawSanitizedCsv;
  }
  return serializeCsv(parsed.rows, parsed.delimiter, parsed.lineEnding);
}
