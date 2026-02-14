import type {
  CreateTemplateRequest,
  CreateTemplateComponent,
  CreateTemplateButton,
  TemplateCategory,
} from './types.js';
import {
  TEMPLATE_NAME_PATTERN,
  MAX_BODY_LENGTH,
  MAX_HEADER_TEXT_LENGTH,
  MAX_FOOTER_LENGTH,
  MAX_BUTTON_TEXT_LENGTH,
  MAX_QUICK_REPLY_BUTTONS,
  MAX_URL_BUTTONS,
  MAX_PHONE_NUMBER_BUTTONS,
} from './types.js';
import { ValidationError } from '../errors/errors.js';

/**
 * Fluent builder for creating WhatsApp message templates
 *
 * Provides a chainable API for constructing template creation requests with
 * client-side validation. Use this builder to avoid manually constructing the
 * complex nested JSON structure required by the Meta API.
 *
 * @example
 * ```typescript
 * // Minimal template
 * const template = new TemplateBuilder()
 *   .setName('order_confirmation')
 *   .setLanguage('en_US')
 *   .setCategory('UTILITY')
 *   .addBody('Your order {{1}} has been confirmed')
 *   .build();
 *
 * // Full template with all components
 * const template = new TemplateBuilder()
 *   .setName('summer_sale')
 *   .setLanguage('en_US')
 *   .setCategory('MARKETING')
 *   .allowCategoryChange(true)
 *   .addHeaderText('Summer Sale!')
 *   .addBody('Hi {{1}}, enjoy {{2}}% off all items')
 *   .addFooter('Terms and conditions apply')
 *   .addQuickReplyButton('Shop Now')
 *   .addQuickReplyButton('Not Interested')
 *   .addUrlButton('View Catalog', 'https://example.com/catalog')
 *   .build();
 * ```
 */
export class TemplateBuilder {
  private name?: string;
  private language?: string;
  private category?: TemplateCategory;
  private allowCategoryChangeFlag?: boolean;
  private components: CreateTemplateComponent[] = [];

  /**
   * Set the template name
   *
   * Must be lowercase alphanumeric with underscores only (no spaces, no uppercase).
   * Maximum 512 characters.
   *
   * @param name - Template name (e.g., 'order_confirmation')
   * @returns This builder instance for chaining
   *
   * @example
   * ```typescript
   * builder.setName('order_confirmation');
   * ```
   */
  setName(name: string): this {
    this.name = name;
    return this;
  }

  /**
   * Set the template language
   *
   * Uses ISO language codes (e.g., 'en_US', 'es_ES', 'pt_BR').
   *
   * @param language - ISO language code
   * @returns This builder instance for chaining
   *
   * @example
   * ```typescript
   * builder.setLanguage('en_US');
   * ```
   */
  setLanguage(language: string): this {
    this.language = language;
    return this;
  }

  /**
   * Set the template category
   *
   * Categories determine template approval requirements and usage limits.
   *
   * @param category - Template category ('MARKETING', 'UTILITY', or 'AUTHENTICATION')
   * @returns This builder instance for chaining
   *
   * @example
   * ```typescript
   * builder.setCategory('UTILITY');
   * ```
   */
  setCategory(category: TemplateCategory): this {
    this.category = category;
    return this;
  }

  /**
   * Allow Meta to automatically change the category during review
   *
   * When true, Meta may reclassify the template if they determine a different
   * category is more appropriate.
   *
   * @param allow - Whether to allow category changes
   * @returns This builder instance for chaining
   *
   * @example
   * ```typescript
   * builder.allowCategoryChange(true);
   * ```
   */
  allowCategoryChange(allow: boolean): this {
    this.allowCategoryChangeFlag = allow;
    return this;
  }

  /**
   * Add a text header component
   *
   * Maximum 60 characters. Headers are optional but appear at the top of the message.
   *
   * @param text - Header text
   * @returns This builder instance for chaining
   *
   * @example
   * ```typescript
   * builder.addHeaderText('Order Update');
   * ```
   */
  addHeaderText(text: string): this {
    this.components.push({
      type: 'HEADER',
      format: 'TEXT',
      text,
    });
    return this;
  }

  /**
   * Add a media header component
   *
   * Use for image, video, or document headers. Provide example media URLs for review.
   *
   * @param format - Media format ('IMAGE', 'VIDEO', or 'DOCUMENT')
   * @param example - Optional example media URLs for Meta review
   * @returns This builder instance for chaining
   *
   * @example
   * ```typescript
   * builder.addHeaderMedia('IMAGE', {
   *   header_handle: ['https://example.com/image.jpg']
   * });
   * ```
   */
  addHeaderMedia(format: string, example?: unknown): this {
    if (example !== undefined) {
      this.components.push({
        type: 'HEADER',
        format,
        example,
      });
    } else {
      this.components.push({
        type: 'HEADER',
        format,
      });
    }
    return this;
  }

  /**
   * Add a body component
   *
   * Required for all templates. Maximum 1024 characters.
   * Use {{1}}, {{2}}, etc. for variable placeholders.
   *
   * @param text - Body text with optional placeholders
   * @param example - Optional example values for placeholders
   * @returns This builder instance for chaining
   *
   * @example
   * ```typescript
   * builder.addBody('Hi {{1}}, your order {{2}} is ready!', {
   *   body_text: [['John', 'ORD-123']]
   * });
   * ```
   */
  addBody(text: string, example?: unknown): this {
    if (example !== undefined) {
      this.components.push({
        type: 'BODY',
        text,
        example,
      });
    } else {
      this.components.push({
        type: 'BODY',
        text,
      });
    }
    return this;
  }

  /**
   * Add a footer component
   *
   * Optional footer text displayed at the bottom. Maximum 60 characters.
   *
   * @param text - Footer text
   * @returns This builder instance for chaining
   *
   * @example
   * ```typescript
   * builder.addFooter('Terms and conditions apply');
   * ```
   */
  addFooter(text: string): this {
    this.components.push({
      type: 'FOOTER',
      text,
    });
    return this;
  }

  /**
   * Add a quick-reply button
   *
   * Quick-reply buttons let users respond with predefined text.
   * Maximum 3 quick-reply buttons per template.
   * Maximum 20 characters per button text.
   *
   * @param text - Button text
   * @returns This builder instance for chaining
   *
   * @example
   * ```typescript
   * builder.addQuickReplyButton('Yes')
   *        .addQuickReplyButton('No');
   * ```
   */
  addQuickReplyButton(text: string): this {
    this.addButton({ type: 'QUICK_REPLY', text });
    return this;
  }

  /**
   * Add a URL button
   *
   * URL buttons direct users to a web page.
   * Maximum 2 URL buttons per template.
   * Maximum 20 characters per button text.
   *
   * @param text - Button text
   * @param url - Button URL (can include {{1}} placeholder)
   * @returns This builder instance for chaining
   *
   * @example
   * ```typescript
   * builder.addUrlButton('Track Order', 'https://example.com/track/{{1}}');
   * ```
   */
  addUrlButton(text: string, url: string): this {
    this.addButton({ type: 'URL', text, url });
    return this;
  }

  /**
   * Add a phone number button
   *
   * Phone number buttons let users call a number.
   * Maximum 1 phone number button per template.
   * Maximum 20 characters per button text.
   *
   * @param text - Button text
   * @param phoneNumber - Phone number in E.164 format
   * @returns This builder instance for chaining
   *
   * @example
   * ```typescript
   * builder.addPhoneNumberButton('Call Support', '+1234567890');
   * ```
   */
  addPhoneNumberButton(text: string, phoneNumber: string): this {
    this.addButton({ type: 'PHONE_NUMBER', text, phone_number: phoneNumber });
    return this;
  }

  /**
   * Internal helper to add a button to the BUTTONS component
   *
   * Creates or updates the BUTTONS component with the new button.
   */
  private addButton(button: CreateTemplateButton): void {
    // Find existing BUTTONS component index
    const buttonsIndex = this.components.findIndex((c) => c.type === 'BUTTONS');

    if (buttonsIndex !== -1) {
      // Replace existing BUTTONS component with updated version
      const existingComponent = this.components[buttonsIndex];
      if (existingComponent) {
        const existingButtons = existingComponent.buttons || [];
        this.components[buttonsIndex] = {
          type: 'BUTTONS',
          buttons: [...existingButtons, button],
        };
      }
    } else {
      // Create new BUTTONS component
      this.components.push({
        type: 'BUTTONS',
        buttons: [button],
      });
    }
  }

  /**
   * Build and validate the template creation request
   *
   * Performs client-side validation before returning the request object:
   * - Checks all required fields are present (name, language, category, body)
   * - Validates name format (lowercase alphanumeric + underscores, max 512 chars)
   * - Validates text length constraints (body <= 1024, header/footer <= 60, buttons <= 20)
   * - Validates button count limits (quick-reply <= 3, URL <= 2, phone <= 1)
   *
   * @returns The validated template creation request
   * @throws {ValidationError} If any validation fails
   *
   * @example
   * ```typescript
   * const request = builder
   *   .setName('order_confirmation')
   *   .setLanguage('en_US')
   *   .setCategory('UTILITY')
   *   .addBody('Your order has been confirmed')
   *   .build();
   *
   * await templates.create(request);
   * ```
   */
  build(): CreateTemplateRequest {
    // Validate required fields
    if (!this.name) {
      throw new ValidationError('Template name is required', 'name');
    }
    if (!this.language) {
      throw new ValidationError('Template language is required', 'language');
    }
    if (!this.category) {
      throw new ValidationError('Template category is required', 'category');
    }

    // Validate body component exists
    const bodyComponent = this.components.find((c) => c.type === 'BODY');
    if (!bodyComponent) {
      throw new ValidationError('Template must have a body component (use addBody)', 'body');
    }

    // Validate name format
    if (!TEMPLATE_NAME_PATTERN.test(this.name)) {
      throw new ValidationError(
        'Template name must be lowercase alphanumeric with underscores only (no spaces, no uppercase), max 512 characters',
        'name',
      );
    }

    // Validate text length constraints
    for (const component of this.components) {
      if (component.type === 'BODY' && component.text) {
        if (component.text.length > MAX_BODY_LENGTH) {
          throw new ValidationError(
            `Body text exceeds maximum length of ${MAX_BODY_LENGTH} characters`,
            'body',
          );
        }
      }

      if (component.type === 'HEADER' && component.format === 'TEXT' && component.text) {
        if (component.text.length > MAX_HEADER_TEXT_LENGTH) {
          throw new ValidationError(
            `Header text exceeds maximum length of ${MAX_HEADER_TEXT_LENGTH} characters`,
            'header',
          );
        }
      }

      if (component.type === 'FOOTER' && component.text) {
        if (component.text.length > MAX_FOOTER_LENGTH) {
          throw new ValidationError(
            `Footer text exceeds maximum length of ${MAX_FOOTER_LENGTH} characters`,
            'footer',
          );
        }
      }

      // Validate button text lengths and counts
      if (component.type === 'BUTTONS' && component.buttons) {
        for (const button of component.buttons) {
          if (button.text.length > MAX_BUTTON_TEXT_LENGTH) {
            throw new ValidationError(
              `Button text exceeds maximum length of ${MAX_BUTTON_TEXT_LENGTH} characters`,
              'button',
            );
          }
        }

        // Count button types
        const quickReplyCount = component.buttons.filter((b) => b.type === 'QUICK_REPLY').length;
        const urlCount = component.buttons.filter((b) => b.type === 'URL').length;
        const phoneCount = component.buttons.filter((b) => b.type === 'PHONE_NUMBER').length;

        if (quickReplyCount > MAX_QUICK_REPLY_BUTTONS) {
          throw new ValidationError(
            `Template exceeds maximum of ${MAX_QUICK_REPLY_BUTTONS} quick-reply buttons`,
            'buttons',
          );
        }

        if (urlCount > MAX_URL_BUTTONS) {
          throw new ValidationError(
            `Template exceeds maximum of ${MAX_URL_BUTTONS} URL buttons`,
            'buttons',
          );
        }

        if (phoneCount > MAX_PHONE_NUMBER_BUTTONS) {
          throw new ValidationError(
            `Template exceeds maximum of ${MAX_PHONE_NUMBER_BUTTONS} phone-number button`,
            'buttons',
          );
        }
      }
    }

    // Build the request
    if (this.allowCategoryChangeFlag !== undefined) {
      return {
        name: this.name,
        language: this.language,
        category: this.category,
        allow_category_change: this.allowCategoryChangeFlag,
        components: this.components,
      };
    }

    return {
      name: this.name,
      language: this.language,
      category: this.category,
      components: this.components,
    };
  }
}
