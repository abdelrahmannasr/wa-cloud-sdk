# Contract: Public exports

**Module surfaces touched**: `src/index.ts` (main barrel), `src/catalog/index.ts` (new module barrel), `src/messages/index.ts`, `src/webhooks/index.ts`, `src/errors/index.ts`, `package.json` (subpath exports), `tsup.config.ts` (new build entry).

## Main barrel (`src/index.ts`)

Adds the following named re-exports (no default exports — project rule):

```ts
// New from src/catalog
export { Catalog } from './catalog/index.js';
export type {
  Catalog as CatalogResource,                    // type alias to disambiguate from class
  Product,
  ProductAvailability,
  CreateProductRequest,
  UpdateProductRequest,
  ListProductsParams,
  ListProductsResponse,
  ListCatalogsResponse,
} from './catalog/index.js';
export { CATALOG_VALIDATION } from './catalog/index.js';

// Extensions to existing modules
export type {
  ProductMessageOptions,
  ProductListMessageOptions,
  CatalogMessageOptions,
  ProductSection,
} from './messages/index.js';
export { MULTI_PRODUCT_LIMITS } from './messages/index.js';
export type {
  OrderEvent,
  WebhookOrderPayload,
  OrderItem,                                     // canonical home: src/webhooks/types.ts
} from './webhooks/index.js';

// New error class
export { ConflictError } from './errors/index.js';
```

Note on the `Catalog` name collision: `Catalog` is both a class (`new Catalog(client, wabaId)`) and an entity interface (the catalog metadata returned by `listCatalogs`). The class wins the bare name; the entity is re-exported as `CatalogResource` from the main barrel. Inside `src/catalog/types.ts` the entity remains named `Catalog` (consumers using the subpath import can disambiguate via `import { Catalog as CatalogClass, type Catalog as CatalogResource } from '@abdelrahmannasr-wa/cloud-api/catalog'`).

## Module barrel (`src/catalog/index.ts`)

```ts
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
```

## Subpath export in `package.json`

Adds:

```json
"./catalog": {
  "types": "./dist/catalog/index.d.ts",
  "import": "./dist/catalog/index.mjs",
  "require": "./dist/catalog/index.js"
}
```

Mirrors existing `./templates`, `./flows`, `./media`, `./phone-numbers`, `./multi-account` entries from spec 009.

## Build configuration (`tsup.config.ts`)

Adds `"catalog/index": "src/catalog/index.ts"` to the `entry` map. Confirms ESM + CJS dual emit at `dist/catalog/index.{mjs,js,d.ts}`.

## Unified client (`src/whatsapp.ts`)

Adds a lazy getter:

```ts
get catalog(): Catalog {
  if (!this._catalog) {
    this._catalog = new Catalog(this.client, this.requireBusinessAccountId());
  }
  return this._catalog;
}
```

`requireBusinessAccountId()` is the existing private helper that throws a deferred `ValidationError` with a clear message when `businessAccountId` is missing — same pattern as `templates` and `flows`.

`destroy()` does not need updating: the `Catalog` instance holds no timers or sockets; the underlying `HttpClient`'s rate limiter is already cleaned up by the existing `destroy()` call.

## Existing-export preservation

No existing export is removed, renamed, or changed in shape. Verified by `tests/subpath-exports.test.ts` extension (T038) that:
- Imports every existing public symbol from every existing subpath
- Imports every new symbol listed above from the new subpath
- Confirms the main barrel re-exports both the existing AND the new symbols

## Version bump

`package.json` `version` bumps from `0.3.x` to `0.4.0` (minor — additive, no breaking changes).

## Test coverage

| Scenario | Asserts |
|---|---|
| `import { Catalog, Product, OrderEvent, ConflictError } from '@abdelrahmannasr-wa/cloud-api'` | All four resolve |
| `import { Catalog } from '@abdelrahmannasr-wa/cloud-api/catalog'` | Resolves; instance methods present |
| `import * as catalogMod from '@abdelrahmannasr-wa/cloud-api/catalog'` | Module shape matches expected key list |
| Existing imports unchanged | All v0.3.x test imports still pass |
