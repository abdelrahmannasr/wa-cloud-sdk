import { describe, it, expect } from 'vitest';
import {
  WhatsAppError,
  ApiError,
  RateLimitError,
  AuthenticationError,
  ValidationError,
  NotFoundError,
  WebhookVerificationError,
  MediaError,
} from '../../src/errors/errors.js';

describe('WhatsAppError', () => {
  it('should set message and default code', () => {
    const error = new WhatsAppError('test error');
    expect(error.message).toBe('test error');
    expect(error.code).toBe('WHATSAPP_ERROR');
    expect(error.name).toBe('WhatsAppError');
  });

  it('should accept a custom code', () => {
    const error = new WhatsAppError('test', 'CUSTOM_CODE');
    expect(error.code).toBe('CUSTOM_CODE');
  });

  it('should be an instance of Error', () => {
    const error = new WhatsAppError('test');
    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(WhatsAppError);
  });
});

describe('ApiError', () => {
  it('should set all properties', () => {
    const error = new ApiError('not found', 404, 'GraphMethodException', {
      errorSubcode: 33,
      fbTraceId: 'trace123',
    });
    expect(error.message).toBe('not found');
    expect(error.statusCode).toBe(404);
    expect(error.errorType).toBe('GraphMethodException');
    expect(error.errorSubcode).toBe(33);
    expect(error.fbTraceId).toBe('trace123');
    expect(error.code).toBe('API_ERROR');
    expect(error.name).toBe('ApiError');
  });

  it('should work without optional params', () => {
    const error = new ApiError('bad request', 400, 'OAuthException');
    expect(error.errorSubcode).toBeUndefined();
    expect(error.fbTraceId).toBeUndefined();
  });

  it('should be an instance of WhatsAppError and Error', () => {
    const error = new ApiError('test', 500, 'ServerException');
    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(WhatsAppError);
    expect(error).toBeInstanceOf(ApiError);
  });
});

describe('RateLimitError', () => {
  it('should set retryAfterMs', () => {
    const error = new RateLimitError('rate limited', 5000);
    expect(error.retryAfterMs).toBe(5000);
    expect(error.statusCode).toBe(429);
    expect(error.errorType).toBe('OAuthException');
    expect(error.code).toBe('RATE_LIMIT_ERROR');
    expect(error.name).toBe('RateLimitError');
  });

  it('should work without retryAfterMs', () => {
    const error = new RateLimitError('rate limited');
    expect(error.retryAfterMs).toBeUndefined();
  });

  it('should be an instance of ApiError and WhatsAppError', () => {
    const error = new RateLimitError('test');
    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(WhatsAppError);
    expect(error).toBeInstanceOf(ApiError);
    expect(error).toBeInstanceOf(RateLimitError);
  });
});

describe('AuthenticationError', () => {
  it('should set properties correctly', () => {
    const error = new AuthenticationError('invalid token');
    expect(error.message).toBe('invalid token');
    expect(error.statusCode).toBe(401);
    expect(error.errorType).toBe('OAuthException');
    expect(error.code).toBe('AUTHENTICATION_ERROR');
    expect(error.name).toBe('AuthenticationError');
  });

  it('should be an instance of ApiError and WhatsAppError', () => {
    const error = new AuthenticationError('test');
    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(WhatsAppError);
    expect(error).toBeInstanceOf(ApiError);
    expect(error).toBeInstanceOf(AuthenticationError);
  });
});

describe('ValidationError', () => {
  it('should set field', () => {
    const error = new ValidationError('invalid phone', 'phone');
    expect(error.message).toBe('invalid phone');
    expect(error.field).toBe('phone');
    expect(error.code).toBe('VALIDATION_ERROR');
    expect(error.name).toBe('ValidationError');
  });

  it('should work without field', () => {
    const error = new ValidationError('invalid input');
    expect(error.field).toBeUndefined();
  });

  it('should be an instance of WhatsAppError but not ApiError', () => {
    const error = new ValidationError('test');
    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(WhatsAppError);
    expect(error).not.toBeInstanceOf(ApiError);
  });
});

describe('NotFoundError', () => {
  it('should set resource and code', () => {
    const error = new NotFoundError('profile missing', 'businessProfile');
    expect(error.message).toBe('profile missing');
    expect(error.resource).toBe('businessProfile');
    expect(error.code).toBe('NOT_FOUND_ERROR');
    expect(error.name).toBe('NotFoundError');
  });

  it('should work without resource', () => {
    const error = new NotFoundError('not found');
    expect(error.resource).toBeUndefined();
  });

  it('should be an instance of WhatsAppError but not ApiError', () => {
    const error = new NotFoundError('test');
    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(WhatsAppError);
    expect(error).not.toBeInstanceOf(ApiError);
  });
});

describe('WebhookVerificationError', () => {
  it('should set properties correctly', () => {
    const error = new WebhookVerificationError('signature mismatch');
    expect(error.message).toBe('signature mismatch');
    expect(error.code).toBe('WEBHOOK_VERIFICATION_ERROR');
    expect(error.name).toBe('WebhookVerificationError');
  });

  it('should be an instance of WhatsAppError but not ApiError', () => {
    const error = new WebhookVerificationError('test');
    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(WhatsAppError);
    expect(error).not.toBeInstanceOf(ApiError);
  });
});

describe('MediaError', () => {
  it('should set mediaType', () => {
    const error = new MediaError('file too large', 'image');
    expect(error.message).toBe('file too large');
    expect(error.mediaType).toBe('image');
    expect(error.code).toBe('MEDIA_ERROR');
    expect(error.name).toBe('MediaError');
  });

  it('should work without mediaType', () => {
    const error = new MediaError('upload failed');
    expect(error.mediaType).toBeUndefined();
  });

  it('should be an instance of WhatsAppError but not ApiError', () => {
    const error = new MediaError('test');
    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(WhatsAppError);
    expect(error).not.toBeInstanceOf(ApiError);
  });
});

describe('Error hierarchy catch behavior', () => {
  it('should catch all SDK errors with WhatsAppError', () => {
    const errors = [
      new ApiError('api', 500, 'ServerException'),
      new RateLimitError('rate'),
      new AuthenticationError('auth'),
      new ValidationError('validation'),
      new WebhookVerificationError('webhook'),
      new MediaError('media'),
    ];

    for (const error of errors) {
      expect(error).toBeInstanceOf(WhatsAppError);
    }
  });

  it('should catch API-related errors with ApiError', () => {
    const apiErrors = [
      new ApiError('api', 500, 'ServerException'),
      new RateLimitError('rate'),
      new AuthenticationError('auth'),
    ];

    const nonApiErrors = [
      new ValidationError('validation'),
      new WebhookVerificationError('webhook'),
      new MediaError('media'),
    ];

    for (const error of apiErrors) {
      expect(error).toBeInstanceOf(ApiError);
    }

    for (const error of nonApiErrors) {
      expect(error).not.toBeInstanceOf(ApiError);
    }
  });
});
