import { describe, it, expect } from 'vitest';
import { extractConversationPricing } from '../../src/utils/pricing.js';
import type { StatusEvent } from '../../src/webhooks/types.js';

function makeStatusEvent(overrides: {
  pricing?: { billable: boolean; pricing_model: string; category: string };
  conversation?: {
    id: string;
    origin?: { type: string };
    expiration_timestamp?: string;
  };
}): StatusEvent {
  return {
    type: 'status',
    metadata: { phoneNumberId: '123', displayPhoneNumber: '+1234567890' },
    status: {
      id: 'wamid.test',
      status: 'delivered',
      timestamp: '1234567890',
      recipient_id: '9876543210',
      ...overrides,
    },
    timestamp: new Date(),
  };
}

describe('extractConversationPricing', () => {
  it('should return structured pricing when pricing and conversation data are present', () => {
    const event = makeStatusEvent({
      pricing: { billable: true, pricing_model: 'CBP', category: 'marketing' },
      conversation: {
        id: 'conv_123',
        origin: { type: 'business_initiated' },
        expiration_timestamp: '1234567890',
      },
    });

    const result = extractConversationPricing(event);

    expect(result).toEqual({
      billable: true,
      pricingModel: 'CBP',
      category: 'marketing',
      conversationId: 'conv_123',
      originType: 'business_initiated',
      expirationTimestamp: '1234567890',
    });
  });

  it('should return null when no pricing metadata is present', () => {
    const event = makeStatusEvent({});

    const result = extractConversationPricing(event);

    expect(result).toBeNull();
  });

  it('should return pricing without conversation fields when conversation is absent', () => {
    const event = makeStatusEvent({
      pricing: { billable: false, pricing_model: 'CBP', category: 'utility' },
    });

    const result = extractConversationPricing(event);

    expect(result).toEqual({
      billable: false,
      pricingModel: 'CBP',
      category: 'utility',
    });
    expect(result).not.toHaveProperty('conversationId');
    expect(result).not.toHaveProperty('originType');
    expect(result).not.toHaveProperty('expirationTimestamp');
  });

  it('should preserve unrecognized category values as raw strings', () => {
    const event = makeStatusEvent({
      pricing: { billable: true, pricing_model: 'CBP', category: 'referral_conversion' },
      conversation: { id: 'conv_456' },
    });

    const result = extractConversationPricing(event);

    expect(result).not.toBeNull();
    expect(result!.category).toBe('referral_conversion');
  });

  it('should return pricing from a failed status event', () => {
    const event: StatusEvent = {
      type: 'status',
      metadata: { phoneNumberId: '123', displayPhoneNumber: '+1234567890' },
      status: {
        id: 'wamid.test',
        status: 'failed',
        timestamp: '1234567890',
        recipient_id: '9876543210',
        pricing: { billable: true, pricing_model: 'CBP', category: 'authentication' },
        conversation: { id: 'conv_789', origin: { type: 'user_initiated' } },
        errors: [{ code: 131047, title: 'Message failed to send' }],
      },
      timestamp: new Date(),
    };

    const result = extractConversationPricing(event);

    expect(result).toEqual({
      billable: true,
      pricingModel: 'CBP',
      category: 'authentication',
      conversationId: 'conv_789',
      originType: 'user_initiated',
    });
  });

  it('should handle conversation without origin or expiration', () => {
    const event = makeStatusEvent({
      pricing: { billable: true, pricing_model: 'CBP', category: 'service' },
      conversation: { id: 'conv_minimal' },
    });

    const result = extractConversationPricing(event);

    expect(result).toEqual({
      billable: true,
      pricingModel: 'CBP',
      category: 'service',
      conversationId: 'conv_minimal',
    });
    expect(result).not.toHaveProperty('originType');
    expect(result).not.toHaveProperty('expirationTimestamp');
  });
});
