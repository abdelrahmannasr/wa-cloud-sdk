/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Flows } from '../../src/flows/flows.js';
import type { HttpClient } from '../../src/client/http-client.js';
import { ValidationError } from '../../src/errors/errors.js';

const BUSINESS_ACCOUNT_ID = '123456789';

function createMockClient(): {
  client: HttpClient;
  getSpy: ReturnType<typeof vi.fn>;
  postSpy: ReturnType<typeof vi.fn>;
  deleteSpy: ReturnType<typeof vi.fn>;
  uploadSpy: ReturnType<typeof vi.fn>;
} {
  const getSpy = vi.fn();
  const postSpy = vi.fn();
  const deleteSpy = vi.fn();
  const uploadSpy = vi.fn();

  const client = {
    get: getSpy,
    post: postSpy,
    delete: deleteSpy,
    upload: uploadSpy,
  } as unknown as HttpClient;

  return { client, getSpy, postSpy, deleteSpy, uploadSpy };
}

describe('Flows', () => {
  let client: HttpClient;
  let getSpy: ReturnType<typeof vi.fn>;
  let postSpy: ReturnType<typeof vi.fn>;
  let deleteSpy: ReturnType<typeof vi.fn>;
  let uploadSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    ({ client, getSpy, postSpy, deleteSpy, uploadSpy } = createMockClient());
  });

  describe('constructor', () => {
    it('should create an instance with valid businessAccountId', () => {
      const flows = new Flows(client, BUSINESS_ACCOUNT_ID);
      expect(flows).toBeInstanceOf(Flows);
    });

    it('should throw ValidationError for empty string', () => {
      try {
        new Flows(client, '');
        expect.fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(ValidationError);
        expect((error as ValidationError).field).toBe('businessAccountId');
      }
    });

    it('should throw ValidationError for whitespace-only string', () => {
      try {
        new Flows(client, '   ');
        expect.fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(ValidationError);
        expect((error as ValidationError).field).toBe('businessAccountId');
      }
    });

    it('should throw ValidationError for undefined coerced to string', () => {
      try {
        new Flows(client, undefined as unknown as string);
        expect.fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(ValidationError);
      }
    });

    it('should throw ValidationError for null coerced to string', () => {
      try {
        new Flows(client, null as unknown as string);
        expect.fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(ValidationError);
      }
    });
  });

  describe('create', () => {
    it('should POST to {wabaId}/flows with request body', async () => {
      const mockResponse = { data: { id: 'flow_123', success: true } };
      postSpy.mockResolvedValue(mockResponse);

      const flows = new Flows(client, BUSINESS_ACCOUNT_ID);
      const result = await flows.create({
        name: 'signup_form',
        categories: ['SIGN_UP'],
      });

      expect(postSpy).toHaveBeenCalledWith(
        `${BUSINESS_ACCOUNT_ID}/flows`,
        { name: 'signup_form', categories: ['SIGN_UP'] },
        undefined,
      );
      expect(result.data.id).toBe('flow_123');
    });

    it('should pass through validation_errors from response', async () => {
      const validationErrors = [
        { error: 'INVALID', error_type: 'FLOW_JSON_ERROR', message: 'bad json' },
      ];
      postSpy.mockResolvedValue({
        data: { id: 'flow_123', success: true, validation_errors: validationErrors },
      });

      const flows = new Flows(client, BUSINESS_ACCOUNT_ID);
      const result = await flows.create({
        name: 'test',
        categories: ['OTHER'],
      });

      expect(result.data.validation_errors).toStrictEqual(validationErrors);
    });

    it('should forward requestOptions', async () => {
      postSpy.mockResolvedValue({ data: { id: 'flow_123', success: true } });

      const flows = new Flows(client, BUSINESS_ACCOUNT_ID);
      const requestOptions = { timeout: 5000 };
      await flows.create({ name: 'test', categories: ['OTHER'] }, requestOptions);

      expect(postSpy).toHaveBeenCalledWith(
        `${BUSINESS_ACCOUNT_ID}/flows`,
        expect.any(Object),
        requestOptions,
      );
    });
  });

  describe('publish', () => {
    it('should POST to {flowId}/publish with empty body', async () => {
      postSpy.mockResolvedValue({ data: { success: true } });

      const flows = new Flows(client, BUSINESS_ACCOUNT_ID);
      await flows.publish('flow_123');

      expect(postSpy).toHaveBeenCalledWith('flow_123/publish', {}, undefined);
    });

    it('should forward requestOptions', async () => {
      postSpy.mockResolvedValue({ data: { success: true } });

      const flows = new Flows(client, BUSINESS_ACCOUNT_ID);
      const requestOptions = { timeout: 10000 };
      await flows.publish('flow_123', requestOptions);

      expect(postSpy).toHaveBeenCalledWith('flow_123/publish', {}, requestOptions);
    });
  });
});
