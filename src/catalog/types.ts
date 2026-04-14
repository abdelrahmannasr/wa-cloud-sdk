// ── Catalog Validation ──

/**
 * Client-side validation constants for the catalog module.
 * Used by `createProduct`, `upsertProduct`, and `updateProduct` before any API call.
 */
export const CATALOG_VALIDATION = {
  /** ISO 4217 three-letter currency code pattern */
  CURRENCY_PATTERN: /^[A-Z]{3}$/,
} as const;

// ── Catalog ──

/**
 * Catalog metadata returned by `listCatalogs` and `getCatalog`.
 *
 * One WABA may own multiple catalogs. Products live inside a catalog and are
 * addressed by their `retailer_id` (consumer-chosen) or platform-assigned `id`.
 */
export interface Catalog {
  /** Platform-assigned catalog ID */
  readonly id: string;
  /** Consumer-chosen catalog name */
  readonly name: string;
  /** Platform catalog vertical (e.g. `'commerce'`, `'destinations'`) */
  readonly vertical?: string;
  /** Total products in catalog — only populated when explicitly requested via `fields` */
  readonly product_count?: number;
}

// ── Product Availability ──

/**
 * Availability state of a product.
 * Platform-defined canonical strings (lowercase with spaces).
 *
 * Validated client-side by `createProduct` / `upsertProduct` before any API call.
 */
export type ProductAvailability =
  | 'in stock'
  | 'out of stock'
  | 'available for order'
  | 'discontinued';

// ── Product ──

/**
 * Product record returned by `getProduct` and `listProducts`.
 *
 * `retailer_id` is the consumer's stable addressing key. The platform also
 * assigns its own `id`. The `retailer_id` cannot be changed after creation
 * — to change it, delete and re-create the product.
 */
export interface Product {
  /** Platform-assigned product ID */
  readonly id: string;
  /** Consumer-chosen unique-within-catalog identifier */
  readonly retailer_id: string;
  /** Product display name */
  readonly name: string;
  /** Optional product description */
  readonly description?: string;
  /** Price in integer minor units (e.g. `2999` for $29.99) */
  readonly price?: number;
  /** ISO 4217 three-letter currency code (e.g. `'USD'`) */
  readonly currency?: string;
  /** Current stock availability */
  readonly availability?: ProductAvailability;
  /** Consumer-hosted public HTTPS URL for the product image */
  readonly image_url?: string;
  /** Consumer's product page URL */
  readonly url?: string;
  /** Product category string */
  readonly category?: string;
  /** Product brand name */
  readonly brand?: string;
  /** Physical condition of the product */
  readonly condition?: 'new' | 'refurbished' | 'used';
  /** Catalog visibility — `'published'` surfaces to customers; `'staging'` is draft-only */
  readonly visibility?: 'published' | 'staging';
  /** Platform-assigned moderation outcome */
  readonly review_status?: string;
}

// ── Create / Upsert Request ──

/**
 * Request body for `createProduct` (strict path) and `upsertProduct`.
 *
 * Client-side validation enforced before any API call:
 * - `retailer_id` must be non-empty after trim
 * - `name` must be non-empty after trim
 * - At least one of `image_url` or `url` must be provided
 * - `currency`, if provided, must match `/^[A-Z]{3}$/`
 * - `price`, if provided, must be a non-negative integer
 *
 * @example
 * ```ts
 * const req: CreateProductRequest = {
 *   retailer_id: 'SKU-001',
 *   name: 'Wireless Headphones',
 *   image_url: 'https://example.com/images/sku-001.jpg',
 *   price: 4999,
 *   currency: 'USD',
 *   availability: 'in stock',
 * };
 * ```
 */
export interface CreateProductRequest {
  /** Consumer-chosen unique-within-catalog identifier (required; cannot be changed after creation) */
  readonly retailer_id: string;
  /** Product display name (required) */
  readonly name: string;
  /** Optional product description */
  readonly description?: string;
  /** Price in integer minor units (e.g. `2999` for $29.99) */
  readonly price?: number;
  /** ISO 4217 three-letter currency code (e.g. `'USD'`) */
  readonly currency?: string;
  /** Current stock availability */
  readonly availability?: ProductAvailability;
  /** Consumer-hosted public HTTPS URL for the product image (required if `url` not provided) */
  readonly image_url?: string;
  /** Consumer's product page URL (required if `image_url` not provided) */
  readonly url?: string;
  /** Product category string */
  readonly category?: string;
  /** Product brand name */
  readonly brand?: string;
  /** Physical condition of the product */
  readonly condition?: 'new' | 'refurbished' | 'used';
  /** Catalog visibility — `'published'` surfaces to customers; `'staging'` is draft-only */
  readonly visibility?: 'published' | 'staging';
}

// ── Update Request ──

/**
 * Partial update payload for `updateProduct`.
 *
 * At least one field must be provided (empty objects are rejected client-side).
 * Field-level validation rules match `CreateProductRequest` for any field present.
 *
 * @example
 * ```ts
 * // Update price only
 * await catalog.updateProduct('PRODUCT_ID', { price: 3999, currency: 'USD' });
 * ```
 */
export interface UpdateProductRequest {
  /** Updated product display name */
  readonly name?: string;
  /** Updated product description */
  readonly description?: string;
  /** Updated price in integer minor units */
  readonly price?: number;
  /** Updated ISO 4217 three-letter currency code */
  readonly currency?: string;
  /** Updated availability */
  readonly availability?: ProductAvailability;
  /** Updated product image URL */
  readonly image_url?: string;
  /** Updated product page URL */
  readonly url?: string;
  /** Updated product category */
  readonly category?: string;
  /** Updated brand name */
  readonly brand?: string;
  /** Updated physical condition */
  readonly condition?: 'new' | 'refurbished' | 'used';
  /** Updated visibility */
  readonly visibility?: 'published' | 'staging';
}

// ── Pagination / List Params ──

/**
 * Query parameters for `listProducts`.
 *
 * @example
 * ```ts
 * const page1 = await catalog.listProducts('CAT_ID', { limit: 25 });
 * const page2 = await catalog.listProducts('CAT_ID', { limit: 25, after: page1.paging?.cursors?.after });
 * ```
 */
export interface ListProductsParams {
  /** Page size; platform default applies if omitted */
  readonly limit?: number;
  /** Forward pagination cursor (from `paging.cursors.after`) */
  readonly after?: string;
  /** Backward pagination cursor (from `paging.cursors.before`) */
  readonly before?: string;
  /** Subset of `Product` fields to return (reduces payload size) */
  readonly fields?: readonly string[];
}

// ── Response Wrappers ──

/**
 * Response from `listProducts`.
 */
export interface ListProductsResponse {
  readonly data: readonly Product[];
  readonly paging?: {
    readonly cursors?: {
      readonly before?: string;
      readonly after?: string;
    };
    readonly next?: string;
    readonly previous?: string;
  };
}

/**
 * Response from `listCatalogs`.
 */
export interface ListCatalogsResponse {
  readonly data: readonly Catalog[];
  readonly paging?: ListProductsResponse['paging'];
}
