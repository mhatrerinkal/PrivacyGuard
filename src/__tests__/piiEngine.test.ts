import { describe, expect, it } from 'vitest';
import { detectPii } from '../engine/detector';
import { createPseudonymSession, redactText } from '../engine/redactor';
import { SAMPLE_CSV_TEXT, SAMPLE_NOISY_TEXT } from '../engine/sampleData';
import { escapeCsvField, parseCsv, sanitizeCsvStructure } from '../utils/csvHandler';
import { isValidLuhn } from '../utils/luhn';
import { getSanitizedFilename } from '../utils/fileExport';

describe('PrivacyGuard PII Detection, Validation & Redaction Engine', () => {
  it('Test 1: Detects a valid email without trailing punctuation and replaces it', () => {
    const input = 'Contact us at john.doe@gmail.com, or backup (support@acme.org).';
    const scan = detectPii(input);

    expect(scan.counts.email).toBe(2);
    expect(scan.entities[0].value).toBe('john.doe@gmail.com');
    expect(scan.entities[1].value).toBe('support@acme.org');

    const masked = redactText(input, scan.entities, 'full_mask');
    expect(masked.sanitizedText).toBe(
      'Contact us at [REDACTED], or backup ([REDACTED]).'
    );
  });

  it('Test 2 & 13: Maps repeated identical emails to USER_01 and distinct emails to USER_02 in pseudonymization mode', () => {
    const input =
      'Primary: john.doe@gmail.com\nBackup: john.doe@gmail.com\nOther: jane@example.com';
    const scan = detectPii(input);
    const result = redactText(input, scan.entities, 'pseudonymize');

    expect(result.sanitizedText).toBe(
      'Primary: USER_01\nBackup: USER_01\nOther: USER_02'
    );
    expect(result.mappings).toHaveLength(2);
    expect(result.mappings[0].occurrences).toBe(2);
  });

  it('Test 3: Detects Indian and international phone numbers while ignoring short random numbers', () => {
    const input =
      'India: +91 9876543210, Alt: 9123456789, US: +1 202-555-0145, Local: 202-555-0145, Order: 4589';
    const scan = detectPii(input);

    expect(scan.counts.phone).toBe(4);
    expect(scan.entities.map((e) => e.value)).toEqual([
      '+91 9876543210',
      '9123456789',
      '+1 202-555-0145',
      '202-555-0145',
    ]);
  });

  it('Test 4: Detects valid IPv4 addresses and rejects invalid IPv4 like 999.999.999.999', () => {
    const input = 'Valid: 192.168.1.100, Zero: 0.0.0.0, Invalid: 999.999.999.999, BadZero: 192.168.01.1';
    const scan = detectPii(input);

    expect(scan.counts.ip).toBe(2);
    expect(scan.entities.map((e) => e.value)).toEqual(['192.168.1.100', '0.0.0.0']);
  });

  it('Test 5: Detects valid PAN-format numbers (ABCDE1234F)', () => {
    const input = 'PAN: ABCDE1234F and secondary PQRST5678K.';
    const scan = detectPii(input);

    expect(scan.counts.pan).toBe(2);
    expect(scan.entities.map((e) => e.value)).toEqual(['ABCDE1234F', 'PQRST5678K']);
  });

  it('Test 6: Detects Aadhaar-style 12-digit numbers (space, hyphen, raw) and avoids partial matches inside 16-digit numbers', () => {
    const input =
      'Aadhaar1: 2345 6789 0123 | Aadhaar2: 123456789012 | Aadhaar3: 3456-7890-1234 | NonAadhaar16: 1234567890123456 | Dummy: 0000 0000 0000';
    const scan = detectPii(input);

    expect(scan.counts.aadhaar).toBe(3);
    expect(scan.entities.map((e) => e.value)).toEqual([
      '2345 6789 0123',
      '123456789012',
      '3456-7890-1234',
    ]);
  });

  it('Test 7 & 8: Detects Luhn-valid credit cards (raw, hyphenated, spaced) and rejects random 16-digit numbers failing Luhn', () => {
    expect(isValidLuhn('4532015112830366')).toBe(true);
    expect(isValidLuhn('4532-0151-1283-0366')).toBe(true);
    expect(isValidLuhn('4532 0151 1283 0366')).toBe(true);
    expect(isValidLuhn('1234567890123456')).toBe(false);
    expect(isValidLuhn('0000000000000000')).toBe(false);

    const input =
      'Card1: 4532015112830366 | Card2: 4532-0151-1283-0366 | Card3: 4532 0151 1283 0366 | Invalid: 1234567890123456';
    const scan = detectPii(input);

    expect(scan.counts.credit_card).toBe(3);
    expect(scan.counts.aadhaar).toBe(0);
    expect(scan.counts.phone).toBe(0);
  });

  it('Test 9: Verifies Full Mask, Partial Mask, and Consistent Pseudonymization on SAMPLE_NOISY_TEXT', () => {
    const scan = detectPii(SAMPLE_NOISY_TEXT);

    expect(scan.counts).toEqual({
      email: 2,
      phone: 2,
      ip: 1,
      pan: 1,
      aadhaar: 1,
      credit_card: 1,
    });
    expect(scan.totalEntities).toBe(8);

    // Full mask
    const full = redactText(SAMPLE_NOISY_TEXT, scan.entities, 'full_mask');
    expect(full.sanitizedText).toContain('Email: [REDACTED]');
    expect(full.sanitizedText).toContain('Backup Email: [REDACTED]');
    expect(full.sanitizedText).toContain('Invalid IP: 999.999.999.999');
    expect(full.sanitizedText).toContain('Random Number: 1234567890123456');

    // Partial mask
    const partial = redactText(SAMPLE_NOISY_TEXT, scan.entities, 'partial_mask');
    expect(partial.sanitizedText).toContain('Email: j***@gmail.com');
    expect(partial.sanitizedText).toContain('Phone: +XX XXXXXX3210');
    expect(partial.sanitizedText).toContain('Alternate Phone: XXXXXX6789');
    expect(partial.sanitizedText).toContain('PAN: XXXXX1234F');
    expect(partial.sanitizedText).toContain('Aadhaar: XXXX XXXX 0123');
    expect(partial.sanitizedText).toContain('Credit Card: XXXX XXXX XXXX 0366');

    // Pseudonymization
    const pseudo = redactText(SAMPLE_NOISY_TEXT, scan.entities, 'pseudonymize');
    expect(pseudo.sanitizedText).toContain('Email: USER_01');
    expect(pseudo.sanitizedText).toContain('Backup Email: USER_01');
    expect(pseudo.sanitizedText).toContain('Phone: PHONE_01');
    expect(pseudo.sanitizedText).toContain('Alternate Phone: PHONE_02');
    expect(pseudo.sanitizedText).toContain('IP Address: IP_01');
    expect(pseudo.sanitizedText).toContain('PAN: PAN_01');
    expect(pseudo.sanitizedText).toContain('Aadhaar: AADHAAR_01');
    expect(pseudo.sanitizedText).toContain('Credit Card: CARD_01');
  });

  it('Test 10 & 11: Preserves TXT and CSV structure, quoting, delimiters, and exports clean filenames', () => {
    expect(getSanitizedFilename('customer_notes.txt', 'text')).toBe(
      'sanitized_customer_notes.txt'
    );
    expect(getSanitizedFilename('records.csv', 'csv')).toBe(
      'sanitized_records.csv'
    );

    const scan = detectPii(SAMPLE_CSV_TEXT);
    const redacted = redactText(SAMPLE_CSV_TEXT, scan.entities, 'pseudonymize');
    const exportedCsv = sanitizeCsvStructure(redacted.sanitizedText);

    const parsed = parseCsv(exportedCsv);
    expect(parsed.hasMalformedQuotes).toBe(false);
    expect(parsed.rowCount).toBe(4);
    expect(parsed.columnCount).toBe(8);
    // Quoted comma field "Doe, John" remains intact
    expect(parsed.rows[1][1]).toBe('Doe, John');
    // Pseudonym consistency across CSV rows
    expect(parsed.rows[1][2]).toBe('USER_01');
    expect(parsed.rows[2][2]).toBe('USER_01');
    expect(parsed.rows[3][2]).toBe('USER_02');
    // Invalid IP & invalid card preserved untouched
    expect(parsed.rows[3][4]).toBe('999.999.999.999');
    expect(parsed.rows[2][7]).toBe('1234567890123456');
  });

  it('Safely handles malformed CSV quotes and properly escapes CSV fields', () => {
    const malformed = 'name,email\n"Unclosed,john.doe@gmail.com\nAlice,alice@test.com';
    const parsed = parseCsv(malformed);
    expect(parsed.hasMalformedQuotes).toBe(true);
    expect(parsed.warning).toBeTruthy();

    expect(escapeCsvField('Doe, John', ',')).toBe('"Doe, John"');
    expect(escapeCsvField('Say "Hi"', ',')).toBe('"Say ""Hi"""');
    expect(escapeCsvField('USER_01', ',')).toBe('USER_01');
  });

  it('Test 14: Fresh session resets pseudonym numbering cleanly', () => {
    const s1 = createPseudonymSession();
    const scan1 = detectPii('a@b.com');
    const res1 = redactText('a@b.com', scan1.entities, 'pseudonymize', s1);
    expect(res1.sanitizedText).toBe('USER_01');

    const s2 = createPseudonymSession();
    const scan2 = detectPii('c@d.com');
    const res2 = redactText('c@d.com', scan2.entities, 'pseudonymize', s2);
    expect(res2.sanitizedText).toBe('USER_01');
  });
});
