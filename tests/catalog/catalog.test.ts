/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Catalog } from '../../src/catalog/catalog.js';
import type { HttpClient } from '../../src/client/http-client.js';
import { ValidationError, ConflictError, ApiError } from '../../src/errors/errors.js';

const WABA_ID = 'WABA_123456789';
const CATALOG_ID = 'CAT_987654321';
const PRODUCT_ID = 'PROD_111222333';
const RETAILER_ID = 'SKU-001';

const MINIMAL_CREATE_REQUEST = {
  retailer_id: RETAILER_ID,
  name: 'Wireless Headphones',
  image_url: 'https://example.com/sku-001.jpg',
} as const;

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

function makeResponse<T>(data: T, status = 200) {
  return { data, status, headers: new Headers() };
}

describe('Catalog', () => {
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

  // ── constructor ──

  describe('constructor', () => {
    it('should create instance with valid businessAccountId', () => {
      const catalog = new Catalog(client, WABA_ID);
      expect(catalog).toBeInstanceOf(Catalog);
    });

    it('should throw ValidationError when businessAccountId is empty string', () => {
      expect(() => new Catalog(client, '')).toThrow(ValidationError);
    });

    it('should throw ValidationError when businessAccountId is whitespace only', () => {
      expect(() => new Catalog(client, '   ')).toThrow(ValidationError);
    });

    it('should set field to businessAccountId on ValidationError', () => {
      try {
        new Catalog(client, '');
      } catch (err) {
        expect(err).toBeInstanceOf(ValidationError);
        expect((err as ValidationError).field).toBe('businessAccountId');
      }
    });
  });

  // ── listCatalogs ──

  describe('listCatalogs', () => {
    it('should call GET {wabaId}/product_catalogs with no params', async () => {
      const catalog = new Catalog(client, WABA_ID);
      const mockData = { data: [{ id: CATALOG_ID, name: 'My Store' }] };
      getSpy.mockResolvedValueOnce(makeResponse(mockData));

      const result = await catalog.listCatalogs();

      expect(getSpy).toHaveBeenCalledWith(
        `${WABA_ID}/product_catalogs`,
        expect.objectContaining({ params: {} }),
      );
      expect(result.data).toEqual(mockData);
    });

    it('should pass pagination params when provided', async () => {
      const catalog = new Catalog(client, WABA_ID);
      getSpy.mockResolvedValueOnce(makeResponse({ data: [] }));

      await catalog.listCatalogs({ limit: 5, after: 'cursor123' });

      expect(getSpy).toHaveBeenCalledWith(
        `${WABA_ID}/product_catalogs`,
        expect.objectContaining({
          params: expect.objectContaining({ limit: '5', after: 'cursor123' }),
        }),
      );
    });

    it('should pass before cursor when provided', async () => {
      const catalog = new Catalog(client, WABA_ID);
      getSpy.mockResolvedValueOnce(makeResponse({ data: [] }));

      await catalog.listCatalogs({ before: 'prevCursor' });

      expect(getSpy).toHaveBeenCalledWith(
        `${WABA_ID}/product_catalogs`,
        expect.objectContaining({
          params: expect.objectContaining({ before: 'prevCursor' }),
        }),
      );
    });
  });

  // ── getCatalog ──

  describe('getCatalog', () => {
    it('should call GET {catalogId} with default fields', async () => {
      const catalog = new Catalog(client, WABA_ID);
      getSpy.mockResolvedValueOnce(makeResponse({ id: CATALOG_ID, name: 'Store' }));

      await catalog.getCatalog(CATALOG_ID);

      expect(getSpy).toHaveBeenCalledWith(
        CATALOG_ID,
        expect.objectContaining({
          params: expect.objectContaining({ fields: 'id,name,vertical,product_count' }),
        }),
      );
    });

    it('should use custom fields when provided', async () => {
      const catalog = new Catalog(client, WABA_ID);
      getSpy.mockResolvedValueOnce(makeResponse({ id: CATALOG_ID, name: 'Store' }));

      await catalog.getCatalog(CATALOG_ID, ['id', 'name']);

      expect(getSpy).toHaveBeenCalledWith(
        CATALOG_ID,
        expect.objectContaining({
          params: expect.objectContaining({ fields: 'id,name' }),
        }),
      );
    });

    it('should throw ValidationError when catalogId is empty', async () => {
      const catalog = new Catalog(client, WABA_ID);
      await expect(catalog.getCatalog('')).rejects.toThrow(ValidationError);
    });
  });

  // ── listProducts ──

  describe('listProducts', () => {
    it('should call GET {catalogId}/products', async () => {
      const catalog = new Catalog(client, WABA_ID);
      getSpy.mockResolvedValueOnce(makeResponse({ data: [] }));

      await catalog.listProducts(CATALOG_ID);

      expect(getSpy).toHaveBeenCalledWith(
        `${CATALOG_ID}/products`,
        expect.objectContaining({ params: {} }),
      );
    });

    it('should pass pagination params', async () => {
      const catalog = new Catalog(client, WABA_ID);
      getSpy.mockResolvedValueOnce(makeResponse({ data: [] }));

      await catalog.listProducts(CATALOG_ID, { limit: 25, after: 'abc' });

      expect(getSpy).toHaveBeenCalledWith(
        `${CATALOG_ID}/products`,
        expect.objectContaining({
          params: expect.objectContaining({ limit: '25', after: 'abc' }),
        }),
      );
    });

    it('should pass fields param when provided', async () => {
      const catalog = new Catalog(client, WABA_ID);
      getSpy.mockResolvedValueOnce(makeResponse({ data: [] }));

      await catalog.listProducts(CATALOG_ID, { fields: ['id', 'retailer_id', 'name'] });

      expect(getSpy).toHaveBeenCalledWith(
        `${CATALOG_ID}/products`,
        expect.objectContaining({
          params: expect.objectContaining({ fields: 'id,retailer_id,name' }),
        }),
      );
    });

    it('should throw ValidationError when catalogId is empty', async () => {
      const catalog = new Catalog(client, WABA_ID);
      await expect(catalog.listProducts('')).rejects.toThrow(ValidationError);
    });
  });

  // ── getProduct ──

  describe('getProduct', () => {
    it('should call GET {productId} with no fields', async () => {
      const catalog = new Catalog(client, WABA_ID);
      getSpy.mockResolvedValueOnce(
        makeResponse({ id: PRODUCT_ID, retailer_id: RETAILER_ID, name: 'Headphones' }),
      );

      await catalog.getProduct(PRODUCT_ID);

      expect(getSpy).toHaveBeenCalledWith(PRODUCT_ID, undefined);
    });

    it('should pass fields when provided', async () => {
      const catalog = new Catalog(client, WABA_ID);
      getSpy.mockResolvedValueOnce(
        makeResponse({ id: PRODUCT_ID, retailer_id: RETAILER_ID, name: 'Headphones' }),
      );

      await catalog.getProduct(PRODUCT_ID, ['id', 'name', 'price']);

      expect(getSpy).toHaveBeenCalledWith(
        PRODUCT_ID,
        expect.objectContaining({
          params: expect.objectContaining({ fields: 'id,name,price' }),
        }),
      );
    });

    it('should throw ValidationError when productId is empty', async () => {
      const catalog = new Catalog(client, WABA_ID);
      await expect(catalog.getProduct('')).rejects.toThrow(ValidationError);
    });
  });

  // ── createProduct ──

  describe('createProduct', () => {
    it('should call POST {catalogId}/products with valid request', async () => {
      const catalog = new Catalog(client, WABA_ID);
      const created = { id: PRODUCT_ID, retailer_id: RETAILER_ID, name: 'Wireless Headphones' };
      postSpy.mockResolvedValueOnce(makeResponse(created));

      const result = await catalog.createProduct(CATALOG_ID, MINIMAL_CREATE_REQUEST);

      expect(postSpy).toHaveBeenCalledWith(
        `${CATALOG_ID}/products`,
        MINIMAL_CREATE_REQUEST,
        undefined,
      );
      expect(result.data).toEqual(created);
    });

    it('should accept request with url instead of image_url', async () => {
      const catalog = new Catalog(client, WABA_ID);
      postSpy.mockResolvedValueOnce(
        makeResponse({ id: PRODUCT_ID, retailer_id: RETAILER_ID, name: 'Product' }),
      );

      await catalog.createProduct(CATALOG_ID, {
        retailer_id: RETAILER_ID,
        name: 'Product',
        url: 'https://example.com/product',
      });

      expect(postSpy).toHaveBeenCalled();
    });

    it('should accept full optional fields', async () => {
      const catalog = new Catalog(client, WABA_ID);
      postSpy.mockResolvedValueOnce(
        makeResponse({ id: PRODUCT_ID, retailer_id: RETAILER_ID, name: 'Product' }),
      );

      await catalog.createProduct(CATALOG_ID, {
        retailer_id: RETAILER_ID,
        name: 'Full Product',
        image_url: 'https://example.com/img.jpg',
        price: 2999,
        currency: 'USD',
        availability: 'in stock',
        description: 'A great product',
        condition: 'new',
        visibility: 'published',
      });

      expect(postSpy).toHaveBeenCalled();
    });

    it('should throw ConflictError when platform reports duplicate retailer_id', async () => {
      const catalog = new Catalog(client, WABA_ID);
      postSpy.mockRejectedValueOnce(
        new ApiError('Product with retailer_id already exists', 400, 'OAuthException'),
      );

      await expect(catalog.createProduct(CATALOG_ID, MINIMAL_CREATE_REQUEST)).rejects.toThrow(
        ConflictError,
      );
    });

    it('should set resource to retailer_id on ConflictError', async () => {
      const catalog = new Catalog(client, WABA_ID);
      postSpy.mockRejectedValueOnce(new ApiError('Product already exists', 400, 'OAuthException'));

      try {
        await catalog.createProduct(CATALOG_ID, MINIMAL_CREATE_REQUEST);
      } catch (err) {
        expect(err).toBeInstanceOf(ConflictError);
        expect((err as ConflictError).resource).toBe(RETAILER_ID);
      }
    });

    it('should rethrow non-conflict ApiError as-is', async () => {
      const catalog = new Catalog(client, WABA_ID);
      const apiErr = new ApiError('Invalid catalog', 400, 'OAuthException');
      postSpy.mockRejectedValueOnce(apiErr);

      await expect(catalog.createProduct(CATALOG_ID, MINIMAL_CREATE_REQUEST)).rejects.toThrow(
        ApiError,
      );
    });

    it('should throw ValidationError when catalogId is empty', async () => {
      const catalog = new Catalog(client, WABA_ID);
      await expect(catalog.createProduct('', MINIMAL_CREATE_REQUEST)).rejects.toThrow(
        ValidationError,
      );
    });

    it('should throw ValidationError when retailer_id is empty', async () => {
      const catalog = new Catalog(client, WABA_ID);
      await expect(
        catalog.createProduct(CATALOG_ID, { ...MINIMAL_CREATE_REQUEST, retailer_id: '' }),
      ).rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError when name is empty', async () => {
      const catalog = new Catalog(client, WABA_ID);
      await expect(
        catalog.createProduct(CATALOG_ID, { ...MINIMAL_CREATE_REQUEST, name: '' }),
      ).rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError when neither image_url nor url provided', async () => {
      const catalog = new Catalog(client, WABA_ID);
      await expect(
        catalog.createProduct(CATALOG_ID, { retailer_id: RETAILER_ID, name: 'Product' }),
      ).rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError for invalid currency (lowercase)', async () => {
      const catalog = new Catalog(client, WABA_ID);
      await expect(
        catalog.createProduct(CATALOG_ID, { ...MINIMAL_CREATE_REQUEST, currency: 'usd' }),
      ).rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError for invalid currency (4 chars)', async () => {
      const catalog = new Catalog(client, WABA_ID);
      await expect(
        catalog.createProduct(CATALOG_ID, { ...MINIMAL_CREATE_REQUEST, currency: 'USDX' }),
      ).rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError for negative price', async () => {
      const catalog = new Catalog(client, WABA_ID);
      await expect(
        catalog.createProduct(CATALOG_ID, { ...MINIMAL_CREATE_REQUEST, price: -1 }),
      ).rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError for non-integer price', async () => {
      const catalog = new Catalog(client, WABA_ID);
      await expect(
        catalog.createProduct(CATALOG_ID, { ...MINIMAL_CREATE_REQUEST, price: 29.99 }),
      ).rejects.toThrow(ValidationError);
    });
  });

  // ── upsertProduct ──

  describe('upsertProduct', () => {
    it('should call POST {catalogId}/products?retailer_id={id}', async () => {
      const catalog = new Catalog(client, WABA_ID);
      postSpy.mockResolvedValueOnce(
        makeResponse({ id: PRODUCT_ID, retailer_id: RETAILER_ID, name: 'Headphones' }),
      );

      await catalog.upsertProduct(CATALOG_ID, MINIMAL_CREATE_REQUEST);

      expect(postSpy).toHaveBeenCalledWith(
        `${CATALOG_ID}/products`,
        MINIMAL_CREATE_REQUEST,
        expect.objectContaining({
          params: expect.objectContaining({ retailer_id: RETAILER_ID }),
        }),
      );
    });

    it('should not throw ConflictError (upsert semantics)', async () => {
      const catalog = new Catalog(client, WABA_ID);
      postSpy.mockResolvedValueOnce(
        makeResponse({ id: PRODUCT_ID, retailer_id: RETAILER_ID, name: 'Headphones' }),
      );

      // Should succeed without ConflictError even if it creates or updates
      const result = await catalog.upsertProduct(CATALOG_ID, MINIMAL_CREATE_REQUEST);
      expect(result.data).toBeDefined();
    });

    it('should apply same validation as createProduct', async () => {
      const catalog = new Catalog(client, WABA_ID);
      await expect(
        catalog.upsertProduct(CATALOG_ID, { retailer_id: RETAILER_ID, name: 'Product' }),
      ).rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError when catalogId is empty', async () => {
      const catalog = new Catalog(client, WABA_ID);
      await expect(catalog.upsertProduct('', MINIMAL_CREATE_REQUEST)).rejects.toThrow(
        ValidationError,
      );
    });
  });

  // ── updateProduct ──

  describe('updateProduct', () => {
    it('should call POST {productId} with partial update', async () => {
      const catalog = new Catalog(client, WABA_ID);
      postSpy.mockResolvedValueOnce(
        makeResponse({ id: PRODUCT_ID, retailer_id: RETAILER_ID, name: 'Updated', price: 3999 }),
      );

      await catalog.updateProduct(PRODUCT_ID, { price: 3999, currency: 'USD' });

      expect(postSpy).toHaveBeenCalledWith(PRODUCT_ID, { price: 3999, currency: 'USD' }, undefined);
    });

    it('should throw ValidationError when productId is empty', async () => {
      const catalog = new Catalog(client, WABA_ID);
      await expect(catalog.updateProduct('', { price: 1000 })).rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError when updates is empty object', async () => {
      const catalog = new Catalog(client, WABA_ID);
      await expect(catalog.updateProduct(PRODUCT_ID, {})).rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError for invalid currency in update', async () => {
      const catalog = new Catalog(client, WABA_ID);
      await expect(catalog.updateProduct(PRODUCT_ID, { currency: 'usd' })).rejects.toThrow(
        ValidationError,
      );
    });

    it('should throw ValidationError for negative price in update', async () => {
      const catalog = new Catalog(client, WABA_ID);
      await expect(catalog.updateProduct(PRODUCT_ID, { price: -500 })).rejects.toThrow(
        ValidationError,
      );
    });
  });

  // ── deleteProduct ──

  describe('deleteProduct', () => {
    it('should call DELETE {productId}', async () => {
      const catalog = new Catalog(client, WABA_ID);
      deleteSpy.mockResolvedValueOnce(makeResponse({ success: true }));

      const result = await catalog.deleteProduct(PRODUCT_ID);

      expect(deleteSpy).toHaveBeenCalledWith(PRODUCT_ID, undefined);
      expect(result.data).toEqual({ success: true });
    });

    it('should throw ValidationError when productId is empty', async () => {
      const catalog = new Catalog(client, WABA_ID);
      await expect(catalog.deleteProduct('')).rejects.toThrow(ValidationError);
    });

    it('should pass requestOptions to delete', async () => {
      const catalog = new Catalog(client, WABA_ID);
      deleteSpy.mockResolvedValueOnce(makeResponse({ success: true }));

      const opts = { skipRetry: true };
      await catalog.deleteProduct(PRODUCT_ID, opts);

      expect(deleteSpy).toHaveBeenCalledWith(PRODUCT_ID, opts);
    });
  });

  // ── validation edge cases ──

  describe('validation edge cases', () => {
    it('should accept zero price as valid', async () => {
      const catalog = new Catalog(client, WABA_ID);
      postSpy.mockResolvedValueOnce(
        makeResponse({ id: PRODUCT_ID, retailer_id: RETAILER_ID, name: 'Free' }),
      );

      // price === 0 is valid (free item)
      await expect(
        catalog.createProduct(CATALOG_ID, { ...MINIMAL_CREATE_REQUEST, price: 0, currency: 'USD' }),
      ).resolves.toBeDefined();
    });

    it('should accept valid 3-letter uppercase currency', async () => {
      const catalog = new Catalog(client, WABA_ID);
      postSpy.mockResolvedValueOnce(
        makeResponse({ id: PRODUCT_ID, retailer_id: RETAILER_ID, name: 'Product' }),
      );

      await expect(
        catalog.createProduct(CATALOG_ID, { ...MINIMAL_CREATE_REQUEST, currency: 'EUR' }),
      ).resolves.toBeDefined();
    });

    it('should throw ValidationError for whitespace-only retailer_id', async () => {
      const catalog = new Catalog(client, WABA_ID);
      await expect(
        catalog.createProduct(CATALOG_ID, { ...MINIMAL_CREATE_REQUEST, retailer_id: '   ' }),
      ).rejects.toThrow(ValidationError);
    });

    it('should rethrow non-ApiError from createProduct unchanged', async () => {
      const catalog = new Catalog(client, WABA_ID);
      const netErr = new Error('Network failure');
      postSpy.mockRejectedValueOnce(netErr);

      await expect(catalog.createProduct(CATALOG_ID, MINIMAL_CREATE_REQUEST)).rejects.toThrow(
        'Network failure',
      );
    });
  });
});
