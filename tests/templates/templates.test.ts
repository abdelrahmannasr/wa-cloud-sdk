/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Templates } from '../../src/templates/templates.js';
import type { HttpClient } from '../../src/client/http-client.js';
import { ValidationError } from '../../src/errors/errors.js';

const BUSINESS_ACCOUNT_ID = '123456789';

function createMockClient(): {
  client: HttpClient;
  getSpy: ReturnType<typeof vi.fn>;
  postSpy: ReturnType<typeof vi.fn>;
  deleteSpy: ReturnType<typeof vi.fn>;
} {
  const getSpy = vi.fn();
  const postSpy = vi.fn();
  const deleteSpy = vi.fn();

  const client = {
    get: getSpy,
    post: postSpy,
    delete: deleteSpy,
  } as unknown as HttpClient;

  return { client, getSpy, postSpy, deleteSpy };
}

describe('Templates', () => {
  let client: HttpClient;
  let getSpy: ReturnType<typeof vi.fn>;
  let postSpy: ReturnType<typeof vi.fn>;
  let deleteSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    const mock = createMockClient();
    client = mock.client;
    getSpy = mock.getSpy;
    postSpy = mock.postSpy;
    deleteSpy = mock.deleteSpy;
  });

  describe('constructor', () => {
    it('should create instance with valid businessAccountId', () => {
      const templates = new Templates(client, BUSINESS_ACCOUNT_ID);
      expect(templates).toBeInstanceOf(Templates);
    });

    it('should throw ValidationError when businessAccountId is empty string', () => {
      expect(() => new Templates(client, '')).toThrow(ValidationError);
      expect(() => new Templates(client, '')).toThrow(
        'businessAccountId is required and cannot be empty',
      );

      try {
        new Templates(client, '');
      } catch (error) {
        expect(error).toBeInstanceOf(ValidationError);
        expect((error as ValidationError).field).toBe('businessAccountId');
      }
    });

    it('should throw ValidationError when businessAccountId is whitespace only', () => {
      expect(() => new Templates(client, '   ')).toThrow(ValidationError);
      expect(() => new Templates(client, '   ')).toThrow(
        'businessAccountId is required and cannot be empty',
      );
    });

    it('should throw ValidationError when businessAccountId is undefined', () => {
      expect(() => new Templates(client, undefined as unknown as string)).toThrow(ValidationError);
      expect(() => new Templates(client, undefined as unknown as string)).toThrow(
        'businessAccountId is required and cannot be empty',
      );
    });

    it('should throw ValidationError when businessAccountId is null', () => {
      expect(() => new Templates(client, null as unknown as string)).toThrow(ValidationError);
      expect(() => new Templates(client, null as unknown as string)).toThrow(
        'businessAccountId is required and cannot be empty',
      );
    });
  });

  describe('list', () => {
    let templates: Templates;

    beforeEach(() => {
      templates = new Templates(client, BUSINESS_ACCOUNT_ID);
    });

    it('should call client.get with correct path for list without params', async () => {
      const mockResponse = {
        data: {
          data: [],
          paging: {},
        },
        status: 200,
        headers: new Headers(),
      };
      getSpy.mockResolvedValue(mockResponse);

      await templates.list();

      expect(getSpy).toHaveBeenCalledWith(`${BUSINESS_ACCOUNT_ID}/message_templates`, undefined);
    });

    it('should pass pagination params (limit, after, before) as query params', async () => {
      const mockResponse = {
        data: { data: [], paging: {} },
        status: 200,
        headers: new Headers(),
      };
      getSpy.mockResolvedValue(mockResponse);

      await templates.list({
        limit: 10,
        after: 'cursor_after',
        before: 'cursor_before',
      });

      expect(getSpy).toHaveBeenCalledWith(
        `${BUSINESS_ACCOUNT_ID}/message_templates`,
        expect.objectContaining({
          params: expect.objectContaining({
            limit: '10',
            after: 'cursor_after',
            before: 'cursor_before',
          }),
        }),
      );
    });

    it('should pass status filter param', async () => {
      const mockResponse = {
        data: { data: [], paging: {} },
        status: 200,
        headers: new Headers(),
      };
      getSpy.mockResolvedValue(mockResponse);

      await templates.list({ status: 'APPROVED' });

      expect(getSpy).toHaveBeenCalledWith(
        `${BUSINESS_ACCOUNT_ID}/message_templates`,
        expect.objectContaining({
          params: expect.objectContaining({
            status: 'APPROVED',
          }),
        }),
      );
    });

    it('should pass name filter param', async () => {
      const mockResponse = {
        data: { data: [], paging: {} },
        status: 200,
        headers: new Headers(),
      };
      getSpy.mockResolvedValue(mockResponse);

      await templates.list({ name: 'order_confirmation' });

      expect(getSpy).toHaveBeenCalledWith(
        `${BUSINESS_ACCOUNT_ID}/message_templates`,
        expect.objectContaining({
          params: expect.objectContaining({
            name: 'order_confirmation',
          }),
        }),
      );
    });

    it('should pass fields as comma-joined string', async () => {
      const mockResponse = {
        data: { data: [], paging: {} },
        status: 200,
        headers: new Headers(),
      };
      getSpy.mockResolvedValue(mockResponse);

      await templates.list({ fields: ['name', 'status', 'language'] });

      expect(getSpy).toHaveBeenCalledWith(
        `${BUSINESS_ACCOUNT_ID}/message_templates`,
        expect.objectContaining({
          params: expect.objectContaining({
            fields: 'name,status,language',
          }),
        }),
      );
    });

    it('should return typed TemplateListResponse', async () => {
      const mockTemplate = {
        id: '123456',
        name: 'order_confirmation',
        language: 'en_US',
        status: 'APPROVED' as const,
        category: 'UTILITY' as const,
        components: [],
      };
      const mockResponse = {
        data: {
          data: [mockTemplate],
          paging: { cursors: { after: 'xyz' } },
        },
        status: 200,
        headers: new Headers(),
      };
      getSpy.mockResolvedValue(mockResponse);

      const result = await templates.list();

      expect(result.data.data).toEqual([mockTemplate]);
      expect(result.data.paging).toEqual({ cursors: { after: 'xyz' } });
    });

    it('should forward requestOptions', async () => {
      const mockResponse = {
        data: { data: [], paging: {} },
        status: 200,
        headers: new Headers(),
      };
      getSpy.mockResolvedValue(mockResponse);

      const requestOptions = {
        timeout: 5000,
        signal: new AbortController().signal,
      };

      await templates.list({ limit: 10 }, requestOptions);

      expect(getSpy).toHaveBeenCalledWith(
        `${BUSINESS_ACCOUNT_ID}/message_templates`,
        expect.objectContaining({
          timeout: 5000,
          signal: requestOptions.signal,
        }),
      );
    });
  });

  describe('get', () => {
    let templates: Templates;

    beforeEach(() => {
      templates = new Templates(client, BUSINESS_ACCOUNT_ID);
    });

    it('should call client.get with correct path and name query param', async () => {
      const mockResponse = {
        data: { data: [], paging: {} },
        status: 200,
        headers: new Headers(),
      };
      getSpy.mockResolvedValue(mockResponse);

      await templates.get('order_confirmation');

      expect(getSpy).toHaveBeenCalledWith(
        `${BUSINESS_ACCOUNT_ID}/message_templates`,
        expect.objectContaining({
          params: expect.objectContaining({
            name: 'order_confirmation',
          }),
        }),
      );
    });

    it('should pass optional language filter', async () => {
      const mockResponse = {
        data: { data: [], paging: {} },
        status: 200,
        headers: new Headers(),
      };
      getSpy.mockResolvedValue(mockResponse);

      await templates.get('order_confirmation', { language: 'en_US' });

      expect(getSpy).toHaveBeenCalledWith(
        `${BUSINESS_ACCOUNT_ID}/message_templates`,
        expect.objectContaining({
          params: expect.objectContaining({
            name: 'order_confirmation',
            language: 'en_US',
          }),
        }),
      );
    });

    it('should return typed TemplateListResponse', async () => {
      const mockTemplate = {
        id: '123456',
        name: 'order_confirmation',
        language: 'en_US',
        status: 'APPROVED' as const,
        category: 'UTILITY' as const,
        components: [],
      };
      const mockResponse = {
        data: {
          data: [mockTemplate],
          paging: {},
        },
        status: 200,
        headers: new Headers(),
      };
      getSpy.mockResolvedValue(mockResponse);

      const result = await templates.get('order_confirmation');

      expect(result.data.data).toEqual([mockTemplate]);
    });

    it('should forward requestOptions', async () => {
      const mockResponse = {
        data: { data: [], paging: {} },
        status: 200,
        headers: new Headers(),
      };
      getSpy.mockResolvedValue(mockResponse);

      const requestOptions = {
        timeout: 5000,
        signal: new AbortController().signal,
      };

      await templates.get('order_confirmation', undefined, requestOptions);

      expect(getSpy).toHaveBeenCalledWith(
        `${BUSINESS_ACCOUNT_ID}/message_templates`,
        expect.objectContaining({
          timeout: 5000,
          signal: requestOptions.signal,
        }),
      );
    });
  });

  describe('create', () => {
    let templates: Templates;

    beforeEach(() => {
      templates = new Templates(client, BUSINESS_ACCOUNT_ID);
    });

    it('should call client.post with correct path and template body', async () => {
      const mockResponse = {
        data: {
          id: '123456',
          status: 'PENDING' as const,
          category: 'UTILITY' as const,
        },
        status: 200,
        headers: new Headers(),
      };
      postSpy.mockResolvedValue(mockResponse);

      const templateRequest = {
        name: 'order_confirmation',
        language: 'en_US',
        category: 'UTILITY' as const,
        components: [
          {
            type: 'BODY',
            text: 'Your order has been confirmed',
          },
        ],
      };

      await templates.create(templateRequest);

      expect(postSpy).toHaveBeenCalledWith(
        `${BUSINESS_ACCOUNT_ID}/message_templates`,
        templateRequest,
        undefined,
      );
    });

    it('should return typed CreateTemplateResponse', async () => {
      const mockResponse = {
        data: {
          id: '123456',
          status: 'PENDING' as const,
          category: 'UTILITY' as const,
        },
        status: 200,
        headers: new Headers(),
      };
      postSpy.mockResolvedValue(mockResponse);

      const templateRequest = {
        name: 'order_confirmation',
        language: 'en_US',
        category: 'UTILITY' as const,
        components: [
          {
            type: 'BODY',
            text: 'Your order has been confirmed',
          },
        ],
      };

      const result = await templates.create(templateRequest);

      expect(result.data.id).toBe('123456');
      expect(result.data.status).toBe('PENDING');
      expect(result.data.category).toBe('UTILITY');
    });

    it('should forward requestOptions', async () => {
      const mockResponse = {
        data: {
          id: '123456',
          status: 'PENDING' as const,
          category: 'UTILITY' as const,
        },
        status: 200,
        headers: new Headers(),
      };
      postSpy.mockResolvedValue(mockResponse);

      const templateRequest = {
        name: 'order_confirmation',
        language: 'en_US',
        category: 'UTILITY' as const,
        components: [
          {
            type: 'BODY',
            text: 'Your order has been confirmed',
          },
        ],
      };

      const requestOptions = {
        timeout: 5000,
        signal: new AbortController().signal,
      };

      await templates.create(templateRequest, requestOptions);

      expect(postSpy).toHaveBeenCalledWith(
        `${BUSINESS_ACCOUNT_ID}/message_templates`,
        templateRequest,
        requestOptions,
      );
    });
  });

  describe('update', () => {
    let templates: Templates;

    beforeEach(() => {
      templates = new Templates(client, BUSINESS_ACCOUNT_ID);
    });

    it('should call client.post with correct path and components body', async () => {
      const mockResponse = {
        data: {
          id: '123456',
          status: 'PENDING' as const,
          category: 'UTILITY' as const,
        },
        status: 200,
        headers: new Headers(),
      };
      postSpy.mockResolvedValue(mockResponse);

      const components = [
        {
          type: 'BODY',
          text: 'Updated body text',
        },
      ];

      await templates.update('123456', components);

      expect(postSpy).toHaveBeenCalledWith('123456', { components }, undefined);
    });

    it('should return typed CreateTemplateResponse', async () => {
      const mockResponse = {
        data: {
          id: '123456',
          status: 'PENDING' as const,
          category: 'UTILITY' as const,
        },
        status: 200,
        headers: new Headers(),
      };
      postSpy.mockResolvedValue(mockResponse);

      const components = [
        {
          type: 'BODY',
          text: 'Updated body text',
        },
      ];

      const result = await templates.update('123456', components);

      expect(result.data.id).toBe('123456');
      expect(result.data.status).toBe('PENDING');
      expect(result.data.category).toBe('UTILITY');
    });

    it('should forward requestOptions', async () => {
      const mockResponse = {
        data: {
          id: '123456',
          status: 'PENDING' as const,
          category: 'UTILITY' as const,
        },
        status: 200,
        headers: new Headers(),
      };
      postSpy.mockResolvedValue(mockResponse);

      const components = [
        {
          type: 'BODY',
          text: 'Updated body text',
        },
      ];

      const requestOptions = {
        timeout: 5000,
        signal: new AbortController().signal,
      };

      await templates.update('123456', components, requestOptions);

      expect(postSpy).toHaveBeenCalledWith('123456', { components }, requestOptions);
    });
  });

  describe('delete', () => {
    let templates: Templates;

    beforeEach(() => {
      templates = new Templates(client, BUSINESS_ACCOUNT_ID);
    });

    it('should call client.delete with correct path and name query param', async () => {
      const mockResponse = {
        data: {
          success: true,
        },
        status: 200,
        headers: new Headers(),
      };
      deleteSpy.mockResolvedValue(mockResponse);

      await templates.delete('order_confirmation');

      expect(deleteSpy).toHaveBeenCalledWith(
        `${BUSINESS_ACCOUNT_ID}/message_templates`,
        expect.objectContaining({
          params: expect.objectContaining({
            name: 'order_confirmation',
          }),
        }),
      );
    });

    it('should pass optional hsm_id param from TemplateDeleteOptions', async () => {
      const mockResponse = {
        data: {
          success: true,
        },
        status: 200,
        headers: new Headers(),
      };
      deleteSpy.mockResolvedValue(mockResponse);

      await templates.delete('order_confirmation', { hsmId: 'hsm_123' });

      expect(deleteSpy).toHaveBeenCalledWith(
        `${BUSINESS_ACCOUNT_ID}/message_templates`,
        expect.objectContaining({
          params: expect.objectContaining({
            name: 'order_confirmation',
            hsm_id: 'hsm_123',
          }),
        }),
      );
    });

    it('should return typed TemplateDeleteResponse', async () => {
      const mockResponse = {
        data: {
          success: true,
        },
        status: 200,
        headers: new Headers(),
      };
      deleteSpy.mockResolvedValue(mockResponse);

      const result = await templates.delete('order_confirmation');

      expect(result.data.success).toBe(true);
    });

    it('should forward requestOptions', async () => {
      const mockResponse = {
        data: {
          success: true,
        },
        status: 200,
        headers: new Headers(),
      };
      deleteSpy.mockResolvedValue(mockResponse);

      const requestOptions = {
        timeout: 5000,
        signal: new AbortController().signal,
      };

      await templates.delete('order_confirmation', undefined, requestOptions);

      expect(deleteSpy).toHaveBeenCalledWith(
        `${BUSINESS_ACCOUNT_ID}/message_templates`,
        expect.objectContaining({
          timeout: 5000,
          signal: requestOptions.signal,
        }),
      );
    });
  });
});
