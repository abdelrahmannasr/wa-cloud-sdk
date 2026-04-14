import { ValidationError } from '../errors/errors.js';

// E.164: country code starts at 1-9 (no leading zero), 7-15 total digits.
const PHONE_REGEX = /^[1-9]\d{6,14}$/;

/**
 * Validate and normalize a phone number for the WhatsApp API.
 *
 * Strips exactly these formatting characters: regular space, tab, `-`, `(`,
 * `)`, `.`, `+`. Newlines, non-breaking spaces, form feeds, and other
 * whitespace are treated as invalid input — they almost always indicate a
 * copy-paste error rather than a separator.
 *
 * Returns a digits-only E.164 string (no '+'): 7-15 digits, first digit 1-9.
 *
 * @throws ValidationError if the number is invalid
 */
export function validatePhoneNumber(phone: string): string {
  if (!phone || typeof phone !== 'string') {
    throw new ValidationError('Phone number is required', 'phone');
  }

  // Only strip explicit separator characters — not \s, which also matches
  // newlines/tabs and would silently accept malformed inputs.
  const cleaned = phone.replace(/[ \t\-().+]/g, '');

  if (!PHONE_REGEX.test(cleaned)) {
    throw new ValidationError(
      `Invalid phone number: "${phone}". Must be 7-15 digits in E.164 format (no leading zero).`,
      'phone',
    );
  }

  return cleaned;
}

/**
 * Check if a string is a valid phone number for the WhatsApp API.
 */
export function isValidPhoneNumber(phone: string): boolean {
  try {
    validatePhoneNumber(phone);
    return true;
  } catch {
    return false;
  }
}
