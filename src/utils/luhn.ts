/**
 * Extracts only numeric ASCII digits from a candidate string.
 */
export function extractDigits(input: string): string {
  return input.replace(/\D/g, '');
}

/**
 * Custom JavaScript implementation of the Luhn (Mod-10) checksum algorithm.
 * Used to validate credit/debit card numbers locally in the browser.
 *
 * Rules applied:
 * 1. Strips spaces, hyphens, and non-digit formatting characters.
 * 2. Requires 13 to 19 digits (standard ISO/IEC 7812 card lengths).
 * 3. Rejects degenerate all-identical digit sequences (e.g., 0000000000000000).
 * 4. Computes Luhn checksum from rightmost check digit moving left.
 */
export function isValidLuhn(cardCandidate: string): boolean {
  const digits = extractDigits(cardCandidate);

  if (digits.length < 13 || digits.length > 19) {
    return false;
  }

  // Reject sequences where every digit is identical (e.g. 0000... passes mod-10 trivially)
  if (/^(\d)\1+$/.test(digits)) {
    return false;
  }

  let sum = 0;
  let shouldDouble = false;

  for (let i = digits.length - 1; i >= 0; i -= 1) {
    let digit = digits.charCodeAt(i) - 48;

    if (shouldDouble) {
      digit *= 2;
      if (digit > 9) {
        digit -= 9;
      }
    }

    sum += digit;
    shouldDouble = !shouldDouble;
  }

  return sum % 10 === 0;
}
