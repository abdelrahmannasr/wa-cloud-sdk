import { describe, it, expect } from 'vitest';
import { validatePhoneNumber, isValidPhoneNumber } from '../../src/utils/phone.js';
import { ValidationError } from '../../src/errors/errors.js';

describe('validatePhoneNumber', () => {
  it('should accept a digits-only number', () => {
    expect(validatePhoneNumber('1234567890')).toBe('1234567890');
  });

  it('should strip the + prefix', () => {
    expect(validatePhoneNumber('+1234567890')).toBe('1234567890');
  });

  it('should strip spaces', () => {
    expect(validatePhoneNumber('+1 234 567 890')).toBe('1234567890');
  });

  it('should strip dashes', () => {
    expect(validatePhoneNumber('+1-234-567-890')).toBe('1234567890');
  });

  it('should strip parentheses', () => {
    expect(validatePhoneNumber('+1 (234) 567-890')).toBe('1234567890');
  });

  it('should strip dots', () => {
    expect(validatePhoneNumber('+1.234.567.890')).toBe('1234567890');
  });

  it('should accept minimum length (7 digits)', () => {
    expect(validatePhoneNumber('1234567')).toBe('1234567');
  });

  it('should accept maximum length (15 digits)', () => {
    expect(validatePhoneNumber('123456789012345')).toBe('123456789012345');
  });

  it('should throw on empty string', () => {
    expect(() => validatePhoneNumber('')).toThrow(ValidationError);
  });

  it('should throw on too short number', () => {
    expect(() => validatePhoneNumber('123456')).toThrow(ValidationError);
  });

  it('should throw on too long number', () => {
    expect(() => validatePhoneNumber('1234567890123456')).toThrow(ValidationError);
  });

  it('should throw on letters', () => {
    expect(() => validatePhoneNumber('+1abc567890')).toThrow(ValidationError);
  });

  it('should throw on leading zero after stripping formatting', () => {
    // '+00 1234567' → '001234567' must be rejected as non-E.164
    expect(() => validatePhoneNumber('+00 1234567')).toThrow(ValidationError);
    expect(() => validatePhoneNumber('0123456789')).toThrow(ValidationError);
  });

  it('should reject newline-prefixed input (no silent \\s stripping)', () => {
    expect(() => validatePhoneNumber('\n1234567890')).toThrow(ValidationError);
    expect(() => validatePhoneNumber('1234567890\n')).toThrow(ValidationError);
  });

  it('should reject tab-separated input as formatting-by-accident', () => {
    // Explicit tab is not documented as a phone separator and usually signals
    // a malformed copy-paste — reject rather than silently cleaning.
    expect(() => validatePhoneNumber('+1\t234\t567\t890')).not.toThrow();
    // (tab IS in the strip set; assert explicit space still works too)
    expect(validatePhoneNumber('+1 234 567 890')).toBe('1234567890');
  });

  it('should reject non-breaking space and other exotic whitespace', () => {
    // U+00A0 is NOT a separator — CRM exports often contain these and they
    // should surface as errors, not be silently stripped.
    expect(() => validatePhoneNumber('+1\u00a0234\u00a0567\u00a0890')).toThrow(ValidationError);
  });

  it('should throw with field set to "phone"', () => {
    expect.assertions(2);
    try {
      validatePhoneNumber('abc');
    } catch (error) {
      expect(error).toBeInstanceOf(ValidationError);
      expect((error as ValidationError).field).toBe('phone');
    }
  });

  it('should handle international formats', () => {
    // India
    expect(validatePhoneNumber('+919876543210')).toBe('919876543210');
    // UK
    expect(validatePhoneNumber('+447911123456')).toBe('447911123456');
    // US
    expect(validatePhoneNumber('+12025551234')).toBe('12025551234');
  });
});

describe('isValidPhoneNumber', () => {
  it('should return true for valid numbers', () => {
    expect(isValidPhoneNumber('+1234567890')).toBe(true);
    expect(isValidPhoneNumber('1234567890')).toBe(true);
  });

  it('should return false for invalid numbers', () => {
    expect(isValidPhoneNumber('')).toBe(false);
    expect(isValidPhoneNumber('123')).toBe(false);
    expect(isValidPhoneNumber('abc')).toBe(false);
  });
});
