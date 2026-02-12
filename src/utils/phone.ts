import { ValidationError } from '../errors/errors.js';

const PHONE_REGEX = /^\d{7,15}$/;

/**
 * Validate and normalize a phone number for the WhatsApp API.
 * Strips common formatting characters (+, spaces, dashes, parentheses, dots).
 * Returns digits-only string as required by Meta's API.
 *
 * @throws ValidationError if the number is invalid
 */
export function validatePhoneNumber(phone: string): string {
  if (!phone || typeof phone !== 'string') {
    throw new ValidationError('Phone number is required', 'phone');
  }

  // Strip formatting characters
  const cleaned = phone.replace(/[\s\-().+]/g, '');

  if (!PHONE_REGEX.test(cleaned)) {
    throw new ValidationError(
      `Invalid phone number: "${phone}". Must be 7-15 digits in E.164 format.`,
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
