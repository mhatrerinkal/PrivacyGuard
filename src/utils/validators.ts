import { extractDigits } from './luhn';

/**
 * Validates an IPv4 address string.
 * Ensures exactly 4 octets, each strictly an integer between 0 and 255,
 * without invalid leading zeros (e.g. "01" is rejected, "0" is allowed).
 */
export function isValidIPv4(candidate: string): boolean {
  const parts = candidate.split('.');
  if (parts.length !== 4) {
    return false;
  }

  return parts.every((octet) => {
    if (!/^\d{1,3}$/.test(octet)) {
      return false;
    }
    if (octet.length > 1 && octet.startsWith('0')) {
      return false;
    }
    const numericValue = Number(octet);
    return Number.isInteger(numericValue) && numericValue >= 0 && numericValue <= 255;
  });
}

/**
 * Validates Indian Permanent Account Number (PAN) format:
 * 5 letters, 4 digits, 1 letter (e.g., ABCDE1234F).
 */
export function isValidPAN(candidate: string): boolean {
  return /^[A-Za-z]{5}[0-9]{4}[A-Za-z]$/.test(candidate);
}

/**
 * Validates 12-digit Aadhaar-style numbers.
 * Does NOT claim official UIDAI verification.
 * Rejects trivial dummy strings such as all-identical digits or leading 0000 blocks.
 */
export function validateAadhaarStyle(candidate: string): {
  valid: boolean;
  status: string;
} {
  // Ensure consistent separator format: 12 raw digits, 4-4-4 space-separated, or 4-4-4 hyphen-separated
  const isConsistentFormat =
    /^\d{12}$/.test(candidate) ||
    /^\d{4} \d{4} \d{4}$/.test(candidate) ||
    /^\d{4}-\d{4}-\d{4}$/.test(candidate);

  if (!isConsistentFormat) {
    return { valid: false, status: 'Invalid Aadhaar Format' };
  }

  const digits = extractDigits(candidate);

  // Reject all identical digits like 000000000000 or 111111111111
  if (/^(\d)\1{11}$/.test(digits)) {
    return { valid: false, status: 'Rejected Repeated Digits' };
  }

  // Reject numbers starting with '0' (invalid dummy prefix)
  if (digits.startsWith('0')) {
    return { valid: false, status: 'Rejected Leading-Zero Pattern' };
  }

  // Standard UIDAI Aadhaar starts with 2-9; 1-prefixed 12-digit patterns are flagged as Aadhaar-style (unverified)
  if (/^[2-9]/.test(digits)) {
    return { valid: true, status: 'Aadhaar-Style Format (Local Pattern Match)' };
  }

  return { valid: true, status: 'Aadhaar-Style 12-Digit Pattern (Unverified)' };
}

/**
 * Validates email structure without trailing sentence punctuation.
 */
export function isValidEmail(candidate: string): boolean {
  // Basic structural checks beyond regex
  if (candidate.length > 254 || candidate.includes('..')) {
    return false;
  }
  const atIndex = candidate.indexOf('@');
  if (atIndex <= 0 || atIndex === candidate.length - 1) {
    return false;
  }
  const localPart = candidate.slice(0, atIndex);
  const domainPart = candidate.slice(atIndex + 1);
  if (localPart.length > 64 || domainPart.startsWith('-') || domainPart.endsWith('-')) {
    return false;
  }
  return /^[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)+$/.test(
    candidate
  );
}

/**
 * Validates Indian and international phone numbers while rejecting short/degenerate numeric strings.
 */
export function validatePhoneNumber(candidate: string): {
  valid: boolean;
  status: string;
} {
  const digits = extractDigits(candidate);

  if (digits.length < 10 || digits.length > 15) {
    return { valid: false, status: 'Invalid Digit Length' };
  }

  // Reject degenerate repeating sequences like 0000000000 or 9999999999
  if (/^(\d)\1+$/.test(digits)) {
    return { valid: false, status: 'Rejected Repeating Digits' };
  }

  const trimmed = candidate.trim();

  // Indian mobile with +91 country code
  if (/^\+91[\s-]?[6-9]\d{9}$/.test(trimmed)) {
    return { valid: true, status: 'Valid Indian Mobile (+91)' };
  }

  // Standalone 10-digit Indian mobile starting with 6-9
  if (/^[6-9]\d{9}$/.test(trimmed)) {
    return { valid: true, status: 'Valid Indian Mobile (10-digit)' };
  }

  // US / NANP formats: +1 202-555-0145, 202-555-0145, (202) 555-0145
  if (/^(?:\+1[\s.-]?)?(?:\(\d{3}\)|\d{3})[\s.-]\d{3}[\s.-]\d{4}$/.test(trimmed)) {
    return { valid: true, status: 'Valid North American Phone' };
  }

  // General E.164 / International phone starting with +
  if (trimmed.startsWith('+') && digits.length >= 10 && digits.length <= 15) {
    return { valid: true, status: 'Valid International Format' };
  }

  return { valid: false, status: 'Unrecognized Phone Pattern' };
}
