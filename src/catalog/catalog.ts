import type { HttpClient } from '../client/http-client.js';
import type { RequestOptions, ApiResponse } from '../client/types.js';
import { ValidationError, ConflictError, ApiError } from '../errors/errors.js';
import type {
  Catalog as CatalogEntity,
  Product,
  CreateProductRequest,
  UpdateProductRequest,
  ListProductsParams,
  ListProductsResponse,
  ListCatalogsResponse,
} from './types.js';
import { CATALOG_VALIDATION } from './types.js';

/** Default fields requested when none are specified for `getCatalog`. */
const DEFAULT_CATALOG_FIELDS = ['id', 'name', 'vertical', 'product_count'] as const;

/**
 * Programmatic management of WhatsApp Commerce catalogs and products.
 *
 * Provides methods to discover catalogs connected to a WABA, list and fetch
 * individual products, and perform full CRUD on products — including strict
 * creation (fails on duplicate retailer ID) and upsert (create-or-update).
 *
 * Construct via the unified client (`wa.catalog`) or directly:
 *
 * @example
 * ```ts
 * import { HttpClient, Catalog } from '@abdelrahmannasr-wa/cloud-api';
 *
 * const client = new HttpClient({
 *   accessToken: 'YOUR_ACCESS_TOKEN',
 *   phoneNumberId: 'YOUR_PHONE_NUMBER_ID',
 *   businessAccountId: 'YOUR_WABA_ID',
 * });
 *
 * const catalog = new Catalog(client, 'YOUR_WABA_ID');
 * const { data } = await catalog.listCatalogs();
 * console.log(data.data[0]?.id);
 * ```
 */
export class Catalog {
  private readonly client: HttpClient;
  private readonly businessAccountId: string;

  /**
   * Creates a new Catalog instance.
   *
   * @param client - HTTP client for API requests
   * @param businessAccountId - WhatsApp Business Account ID (WABA ID)
   * @throws {ValidationError} If `businessAccountId` is empty or whitespace-only
   *
   * @example
   * ```ts
   * const catalog = new Catalog(client, 'YOUR_WABA_ID');
   * ```
   */
  constructor(client: HttpClient, businessAccountId: string) {
    if (!businessAccountId || businessAccountId.trim() === '') {
      throw new ValidationError(
        'businessAccountId is required and cannot be empty',
        'businessAccountId',
      );
    }
    this.client = client;
    this.businessAccountId = businessAccountId;
  }

  /**
   * List all catalogs connected to the WABA.
   *
   * Supports cursor pagination via `after` / `before` cursors and `limit`.
   *
   * @param params - Optional pagination parameters
   * @param requestOptions - Optional request configuration
   * @returns Promise resolving to list of catalogs with optional pagination info
   *
   * @example
   * ```ts
   * const result = await catalog.listCatalogs({ limit: 10 });
   * for (const cat of result.data.data) {
   *   console.log(cat.id, cat.name);
   * }
   * ```
   */
  async listCatalogs(
    params?: { limit?: number; after?: string; before?: string },
    requestOptions?: RequestOptions,
  ): Promise<ApiResponse<ListCatalogsResponse>> {
    const queryParams: Record<string, string> = {};
    if (params) {
      if (params.limit !== undefined) queryParams.limit = params.limit.toString();
      if (params.after) queryParams.after = params.after;
      if (params.before) queryParams.before = params.before;
    }

    return this.client.get<ListCatalogsResponse>(`${this.businessAccountId}/product_catalogs`, {
      ...requestOptions,
      params: { ...(requestOptions?.params ?? {}), ...queryParams },
    });
  }

  /**
   * Get a single catalog by ID.
   *
   * @param catalogId - The catalog ID to retrieve
   * @param fields - Fields to return; defaults to `id`, `name`, `vertical`, `product_count`
   * @param requestOptions - Optional request configuration
   * @returns Promise resolving to catalog details
   * @throws {ValidationError} If `catalogId` is empty
   *
   * @example
   * ```ts
   * const result = await catalog.getCatalog('CATALOG_ID');
   * console.log(result.data.product_count);
   * ```
   */
  async getCatalog(
    catalogId: string,
    fields?: readonly string[],
    requestOptions?: RequestOptions,
  ): Promise<ApiResponse<CatalogEntity>> {
    if (!catalogId || catalogId.trim() === '') {
      throw new ValidationError('catalogId is required and cannot be empty', 'catalogId');
    }

    const resolvedFields = fields && fields.length > 0 ? fields : DEFAULT_CATALOG_FIELDS;

    return this.client.get<CatalogEntity>(catalogId, {
      ...requestOptions,
      params: {
        ...(requestOptions?.params ?? {}),
        fields: resolvedFields.join(','),
      },
    });
  }

  /**
   * List products in a catalog.
   *
   * Supports cursor pagination and field selection to reduce payload size.
   *
   * @param catalogId - The catalog ID to list products from
   * @param params - Optional pagination and field parameters
   * @param requestOptions - Optional request configuration
   * @returns Promise resolving to list of products with optional pagination info
   * @throws {ValidationError} If `catalogId` is empty
   *
   * @example
   * ```ts
   * const page1 = await catalog.listProducts('CATALOG_ID', { limit: 25 });
   * const page2 = await catalog.listProducts('CATALOG_ID', {
   *   limit: 25,
   *   after: page1.data.paging?.cursors?.after,
   * });
   * ```
   */
  async listProducts(
    catalogId: string,
    params?: ListProductsParams,
    requestOptions?: RequestOptions,
  ): Promise<ApiResponse<ListProductsResponse>> {
    if (!catalogId || catalogId.trim() === '') {
      throw new ValidationError('catalogId is required and cannot be empty', 'catalogId');
    }

    const queryParams: Record<string, string> = {};
    if (params) {
      if (params.limit !== undefined) queryParams.limit = params.limit.toString();
      if (params.after) queryParams.after = params.after;
      if (params.before) queryParams.before = params.before;
      if (params.fields && params.fields.length > 0) {
        queryParams.fields = params.fields.join(',');
      }
    }

    return this.client.get<ListProductsResponse>(`${catalogId}/products`, {
      ...requestOptions,
      params: { ...(requestOptions?.params ?? {}), ...queryParams },
    });
  }

  /**
   * Get a single product by its platform-assigned ID.
   *
   * Note: `productId` is the platform-assigned ID, not `retailer_id`.
   * To look up by `retailer_id`, use `listProducts` with a filter.
   *
   * @param productId - Platform-assigned product ID
   * @param fields - Optional subset of fields to return
   * @param requestOptions - Optional request configuration
   * @returns Promise resolving to product details
   * @throws {ValidationError} If `productId` is empty
   *
   * @example
   * ```ts
   * const result = await catalog.getProduct('PRODUCT_ID');
   * console.log(result.data.name, result.data.price);
   * ```
   */
  async getProduct(
    productId: string,
    fields?: readonly string[],
    requestOptions?: RequestOptions,
  ): Promise<ApiResponse<Product>> {
    if (!productId || productId.trim() === '') {
      throw new ValidationError('productId is required and cannot be empty', 'productId');
    }

    if (fields && fields.length > 0) {
      return this.client.get<Product>(productId, {
        ...requestOptions,
        params: {
          ...(requestOptions?.params ?? {}),
          fields: fields.join(','),
        },
      });
    }

    return this.client.get<Product>(productId, requestOptions);
  }

  /**
   * Strict-create a product in a catalog.
   *
   * Fails with `ConflictError` if a product with the same `retailer_id` already exists.
   * Use `upsertProduct` if you want create-or-update semantics.
   *
   * Client-side validation rules (all throw `ValidationError`):
   * - `retailer_id` non-empty after trim
   * - `name` non-empty after trim
   * - At least one of `image_url` or `url` must be provided
   * - `currency` must match `/^[A-Z]{3}$/` if supplied
   * - `price` must be a non-negative integer if supplied
   *
   * @param catalogId - The catalog to add the product to
   * @param request - Product creation payload
   * @param requestOptions - Optional request configuration
   * @returns Promise resolving to the created product
   * @throws {ValidationError} On invalid input
   * @throws {ConflictError} If a product with this `retailer_id` already exists
   * @throws {ApiError} On other platform failures
   *
   * @example
   * ```ts
   * try {
   *   const result = await catalog.createProduct('CATALOG_ID', {
   *     retailer_id: 'SKU-001',
   *     name: 'Wireless Headphones',
   *     image_url: 'https://example.com/sku-001.jpg',
   *     price: 4999,
   *     currency: 'USD',
   *     availability: 'in stock',
   *   });
   *   console.log('Created:', result.data.id);
   * } catch (err) {
   *   if (err instanceof ConflictError) {
   *     // retailer_id already exists — use upsertProduct instead
   *   }
   * }
   * ```
   */
  async createProduct(
    catalogId: string,
    request: CreateProductRequest,
    requestOptions?: RequestOptions,
  ): Promise<ApiResponse<Product>> {
    if (!catalogId || catalogId.trim() === '') {
      throw new ValidationError('catalogId is required and cannot be empty', 'catalogId');
    }
    this.validateCreateRequest(request);

    try {
      return await this.client.post<Product>(`${catalogId}/products`, request, requestOptions);
    } catch (err) {
      if (err instanceof ApiError && this.isDuplicateRetailerId(err)) {
        throw new ConflictError(err.message, request.retailer_id);
      }
      throw err;
    }
  }

  /**
   * Create or update a product by `retailer_id` (upsert semantics).
   *
   * Creates the product if the `retailer_id` does not exist; updates it in place
   * if it does. Never throws `ConflictError` — that is the point of this method.
   *
   * Applies the same client-side validation as `createProduct`.
   *
   * @param catalogId - The catalog to upsert the product into
   * @param request - Product payload (same shape as `createProduct`)
   * @param requestOptions - Optional request configuration
   * @returns Promise resolving to the resulting product (created or updated)
   * @throws {ValidationError} On invalid input
   * @throws {ApiError} On platform failures other than duplicate retailer ID
   *
   * @example
   * ```ts
   * const result = await catalog.upsertProduct('CATALOG_ID', {
   *   retailer_id: 'SKU-001',
   *   name: 'Wireless Headphones',
   *   image_url: 'https://example.com/sku-001.jpg',
   *   price: 3999,
   *   currency: 'USD',
   * });
   * console.log('Upserted:', result.data.id);
   * ```
   */
  async upsertProduct(
    catalogId: string,
    request: CreateProductRequest,
    requestOptions?: RequestOptions,
  ): Promise<ApiResponse<Product>> {
    if (!catalogId || catalogId.trim() === '') {
      throw new ValidationError('catalogId is required and cannot be empty', 'catalogId');
    }
    this.validateCreateRequest(request);

    return this.client.post<Product>(`${catalogId}/products`, request, {
      ...requestOptions,
      params: {
        ...(requestOptions?.params ?? {}),
        retailer_id: request.retailer_id,
      },
    });
  }

  /**
   * Partially update an existing product by its platform-assigned ID.
   *
   * At least one field must be provided — empty update objects are rejected.
   * Applies the same per-field validation rules as `createProduct` for any
   * field that is present.
   *
   * @param productId - Platform-assigned product ID to update
   * @param updates - Partial product attributes to change
   * @param requestOptions - Optional request configuration
   * @returns Promise resolving to the updated product
   * @throws {ValidationError} If `productId` is empty or `updates` is empty
   * @throws {ApiError} On platform failures
   *
   * @example
   * ```ts
   * // Update price only
   * const result = await catalog.updateProduct('PRODUCT_ID', {
   *   price: 3999,
   *   currency: 'USD',
   * });
   * console.log('Updated price:', result.data.price);
   * ```
   */
  async updateProduct(
    productId: string,
    updates: UpdateProductRequest,
    requestOptions?: RequestOptions,
  ): Promise<ApiResponse<Product>> {
    if (!productId || productId.trim() === '') {
      throw new ValidationError('productId is required and cannot be empty', 'productId');
    }

    const keys = Object.keys(updates);
    if (keys.length === 0) {
      throw new ValidationError(
        'At least one field must be provided for updateProduct',
        'updates',
      );
    }

    this.validateUpdateFields(updates);

    return this.client.post<Product>(productId, updates, requestOptions);
  }

  /**
   * Delete a product by its platform-assigned ID.
   *
   * @param productId - Platform-assigned product ID to delete
   * @param requestOptions - Optional request configuration
   * @returns Promise resolving to `{ success: true }` on success
   * @throws {ValidationError} If `productId` is empty
   * @throws {ApiError} On platform failures
   *
   * @example
   * ```ts
   * await catalog.deleteProduct('PRODUCT_ID');
   * console.log('Product deleted');
   * ```
   */
  async deleteProduct(
    productId: string,
    requestOptions?: RequestOptions,
  ): Promise<ApiResponse<{ success: boolean }>> {
    if (!productId || productId.trim() === '') {
      throw new ValidationError('productId is required and cannot be empty', 'productId');
    }

    return this.client.delete<{ success: boolean }>(productId, requestOptions);
  }

  // ── Private helpers ──

  /**
   * Validate a `CreateProductRequest` before any API call.
   * Throws `ValidationError` on the first violation found.
   */
  private validateCreateRequest(request: CreateProductRequest): void {
    if (!request.retailer_id || request.retailer_id.trim() === '') {
      throw new ValidationError('retailer_id is required and cannot be empty', 'retailer_id');
    }

    if (!request.name || request.name.trim() === '') {
      throw new ValidationError('name is required and cannot be empty', 'name');
    }

    if (!request.image_url && !request.url) {
      throw new ValidationError(
        'At least one of image_url or url must be provided',
        'image_url',
      );
    }

    if (request.currency !== undefined && !CATALOG_VALIDATION.CURRENCY_PATTERN.test(request.currency)) {
      throw new ValidationError(
        `currency must be a valid ISO 4217 three-letter code (got "${request.currency}")`,
        'currency',
      );
    }

    if (request.price !== undefined) {
      if (!Number.isInteger(request.price) || request.price < 0) {
        throw new ValidationError(
          'price must be a non-negative integer (minor units, e.g. 2999 for $29.99)',
          'price',
        );
      }
    }
  }

  /**
   * Validate per-field rules on an `UpdateProductRequest`.
   * Throws `ValidationError` on the first violation found.
   */
  private validateUpdateFields(updates: UpdateProductRequest): void {
    if (
      updates.currency !== undefined &&
      !CATALOG_VALIDATION.CURRENCY_PATTERN.test(updates.currency)
    ) {
      throw new ValidationError(
        `currency must be a valid ISO 4217 three-letter code (got "${updates.currency}")`,
        'currency',
      );
    }

    if (updates.price !== undefined) {
      if (!Number.isInteger(updates.price) || updates.price < 0) {
        throw new ValidationError(
          'price must be a non-negative integer (minor units, e.g. 2999 for $29.99)',
          'price',
        );
      }
    }
  }

  /**
   * Heuristic: detect Meta's duplicate-retailer-ID error from an `ApiError`.
   *
   * Meta's Commerce API returns an error when a strict-create conflicts with an
   * existing product. We detect this by checking the error message for canonical
   * phrases. This avoids coupling the SDK to a specific Meta error code that may
   * change across API versions.
   */
  private isDuplicateRetailerId(err: ApiError): boolean {
    const msg = err.message.toLowerCase();
    return (
      msg.includes('already exists') ||
      msg.includes('duplicate') ||
      msg.includes('retailer_id') ||
      msg.includes('retailer id')
    );
  }
}
