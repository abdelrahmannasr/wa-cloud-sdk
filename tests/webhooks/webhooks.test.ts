import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Webhooks } from '../../src/webhooks/webhooks.js';
import { ValidationError } from '../../src/errors/errors.js';
import type { WhatsAppConfig } from '../../src/client/types.js';

// Mock the standalone webhook functions at their source modules
vi.mock('../../src/webhooks/verify.js', () => ({
  verifyWebhook: vi.fn(),
  verifySignature: vi.fn(),
}));
vi.mock('../../src/webhooks/parser.js', () => ({
  parseWebhookPayload: vi.fn(),
}));
vi.mock('../../src/webhooks/handler.js', () => ({
  createWebhookHandler: vi.fn(),
}));
vi.mock('../../src/webhooks/middleware/express.js', () => ({
  createExpressMiddleware: vi.fn(),
}));
vi.mock('../../src/webhooks/middleware/next.js', () => ({
  createNextRouteHandler: vi.fn(),
}));

// Import the mocked functions from their source modules
import { verifyWebhook, verifySignature } from '../../src/webhooks/verify.js';
import { parseWebhookPayload } from '../../src/webhooks/parser.js';
import { createWebhookHandler } from '../../src/webhooks/handler.js';
import { createExpressMiddleware as createExpressMiddlewareUtil } from '../../src/webhooks/middleware/express.js';
import { createNextRouteHandler as createNextRouteHandlerUtil } from '../../src/webhooks/middleware/next.js';

describe('Webhooks', () => {
  const fullConfig: WhatsAppConfig = {
    accessToken: 'test-token',
    phoneNumberId: 'test-phone-id',
    appSecret: 'test-app-secret',
    webhookVerifyToken: 'test-verify-token',
  };

  const configWithoutWebhookToken: WhatsAppConfig = {
    accessToken: 'test-token',
    phoneNumberId: 'test-phone-id',
    appSecret: 'test-app-secret',
  };

  const configWithoutAppSecret: WhatsAppConfig = {
    accessToken: 'test-token',
    phoneNumberId: 'test-phone-id',
    webhookVerifyToken: 'test-verify-token',
  };

  const minimalConfig: WhatsAppConfig = {
    accessToken: 'test-token',
    phoneNumberId: 'test-phone-id',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('verify', () => {
    it('delegates to verifyWebhook with bound webhookVerifyToken', () => {
      const webhooks = new Webhooks(fullConfig);
      const params = {
        'hub.mode': 'subscribe',
        'hub.verify_token': 'test-verify-token',
        'hub.challenge': 'test-challenge',
      };

      vi.mocked(verifyWebhook).mockReturnValue('test-challenge');

      const result = webhooks.verify(params);

      expect(verifyWebhook).toHaveBeenCalledWith(params, 'test-verify-token');
      expect(result).toBe('test-challenge');
    });

    it('throws ValidationError with field "webhookVerifyToken" when token not in config', () => {
      const webhooks = new Webhooks(configWithoutWebhookToken);
      const params = {
        'hub.mode': 'subscribe',
        'hub.verify_token': 'test-verify-token',
        'hub.challenge': 'test-challenge',
      };

      expect(() => webhooks.verify(params)).toThrow(ValidationError);
      expect(() => webhooks.verify(params)).toThrow(
        'webhookVerifyToken is required for webhook verification',
      );

      try {
        webhooks.verify(params);
      } catch (error) {
        if (error instanceof ValidationError) {
          expect(error.field).toBe('webhookVerifyToken');
        }
      }
    });
  });

  describe('verifySignature', () => {
    it('delegates to imported verifySignature with bound appSecret', () => {
      const webhooks = new Webhooks(fullConfig);
      const rawBody = 'test-body';
      const signature = 'sha256=abc123';

      vi.mocked(verifySignature).mockReturnValue(true);

      const result = webhooks.verifySignature(rawBody, signature);

      expect(verifySignature).toHaveBeenCalledWith(rawBody, signature, 'test-app-secret');
      expect(result).toBe(true);
    });

    it('throws ValidationError with field "appSecret" when secret not in config', () => {
      const webhooks = new Webhooks(configWithoutAppSecret);
      const rawBody = 'test-body';
      const signature = 'sha256=abc123';

      expect(() => webhooks.verifySignature(rawBody, signature)).toThrow(ValidationError);
      expect(() => webhooks.verifySignature(rawBody, signature)).toThrow(
        'appSecret is required for webhook signature verification',
      );

      try {
        webhooks.verifySignature(rawBody, signature);
      } catch (error) {
        if (error instanceof ValidationError) {
          expect(error.field).toBe('appSecret');
        }
      }
    });
  });

  describe('parse', () => {
    it('delegates to parseWebhookPayload without config validation', () => {
      // Use minimal config to prove no validation is done
      const webhooks = new Webhooks(minimalConfig);
      const payload = {
        object: 'whatsapp_business_account',
        entry: [],
      };

      vi.mocked(parseWebhookPayload).mockReturnValue([]);

      const result = webhooks.parse(payload);

      expect(parseWebhookPayload).toHaveBeenCalledWith(payload);
      expect(result).toEqual([]);
    });
  });

  describe('createHandler', () => {
    it('delegates to createWebhookHandler with bound config', () => {
      const webhooks = new Webhooks(fullConfig);
      const callbacks = {
        onMessage: vi.fn(),
        onStatus: vi.fn(),
      };

      const mockHandler = {
        handleGet: vi.fn(),
        handlePost: vi.fn(),
      };
      vi.mocked(createWebhookHandler).mockReturnValue(mockHandler);

      const result = webhooks.createHandler(callbacks);

      expect(createWebhookHandler).toHaveBeenCalledWith(
        {
          appSecret: 'test-app-secret',
          verifyToken: 'test-verify-token',
        },
        callbacks,
      );
      expect(result).toBe(mockHandler);
    });

    it('throws ValidationError when appSecret missing', () => {
      const webhooks = new Webhooks(configWithoutAppSecret);
      const callbacks = {
        onMessage: vi.fn(),
      };

      expect(() => webhooks.createHandler(callbacks)).toThrow(ValidationError);
      expect(() => webhooks.createHandler(callbacks)).toThrow(
        'appSecret and webhookVerifyToken are required',
      );

      try {
        webhooks.createHandler(callbacks);
      } catch (error) {
        if (error instanceof ValidationError) {
          expect(error.field).toBe('appSecret');
        }
      }
    });

    it('throws ValidationError when webhookVerifyToken missing', () => {
      const webhooks = new Webhooks(configWithoutWebhookToken);
      const callbacks = {
        onMessage: vi.fn(),
      };

      expect(() => webhooks.createHandler(callbacks)).toThrow(ValidationError);
      expect(() => webhooks.createHandler(callbacks)).toThrow(
        'appSecret and webhookVerifyToken are required',
      );

      try {
        webhooks.createHandler(callbacks);
      } catch (error) {
        if (error instanceof ValidationError) {
          expect(error.field).toBe('appSecret');
        }
      }
    });
  });

  describe('createExpressMiddleware', () => {
    it('delegates correctly with bound config', () => {
      const webhooks = new Webhooks(fullConfig);
      const callbacks = {
        onMessage: vi.fn(),
        onStatus: vi.fn(),
      };

      const mockMiddleware = vi.fn();
      vi.mocked(createExpressMiddlewareUtil).mockReturnValue(mockMiddleware);

      const result = webhooks.createExpressMiddleware(callbacks);

      expect(createExpressMiddlewareUtil).toHaveBeenCalledWith(
        {
          appSecret: 'test-app-secret',
          verifyToken: 'test-verify-token',
        },
        callbacks,
      );
      expect(result).toBe(mockMiddleware);
    });

    it('throws ValidationError when config missing', () => {
      const webhooks = new Webhooks(minimalConfig);
      const callbacks = {
        onMessage: vi.fn(),
      };

      expect(() => webhooks.createExpressMiddleware(callbacks)).toThrow(ValidationError);
      expect(() => webhooks.createExpressMiddleware(callbacks)).toThrow(
        'appSecret and webhookVerifyToken are required',
      );

      try {
        webhooks.createExpressMiddleware(callbacks);
      } catch (error) {
        if (error instanceof ValidationError) {
          expect(error.field).toBe('appSecret');
        }
      }
    });
  });

  describe('createNextRouteHandler', () => {
    it('delegates correctly with bound config', () => {
      const webhooks = new Webhooks(fullConfig);
      const callbacks = {
        onMessage: vi.fn(),
        onStatus: vi.fn(),
      };

      const mockHandlers = {
        GET: vi.fn(),
        POST: vi.fn(),
      };
      vi.mocked(createNextRouteHandlerUtil).mockReturnValue(mockHandlers);

      const result = webhooks.createNextRouteHandler(callbacks);

      expect(createNextRouteHandlerUtil).toHaveBeenCalledWith(
        {
          appSecret: 'test-app-secret',
          verifyToken: 'test-verify-token',
        },
        callbacks,
      );
      expect(result).toBe(mockHandlers);
    });

    it('throws ValidationError when config missing', () => {
      const webhooks = new Webhooks(minimalConfig);
      const callbacks = {
        onMessage: vi.fn(),
      };

      expect(() => webhooks.createNextRouteHandler(callbacks)).toThrow(ValidationError);
      expect(() => webhooks.createNextRouteHandler(callbacks)).toThrow(
        'appSecret and webhookVerifyToken are required',
      );

      try {
        webhooks.createNextRouteHandler(callbacks);
      } catch (error) {
        if (error instanceof ValidationError) {
          expect(error.field).toBe('appSecret');
        }
      }
    });
  });
});
