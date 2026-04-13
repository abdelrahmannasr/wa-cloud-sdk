import { describe, it, expect } from 'vitest';
import { TemplateBuilder } from '../../src/templates/builder.js';
import { ValidationError } from '../../src/errors/errors.js';

describe('TemplateBuilder', () => {
  describe('valid builds', () => {
    it('should build minimal template (name + language + category + body)', () => {
      const request = new TemplateBuilder()
        .setName('order_confirmation')
        .setLanguage('en_US')
        .setCategory('UTILITY')
        .addBody('Your order has been confirmed')
        .build();

      expect(request).toEqual({
        name: 'order_confirmation',
        language: 'en_US',
        category: 'UTILITY',
        components: [
          {
            type: 'BODY',
            text: 'Your order has been confirmed',
          },
        ],
      });
    });

    it('should build full template with all components', () => {
      const request = new TemplateBuilder()
        .setName('summer_sale')
        .setLanguage('en_US')
        .setCategory('MARKETING')
        .allowCategoryChange(true)
        .addHeaderText('Summer Sale!')
        .addBody('Hi {{1}}, enjoy {{2}}% off all items')
        .addFooter('Terms apply')
        .addQuickReplyButton('Yes')
        .addQuickReplyButton('No')
        .addUrlButton('Shop Now', 'https://example.com/shop')
        .build();

      expect(request).toEqual({
        name: 'summer_sale',
        language: 'en_US',
        category: 'MARKETING',
        allow_category_change: true,
        components: [
          {
            type: 'HEADER',
            format: 'TEXT',
            text: 'Summer Sale!',
          },
          {
            type: 'BODY',
            text: 'Hi {{1}}, enjoy {{2}}% off all items',
          },
          {
            type: 'FOOTER',
            text: 'Terms apply',
          },
          {
            type: 'BUTTONS',
            buttons: [
              { type: 'QUICK_REPLY', text: 'Yes' },
              { type: 'QUICK_REPLY', text: 'No' },
              { type: 'URL', text: 'Shop Now', url: 'https://example.com/shop' },
            ],
          },
        ],
      });
    });

    it('should build template with header media format', () => {
      const request = new TemplateBuilder()
        .setName('product_launch')
        .setLanguage('en_US')
        .setCategory('MARKETING')
        .addHeaderMedia('IMAGE', { header_handle: ['https://example.com/image.jpg'] })
        .addBody('Check out our new product!')
        .build();

      expect(request).toEqual({
        name: 'product_launch',
        language: 'en_US',
        category: 'MARKETING',
        components: [
          {
            type: 'HEADER',
            format: 'IMAGE',
            example: { header_handle: ['https://example.com/image.jpg'] },
          },
          {
            type: 'BODY',
            text: 'Check out our new product!',
          },
        ],
      });
    });

    it('should build template with body examples', () => {
      const request = new TemplateBuilder()
        .setName('personalized_greeting')
        .setLanguage('en_US')
        .setCategory('UTILITY')
        .addBody('Hello {{1}}, welcome back!', { body_text: [['John']] })
        .build();

      expect(request).toEqual({
        name: 'personalized_greeting',
        language: 'en_US',
        category: 'UTILITY',
        components: [
          {
            type: 'BODY',
            text: 'Hello {{1}}, welcome back!',
            example: { body_text: [['John']] },
          },
        ],
      });
    });
  });

  describe('validation tests', () => {
    it('should throw ValidationError when name is missing', () => {
      expect(() => {
        new TemplateBuilder().setLanguage('en_US').setCategory('UTILITY').addBody('Test').build();
      }).toThrow(ValidationError);

      try {
        new TemplateBuilder().setLanguage('en_US').setCategory('UTILITY').addBody('Test').build();
      } catch (error) {
        expect(error).toBeInstanceOf(ValidationError);
        expect((error as ValidationError).field).toBe('name');
        expect((error as ValidationError).message).toContain('name');
      }
    });

    it('should throw ValidationError when language is missing', () => {
      expect(() => {
        new TemplateBuilder()
          .setName('test_template')
          .setCategory('UTILITY')
          .addBody('Test')
          .build();
      }).toThrow(ValidationError);

      try {
        new TemplateBuilder()
          .setName('test_template')
          .setCategory('UTILITY')
          .addBody('Test')
          .build();
      } catch (error) {
        expect(error).toBeInstanceOf(ValidationError);
        expect((error as ValidationError).field).toBe('language');
      }
    });

    it('should throw ValidationError when category is missing', () => {
      expect(() => {
        new TemplateBuilder().setName('test_template').setLanguage('en_US').addBody('Test').build();
      }).toThrow(ValidationError);

      try {
        new TemplateBuilder().setName('test_template').setLanguage('en_US').addBody('Test').build();
      } catch (error) {
        expect(error).toBeInstanceOf(ValidationError);
        expect((error as ValidationError).field).toBe('category');
      }
    });

    it('should throw ValidationError when body is missing', () => {
      expect(() => {
        new TemplateBuilder()
          .setName('test_template')
          .setLanguage('en_US')
          .setCategory('UTILITY')
          .build();
      }).toThrow(ValidationError);

      try {
        new TemplateBuilder()
          .setName('test_template')
          .setLanguage('en_US')
          .setCategory('UTILITY')
          .build();
      } catch (error) {
        expect(error).toBeInstanceOf(ValidationError);
        expect((error as ValidationError).field).toBe('body');
      }
    });

    it('should throw ValidationError for invalid name format (uppercase)', () => {
      expect(() => {
        new TemplateBuilder()
          .setName('TestTemplate')
          .setLanguage('en_US')
          .setCategory('UTILITY')
          .addBody('Test')
          .build();
      }).toThrow(ValidationError);

      try {
        new TemplateBuilder()
          .setName('TestTemplate')
          .setLanguage('en_US')
          .setCategory('UTILITY')
          .addBody('Test')
          .build();
      } catch (error) {
        expect((error as ValidationError).field).toBe('name');
        expect((error as ValidationError).message).toContain('lowercase');
      }
    });

    it('should throw ValidationError for invalid name format (spaces)', () => {
      expect(() => {
        new TemplateBuilder()
          .setName('test template')
          .setLanguage('en_US')
          .setCategory('UTILITY')
          .addBody('Test')
          .build();
      }).toThrow(ValidationError);
    });

    it('should throw ValidationError for name too long (>512 chars)', () => {
      const longName = 'a'.repeat(513);
      expect(() => {
        new TemplateBuilder()
          .setName(longName)
          .setLanguage('en_US')
          .setCategory('UTILITY')
          .addBody('Test')
          .build();
      }).toThrow(ValidationError);
    });

    it('should throw ValidationError for body exceeding 1024 chars', () => {
      const longBody = 'a'.repeat(1025);
      expect(() => {
        new TemplateBuilder()
          .setName('test_template')
          .setLanguage('en_US')
          .setCategory('UTILITY')
          .addBody(longBody)
          .build();
      }).toThrow(ValidationError);

      try {
        new TemplateBuilder()
          .setName('test_template')
          .setLanguage('en_US')
          .setCategory('UTILITY')
          .addBody(longBody)
          .build();
      } catch (error) {
        expect((error as ValidationError).field).toBe('body');
        expect((error as ValidationError).message).toContain('1024');
      }
    });

    it('should throw ValidationError for header text exceeding 60 chars', () => {
      const longHeader = 'a'.repeat(61);
      expect(() => {
        new TemplateBuilder()
          .setName('test_template')
          .setLanguage('en_US')
          .setCategory('UTILITY')
          .addHeaderText(longHeader)
          .addBody('Test')
          .build();
      }).toThrow(ValidationError);

      try {
        new TemplateBuilder()
          .setName('test_template')
          .setLanguage('en_US')
          .setCategory('UTILITY')
          .addHeaderText(longHeader)
          .addBody('Test')
          .build();
      } catch (error) {
        expect((error as ValidationError).field).toBe('header');
        expect((error as ValidationError).message).toContain('60');
      }
    });

    it('should throw ValidationError for footer exceeding 60 chars', () => {
      const longFooter = 'a'.repeat(61);
      expect(() => {
        new TemplateBuilder()
          .setName('test_template')
          .setLanguage('en_US')
          .setCategory('UTILITY')
          .addBody('Test')
          .addFooter(longFooter)
          .build();
      }).toThrow(ValidationError);

      try {
        new TemplateBuilder()
          .setName('test_template')
          .setLanguage('en_US')
          .setCategory('UTILITY')
          .addBody('Test')
          .addFooter(longFooter)
          .build();
      } catch (error) {
        expect((error as ValidationError).field).toBe('footer');
        expect((error as ValidationError).message).toContain('60');
      }
    });

    it('should throw ValidationError for button text exceeding 20 chars', () => {
      const longButtonText = 'a'.repeat(21);
      expect(() => {
        new TemplateBuilder()
          .setName('test_template')
          .setLanguage('en_US')
          .setCategory('UTILITY')
          .addBody('Test')
          .addQuickReplyButton(longButtonText)
          .build();
      }).toThrow(ValidationError);

      try {
        new TemplateBuilder()
          .setName('test_template')
          .setLanguage('en_US')
          .setCategory('UTILITY')
          .addBody('Test')
          .addQuickReplyButton(longButtonText)
          .build();
      } catch (error) {
        expect((error as ValidationError).field).toBe('button');
        expect((error as ValidationError).message).toContain('20');
      }
    });

    it('should throw ValidationError for exceeding 3 quick-reply buttons', () => {
      expect(() => {
        new TemplateBuilder()
          .setName('test_template')
          .setLanguage('en_US')
          .setCategory('UTILITY')
          .addBody('Test')
          .addQuickReplyButton('Option 1')
          .addQuickReplyButton('Option 2')
          .addQuickReplyButton('Option 3')
          .addQuickReplyButton('Option 4')
          .build();
      }).toThrow(ValidationError);

      try {
        new TemplateBuilder()
          .setName('test_template')
          .setLanguage('en_US')
          .setCategory('UTILITY')
          .addBody('Test')
          .addQuickReplyButton('Option 1')
          .addQuickReplyButton('Option 2')
          .addQuickReplyButton('Option 3')
          .addQuickReplyButton('Option 4')
          .build();
      } catch (error) {
        expect((error as ValidationError).field).toBe('buttons');
        expect((error as ValidationError).message).toContain('3');
        expect((error as ValidationError).message).toContain('quick');
      }
    });

    it('should throw ValidationError for exceeding 2 URL buttons', () => {
      expect(() => {
        new TemplateBuilder()
          .setName('test_template')
          .setLanguage('en_US')
          .setCategory('UTILITY')
          .addBody('Test')
          .addUrlButton('Link 1', 'https://example.com/1')
          .addUrlButton('Link 2', 'https://example.com/2')
          .addUrlButton('Link 3', 'https://example.com/3')
          .build();
      }).toThrow(ValidationError);

      try {
        new TemplateBuilder()
          .setName('test_template')
          .setLanguage('en_US')
          .setCategory('UTILITY')
          .addBody('Test')
          .addUrlButton('Link 1', 'https://example.com/1')
          .addUrlButton('Link 2', 'https://example.com/2')
          .addUrlButton('Link 3', 'https://example.com/3')
          .build();
      } catch (error) {
        expect((error as ValidationError).field).toBe('buttons');
        expect((error as ValidationError).message).toContain('2');
        expect((error as ValidationError).message).toContain('URL');
      }
    });

    it('should throw ValidationError for exceeding 1 phone-number button', () => {
      expect(() => {
        new TemplateBuilder()
          .setName('test_template')
          .setLanguage('en_US')
          .setCategory('UTILITY')
          .addBody('Test')
          .addPhoneNumberButton('Call 1', '+1234567890')
          .addPhoneNumberButton('Call 2', '+0987654321')
          .build();
      }).toThrow(ValidationError);

      try {
        new TemplateBuilder()
          .setName('test_template')
          .setLanguage('en_US')
          .setCategory('UTILITY')
          .addBody('Test')
          .addPhoneNumberButton('Call 1', '+1234567890')
          .addPhoneNumberButton('Call 2', '+0987654321')
          .build();
      } catch (error) {
        expect((error as ValidationError).field).toBe('buttons');
        expect((error as ValidationError).message).toContain('1');
        expect((error as ValidationError).message).toContain('phone');
      }
    });
  });

  describe('sealing after build', () => {
    it('should throw ValidationError if a setter is called after build', () => {
      const builder = new TemplateBuilder()
        .setName('sealed_template')
        .setLanguage('en_US')
        .setCategory('UTILITY')
        .addBody('hello');

      builder.build();

      expect(() => builder.addBody('mutation after build')).toThrow(ValidationError);
      expect(() => builder.setName('different')).toThrow(ValidationError);
      expect(() => builder.addQuickReplyButton('Yes')).toThrow(ValidationError);
    });

    it('should return independent component arrays on repeated build calls', () => {
      const builder = new TemplateBuilder()
        .setName('repeat_build')
        .setLanguage('en_US')
        .setCategory('UTILITY')
        .addBody('hello')
        .addQuickReplyButton('Yes');

      const first = builder.build();
      const second = builder.build();

      expect(first.components).not.toBe(second.components);
      expect(first.components).toEqual(second.components);
    });

    it('should detach body example from caller mutation after addBody', () => {
      const example: { body_text: string[][] } = { body_text: [['John']] };

      const request = new TemplateBuilder()
        .setName('detach_example')
        .setLanguage('en_US')
        .setCategory('UTILITY')
        .addBody('Hi {{1}}', example)
        .build();

      // Mutate the caller-owned example payload after build.
      example.body_text[0]![0] = 'Attacker';
      example.body_text.push(['Extra']);

      const body = request.components.find((c) => c.type === 'BODY');
      expect(body?.example).toEqual({ body_text: [['John']] });
    });

    it('should freeze the returned request so the components array is immutable', () => {
      const request = new TemplateBuilder()
        .setName('frozen_request')
        .setLanguage('en_US')
        .setCategory('UTILITY')
        .addBody('hello')
        .addQuickReplyButton('Yes')
        .build();

      expect(Object.isFrozen(request)).toBe(true);
      expect(Object.isFrozen(request.components)).toBe(true);
      expect(() => {
        (request.components as unknown as Array<unknown>).push({ type: 'BODY', text: 'evil' });
      }).toThrow();
      const buttons = request.components.find((c) => c.type === 'BUTTONS');
      expect(buttons && Object.isFrozen(buttons)).toBe(true);
      expect(buttons?.buttons && Object.isFrozen(buttons.buttons)).toBe(true);
    });
  });
});
