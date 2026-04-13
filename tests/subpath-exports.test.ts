import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, it, expect } from 'vitest';
import { createRequire } from 'node:module';

const __dirname = dirname(fileURLToPath(import.meta.url));
const distExists = existsSync(resolve(__dirname, '../dist'));

describe('media subpath exports', () => {
  it('should export Media class and MEDIA_CONSTRAINTS', async () => {
    const mod = await import('../src/media/index.js');
    expect(mod.Media).toBeDefined();
    expect(typeof mod.Media).toBe('function');
    expect(mod.MEDIA_CONSTRAINTS).toBeDefined();
    expect(typeof mod.MEDIA_CONSTRAINTS).toBe('object');
  });
});

describe('templates subpath exports', () => {
  it('should export Templates class and TemplateBuilder', async () => {
    const mod = await import('../src/templates/index.js');
    expect(mod.Templates).toBeDefined();
    expect(typeof mod.Templates).toBe('function');
    expect(mod.TemplateBuilder).toBeDefined();
    expect(typeof mod.TemplateBuilder).toBe('function');
  });

  it('should export all validation constants', async () => {
    const mod = await import('../src/templates/index.js');
    expect(mod.TEMPLATE_NAME_PATTERN).toBeDefined();
    expect(typeof mod.MAX_BODY_LENGTH).toBe('number');
    expect(typeof mod.MAX_HEADER_TEXT_LENGTH).toBe('number');
    expect(typeof mod.MAX_FOOTER_LENGTH).toBe('number');
    expect(typeof mod.MAX_BUTTON_TEXT_LENGTH).toBe('number');
    expect(typeof mod.MAX_QUICK_REPLY_BUTTONS).toBe('number');
    expect(typeof mod.MAX_URL_BUTTONS).toBe('number');
    expect(typeof mod.MAX_PHONE_NUMBER_BUTTONS).toBe('number');
  });
});

describe('phone-numbers subpath exports', () => {
  it('should export PhoneNumbers class', async () => {
    const mod = await import('../src/phone-numbers/index.js');
    expect(mod.PhoneNumbers).toBeDefined();
    expect(typeof mod.PhoneNumbers).toBe('function');
  });
});

describe('multi-account subpath exports', () => {
  it('should export WhatsAppMultiAccount and all distribution strategies', async () => {
    const mod = await import('../src/multi-account/index.js');
    expect(mod.WhatsAppMultiAccount).toBeDefined();
    expect(typeof mod.WhatsAppMultiAccount).toBe('function');
    expect(mod.RoundRobinStrategy).toBeDefined();
    expect(typeof mod.RoundRobinStrategy).toBe('function');
    expect(mod.WeightedStrategy).toBeDefined();
    expect(typeof mod.WeightedStrategy).toBe('function');
    expect(mod.StickyStrategy).toBeDefined();
    expect(typeof mod.StickyStrategy).toBe('function');
  });
});

describe('flows subpath exports', () => {
  it('should export Flows class', async () => {
    const mod = await import('../src/flows/index.js');
    expect(mod.Flows).toBeDefined();
    expect(typeof mod.Flows).toBe('function');
  });

  it('should export all validation constants', async () => {
    const mod = await import('../src/flows/index.js');
    expect(typeof mod.MAX_FLOW_NAME_LENGTH).toBe('number');
    expect(typeof mod.MAX_FLOW_CATEGORIES).toBe('number');
    expect(typeof mod.MAX_FLOW_JSON_BYTES).toBe('number');
  });
});

describe('existing subpath exports (regression)', () => {
  it('should export all error classes from errors subpath', async () => {
    const mod = await import('../src/errors/index.js');
    expect(mod.WhatsAppError).toBeDefined();
    expect(mod.ApiError).toBeDefined();
    expect(mod.RateLimitError).toBeDefined();
    expect(mod.AuthenticationError).toBeDefined();
    expect(mod.ValidationError).toBeDefined();
    expect(mod.WebhookVerificationError).toBeDefined();
    expect(mod.MediaError).toBeDefined();
  });

  it('should export Messages class from messages subpath', async () => {
    const mod = await import('../src/messages/index.js');
    expect(mod.Messages).toBeDefined();
    expect(typeof mod.Messages).toBe('function');
  });

  it('should export core webhook functions from webhooks subpath', async () => {
    const mod = await import('../src/webhooks/index.js');
    expect(mod.parseWebhookPayload).toBeDefined();
    expect(mod.verifyWebhook).toBeDefined();
    expect(mod.verifySignature).toBeDefined();
    expect(mod.createWebhookHandler).toBeDefined();
    expect(mod.Webhooks).toBeDefined();
    expect(mod.createExpressMiddleware).toBeDefined();
    expect(mod.createNextRouteHandler).toBeDefined();
  });
});

describe('main entry point re-exports', () => {
  it('should re-export all module classes and utilities', async () => {
    const mod = await import('../src/index.js');
    expect(mod.WhatsApp).toBeDefined();
    expect(mod.HttpClient).toBeDefined();
    expect(mod.WhatsAppError).toBeDefined();
    expect(mod.ApiError).toBeDefined();
    expect(mod.Messages).toBeDefined();
    expect(mod.Media).toBeDefined();
    expect(mod.MEDIA_CONSTRAINTS).toBeDefined();
    expect(mod.Templates).toBeDefined();
    expect(mod.TemplateBuilder).toBeDefined();
    expect(mod.TEMPLATE_NAME_PATTERN).toBeDefined();
    expect(mod.Webhooks).toBeDefined();
    expect(mod.parseWebhookPayload).toBeDefined();
    expect(mod.PhoneNumbers).toBeDefined();
    expect(mod.Flows).toBeDefined();
    expect(mod.MAX_FLOW_NAME_LENGTH).toBeDefined();
    expect(mod.WhatsAppMultiAccount).toBeDefined();
    expect(mod.RoundRobinStrategy).toBeDefined();
    expect(mod.WeightedStrategy).toBeDefined();
    expect(mod.StickyStrategy).toBeDefined();
    expect(mod.TokenBucketRateLimiter).toBeDefined();
    expect(mod.withRetry).toBeDefined();
    expect(mod.validatePhoneNumber).toBeDefined();
    expect(mod.extractConversationPricing).toBeDefined();
  });
});

// CJS require() uses built dist/ output since createRequire cannot resolve TypeScript source.
// Skipped when dist/ is missing (e.g., fresh clone without `pnpm build`).
describe.skipIf(!distExists)('CJS require() resolution', () => {
  const require = createRequire(import.meta.url);

  it.each([
    ['media', ['Media', 'MEDIA_CONSTRAINTS']],
    ['templates', ['Templates', 'TemplateBuilder']],
    ['phone-numbers', ['PhoneNumbers']],
    ['flows', ['Flows', 'MAX_FLOW_NAME_LENGTH']],
    ['multi-account', ['WhatsAppMultiAccount', 'RoundRobinStrategy']],
    ['errors', ['WhatsAppError']],
    ['messages', ['Messages']],
    ['webhooks', ['Webhooks', 'parseWebhookPayload']],
  ] as const)('should resolve %s subpath via require()', (subpath, expectedExports) => {
    const mod = require(`../dist/${subpath}/index.cjs`) as Record<string, unknown>;
    for (const name of expectedExports) {
      expect(mod[name]).toBeDefined();
    }
  });
});

describe('dual import (main + subpath)', () => {
  it.each([
    ['../src/media/index.js', ['Media']],
    ['../src/templates/index.js', ['Templates', 'TemplateBuilder']],
    ['../src/phone-numbers/index.js', ['PhoneNumbers']],
    ['../src/flows/index.js', ['Flows', 'MAX_FLOW_NAME_LENGTH']],
    ['../src/multi-account/index.js', ['WhatsAppMultiAccount', 'RoundRobinStrategy']],
    ['../src/errors/index.js', ['WhatsAppError', 'ApiError']],
    ['../src/messages/index.js', ['Messages']],
    ['../src/webhooks/index.js', ['Webhooks', 'parseWebhookPayload']],
  ] as const)('should produce identical references for %s', async (subpath, expectedExports) => {
    const main = await import('../src/index.js');
    const sub = (await import(subpath)) as Record<string, unknown>;
    for (const name of expectedExports) {
      expect(main[name as keyof typeof main]).toBe(sub[name]);
    }
  });
});
