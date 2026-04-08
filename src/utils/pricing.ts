import type { StatusEvent } from '../webhooks/types.js';

// (string & {}) allows unknown future values while preserving autocomplete for known ones

/** Known pricing categories from Meta's WhatsApp Cloud API. */
export type PricingCategory =
  | 'authentication'
  | 'marketing'
  | 'utility'
  | 'service'
  | 'referral_conversion'
  | (string & {});

/** Known pricing models from Meta's WhatsApp Cloud API. */
export type PricingModel = 'CBP' | (string & {});

/** Structured conversation pricing extracted from a webhook status event. */
export interface ConversationPricing {
  readonly billable: boolean;
  readonly pricingModel: PricingModel;
  readonly category: PricingCategory;
  readonly conversationId?: string;
  readonly originType?: string;
  readonly expirationTimestamp?: string;
}

/**
 * Extract structured pricing information from a webhook status event.
 *
 * Returns `null` when the status event contains no pricing metadata.
 *
 * @example
 * ```ts
 * const pricing = extractConversationPricing(statusEvent);
 * if (pricing) {
 *   console.log(`Billable: ${pricing.billable}, Category: ${pricing.category}`);
 * }
 * ```
 */
export function extractConversationPricing(event: StatusEvent): ConversationPricing | null {
  const { pricing, conversation } = event.status;

  if (!pricing) {
    return null;
  }

  return {
    billable: pricing.billable,
    pricingModel: pricing.pricing_model,
    category: pricing.category,
    ...(conversation?.id !== undefined && { conversationId: conversation.id }),
    ...(conversation?.origin?.type !== undefined && { originType: conversation.origin.type }),
    ...(conversation?.expiration_timestamp !== undefined && {
      expirationTimestamp: conversation.expiration_timestamp,
    }),
  };
}
