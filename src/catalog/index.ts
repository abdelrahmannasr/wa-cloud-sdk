export { Catalog } from './catalog.js';
export type {
  Catalog as CatalogResource,
  Product,
  ProductAvailability,
  CreateProductRequest,
  UpdateProductRequest,
  ListProductsParams,
  ListProductsResponse,
  ListCatalogsResponse,
} from './types.js';
export { CATALOG_VALIDATION } from './types.js';
// Note: ProductSection and MULTI_PRODUCT_LIMITS live in src/messages/index.ts (used by sendProductList).
// Note: OrderItem lives in src/webhooks/index.ts (canonical with the OrderEvent surface).
