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
      const requestOptions = { timeoutMs: 5000 };
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
      const requestOptions = { timeoutMs: 10000 };
      await flows.publish('flow_123', requestOptions);

      expect(postSpy).toHaveBeenCalledWith('flow_123/publish', {}, requestOptions);
    });
  });

  describe('list', () => {
    it('should GET {wabaId}/flows with no params', async () => {
      getSpy.mockResolvedValue({ data: { data: [] } });

      const flows = new Flows(client, BUSINESS_ACCOUNT_ID);
      await flows.list();

      expect(getSpy).toHaveBeenCalledWith(`${BUSINESS_ACCOUNT_ID}/flows`, undefined);
    });

    it('should pass limit, after, and before as query params', async () => {
      getSpy.mockResolvedValue({ data: { data: [] } });

      const flows = new Flows(client, BUSINESS_ACCOUNT_ID);
      await flows.list({ limit: 10, after: 'cursor_abc', before: 'cursor_xyz' });

      expect(getSpy).toHaveBeenCalledWith(`${BUSINESS_ACCOUNT_ID}/flows`, {
        params: { limit: '10', after: 'cursor_abc', before: 'cursor_xyz' },
      });
    });

    it('should join fields with comma', async () => {
      getSpy.mockResolvedValue({ data: { data: [] } });

      const flows = new Flows(client, BUSINESS_ACCOUNT_ID);
      await flows.list({ fields: ['id', 'name', 'status'] });

      expect(getSpy).toHaveBeenCalledWith(`${BUSINESS_ACCOUNT_ID}/flows`, {
        params: { fields: 'id,name,status' },
      });
    });

    it('should forward requestOptions', async () => {
      getSpy.mockResolvedValue({ data: { data: [] } });

      const flows = new Flows(client, BUSINESS_ACCOUNT_ID);
      await flows.list({ limit: 5 }, { timeoutMs: 3000 });

      expect(getSpy).toHaveBeenCalledWith(`${BUSINESS_ACCOUNT_ID}/flows`, {
        timeoutMs: 3000,
        params: { limit: '5' },
      });
    });

    it('should return typed response with paging', async () => {
      const mockData = {
        data: [{ id: 'flow_1', name: 'test', status: 'DRAFT', categories: ['OTHER'] }],
        paging: { cursors: { after: 'abc', before: 'xyz' } },
      };
      getSpy.mockResolvedValue({ data: mockData });

      const flows = new Flows(client, BUSINESS_ACCOUNT_ID);
      const result = await flows.list();

      expect(result.data.data[0]?.id).toBe('flow_1');
      expect(result.data.paging?.cursors?.after).toBe('abc');
    });
  });

  describe('get', () => {
    it('should GET {flowId} with no options', async () => {
      getSpy.mockResolvedValue({ data: { id: 'flow_123', name: 'test' } });

      const flows = new Flows(client, BUSINESS_ACCOUNT_ID);
      await flows.get('flow_123');

      expect(getSpy).toHaveBeenCalledWith('flow_123', undefined);
    });

    it('should join fields with comma when provided', async () => {
      getSpy.mockResolvedValue({ data: { id: 'flow_123' } });

      const flows = new Flows(client, BUSINESS_ACCOUNT_ID);
      await flows.get('flow_123', { fields: ['id', 'name', 'status'] });

      expect(getSpy).toHaveBeenCalledWith('flow_123', {
        params: { fields: 'id,name,status' },
      });
    });

    it('should forward requestOptions', async () => {
      getSpy.mockResolvedValue({ data: { id: 'flow_123' } });

      const flows = new Flows(client, BUSINESS_ACCOUNT_ID);
      await flows.get('flow_123', undefined, { timeoutMs: 5000 });

      expect(getSpy).toHaveBeenCalledWith('flow_123', { timeoutMs: 5000 });
    });

    it('should merge fields and requestOptions', async () => {
      getSpy.mockResolvedValue({ data: { id: 'flow_123' } });

      const flows = new Flows(client, BUSINESS_ACCOUNT_ID);
      await flows.get('flow_123', { fields: ['name'] }, { timeoutMs: 5000 });

      expect(getSpy).toHaveBeenCalledWith('flow_123', {
        timeoutMs: 5000,
        params: { fields: 'name' },
      });
    });
  });

  describe('updateMetadata', () => {
    it('should POST to {flowId} with updates body', async () => {
      postSpy.mockResolvedValue({ data: { success: true } });

      const flows = new Flows(client, BUSINESS_ACCOUNT_ID);
      await flows.updateMetadata('flow_123', {
        name: 'updated_name',
        categories: ['LEAD_GENERATION'],
      });

      expect(postSpy).toHaveBeenCalledWith(
        'flow_123',
        { name: 'updated_name', categories: ['LEAD_GENERATION'] },
        undefined,
      );
    });

    it('should support partial updates', async () => {
      postSpy.mockResolvedValue({ data: { success: true } });

      const flows = new Flows(client, BUSINESS_ACCOUNT_ID);
      await flows.updateMetadata('flow_123', { name: 'new_name' });

      expect(postSpy).toHaveBeenCalledWith('flow_123', { name: 'new_name' }, undefined);
    });

    it('should forward requestOptions', async () => {
      postSpy.mockResolvedValue({ data: { success: true } });

      const flows = new Flows(client, BUSINESS_ACCOUNT_ID);
      await flows.updateMetadata('flow_123', { name: 'x' }, { timeoutMs: 5000 });

      expect(postSpy).toHaveBeenCalledWith('flow_123', { name: 'x' }, { timeoutMs: 5000 });
    });
  });

  describe('updateAssets', () => {
    it('should upload string flow_json as FormData', async () => {
      uploadSpy.mockResolvedValue({ data: { success: true } });

      const flows = new Flows(client, BUSINESS_ACCOUNT_ID);
      await flows.updateAssets('flow_123', { flow_json: '{"screens":[]}' });

      expect(uploadSpy).toHaveBeenCalledWith('flow_123/assets', expect.any(FormData), undefined);
      const formData = uploadSpy.mock.calls[0]![1] as FormData;
      expect(formData.get('name')).toBe('flow.json');
      expect(formData.get('asset_type')).toBe('FLOW_JSON');
    });

    it('should stringify object flow_json', async () => {
      uploadSpy.mockResolvedValue({ data: { success: true } });

      const flowJson = { version: '3.0', screens: [] };
      const flows = new Flows(client, BUSINESS_ACCOUNT_ID);
      await flows.updateAssets('flow_123', { flow_json: flowJson });

      const formData = uploadSpy.mock.calls[0]![1] as FormData;
      const file = formData.get('file') as Blob;
      const text = await file.text();
      expect(text).toBe(JSON.stringify(flowJson));
    });

    it('should use default name and asset_type', async () => {
      uploadSpy.mockResolvedValue({ data: { success: true } });

      const flows = new Flows(client, BUSINESS_ACCOUNT_ID);
      await flows.updateAssets('flow_123', { flow_json: '{}' });

      const formData = uploadSpy.mock.calls[0]![1] as FormData;
      expect(formData.get('name')).toBe('flow.json');
      expect(formData.get('asset_type')).toBe('FLOW_JSON');
    });

    it('should use explicit name and asset_type when provided', async () => {
      uploadSpy.mockResolvedValue({ data: { success: true } });

      const flows = new Flows(client, BUSINESS_ACCOUNT_ID);
      await flows.updateAssets('flow_123', {
        flow_json: '{}',
        name: 'custom.json',
        asset_type: 'CUSTOM_TYPE',
      });

      const formData = uploadSpy.mock.calls[0]![1] as FormData;
      expect(formData.get('name')).toBe('custom.json');
      expect(formData.get('asset_type')).toBe('CUSTOM_TYPE');
    });

    it('should forward requestOptions', async () => {
      uploadSpy.mockResolvedValue({ data: { success: true } });

      const flows = new Flows(client, BUSINESS_ACCOUNT_ID);
      await flows.updateAssets('flow_123', { flow_json: '{}' }, { timeoutMs: 5000 });

      expect(uploadSpy).toHaveBeenCalledWith(
        'flow_123/assets',
        expect.any(FormData),
        { timeoutMs: 5000 },
      );
    });
  });

  describe('deprecate', () => {
    it('should POST to {flowId}/deprecate with empty body', async () => {
      postSpy.mockResolvedValue({ data: { success: true } });

      const flows = new Flows(client, BUSINESS_ACCOUNT_ID);
      await flows.deprecate('flow_123');

      expect(postSpy).toHaveBeenCalledWith('flow_123/deprecate', {}, undefined);
    });

    it('should forward requestOptions', async () => {
      postSpy.mockResolvedValue({ data: { success: true } });

      const flows = new Flows(client, BUSINESS_ACCOUNT_ID);
      await flows.deprecate('flow_123', { timeoutMs: 5000 });

      expect(postSpy).toHaveBeenCalledWith('flow_123/deprecate', {}, { timeoutMs: 5000 });
    });
  });

  describe('delete', () => {
    it('should DELETE {flowId}', async () => {
      deleteSpy.mockResolvedValue({ data: { success: true } });

      const flows = new Flows(client, BUSINESS_ACCOUNT_ID);
      await flows.delete('flow_123');

      expect(deleteSpy).toHaveBeenCalledWith('flow_123', undefined);
    });

    it('should forward requestOptions', async () => {
      deleteSpy.mockResolvedValue({ data: { success: true } });

      const flows = new Flows(client, BUSINESS_ACCOUNT_ID);
      await flows.delete('flow_123', { timeoutMs: 5000 });

      expect(deleteSpy).toHaveBeenCalledWith('flow_123', { timeoutMs: 5000 });
    });
  });

  describe('getPreview', () => {
    it('should GET {flowId} with preview.invalidate(false) field', async () => {
      getSpy.mockResolvedValue({
        data: { id: 'flow_123', preview: { preview_url: 'https://example.com', expires_at: '2026-04-10' } },
      });

      const flows = new Flows(client, BUSINESS_ACCOUNT_ID);
      const result = await flows.getPreview('flow_123');

      expect(getSpy).toHaveBeenCalledWith('flow_123', {
        params: { fields: 'preview.invalidate(false)' },
      });
      expect(result.data.preview.preview_url).toBe('https://example.com');
    });

    it('should forward requestOptions', async () => {
      getSpy.mockResolvedValue({
        data: { id: 'flow_123', preview: { preview_url: 'url', expires_at: 'ts' } },
      });

      const flows = new Flows(client, BUSINESS_ACCOUNT_ID);
      await flows.getPreview('flow_123', { timeoutMs: 5000 });

      expect(getSpy).toHaveBeenCalledWith('flow_123', {
        timeoutMs: 5000,
        params: { fields: 'preview.invalidate(false)' },
      });
    });

    it('should merge caller-supplied params instead of overwriting them', async () => {
      getSpy.mockResolvedValue({
        data: { id: 'flow_123', preview: { preview_url: 'url', expires_at: 'ts' } },
      });

      const flows = new Flows(client, BUSINESS_ACCOUNT_ID);
      await flows.getPreview('flow_123', {
        params: { locale: 'en_US', debug_flag: '1' },
      });

      expect(getSpy).toHaveBeenCalledWith('flow_123', {
        params: {
          locale: 'en_US',
          debug_flag: '1',
          fields: 'preview.invalidate(false)',
        },
      });
    });
  });
});
