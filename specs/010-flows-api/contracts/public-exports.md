# Contract: Public exports and unified client integration

**Files**:
- `src/whatsapp.ts` (new lazy `flows` getter)
- `src/index.ts` (main barrel additions)
- `src/flows/index.ts` (new feature barrel)
- `package.json` (new subpath export)
- `tsup.config.ts` (new entry)

## Unified client integration

Edit `src/whatsapp.ts` mirroring the existing `templates` lazy getter at `src/whatsapp.ts:122-134`.

### Private field

Add near existing private field `_templates` (around line 43):

```ts
private _flows?: Flows;
```

### Public getter

Add near existing `templates` getter:

```ts
/**
 * Access the Flows API for flow lifecycle management.
 *
 * Requires `businessAccountId` in WhatsApp config. Throws `ValidationError`
 * at the point of first access if `businessAccountId` is missing or empty.
 *
 * @throws {ValidationError} if businessAccountId is missing
 *
 * @example
 * ```ts
 * const wa = new WhatsApp({ accessToken, phoneNumberId, businessAccountId });
 * const flows = await wa.flows.list({ limit: 10 });
 * ```
 */
get flows(): Flows {
  if (!this._flows) {
    if (!this.config.businessAccountId || this.config.businessAccountId.trim() === '') {
      throw new ValidationError(
        'businessAccountId is required for flow operations. Provide it in the WhatsApp constructor config.',
        'businessAccountId',
      );
    }
    this._flows = new Flows(this._client, this.config.businessAccountId);
  }
  return this._flows;
}
```

### Import addition

Add `import { Flows } from './flows/index.js';` to the existing imports section.

### Behavioral invariants

1. **Lazy**: `flows` is not constructed until first access. Consumers without `businessAccountId` can still use `messages`, `media`, `webhooks`, and `phoneNumbers` without error.
2. **Idempotent**: Subsequent accesses return the same `Flows` instance (cached in `_flows`).
3. **No destroy coupling**: `WhatsApp.destroy()` delegates to `_client.destroy()` — `Flows` has no timers or stateful resources to clean up.

### Test targets

In `tests/whatsapp.test.ts`:

1. **Lazy success**: Construct `WhatsApp` with `businessAccountId` → access `.flows` → expect a `Flows` instance
2. **Missing ID throws**: Construct `WhatsApp` without `businessAccountId` → access `.flows` → expect `ValidationError` with field `'businessAccountId'`
3. **Cached instance**: Two accesses to `.flows` return the same object reference (`wa.flows === wa.flows`)

## Feature barrel — `src/flows/index.ts`

```ts
export { Flows } from './flows.js';
export type {
  Flow,
  FlowCategory,
  FlowStatus,
  FlowValidationError,
  FlowListParams,
  FlowListResponse,
  FlowGetOptions,
  CreateFlowRequest,
  CreateFlowResponse,
  UpdateFlowMetadataRequest,
  UpdateFlowAssetsRequest,
  UpdateFlowAssetsResponse,
  FlowDeleteResponse,
  FlowPublishResponse,
  FlowDeprecateResponse,
  FlowPreviewResponse,
} from './types.js';
export {
  MAX_FLOW_NAME_LENGTH,
  MAX_FLOW_CATEGORIES,
  MAX_FLOW_JSON_BYTES,
} from './types.js';
```

## Main barrel — `src/index.ts`

Add after the templates block (around line 121):

```ts
// Flows
export { Flows } from './flows/index.js';
export type {
  Flow,
  FlowCategory,
  FlowStatus,
  FlowValidationError,
  FlowListParams,
  FlowListResponse,
  FlowGetOptions,
  CreateFlowRequest,
  CreateFlowResponse,
  UpdateFlowMetadataRequest,
  UpdateFlowAssetsRequest,
  UpdateFlowAssetsResponse,
  FlowDeleteResponse,
  FlowPublishResponse,
  FlowDeprecateResponse,
  FlowPreviewResponse,
} from './flows/index.js';
export {
  MAX_FLOW_NAME_LENGTH,
  MAX_FLOW_CATEGORIES,
  MAX_FLOW_JSON_BYTES,
} from './flows/index.js';
```

Additionally, `FlowMessageOptions` is exported from `./messages/index.js` (already its home module), and `FlowCompletionEvent` / `WebhookNfmReply` are exported from `./webhooks/index.js`. Consumers using the main barrel get all three without changes (the barrel already re-exports everything from messages and webhooks).

## Subpath export — `package.json`

Insert after `./templates` (around lines 89-98):

```json
"./flows": {
  "import": {
    "types": "./dist/flows/index.d.ts",
    "default": "./dist/flows/index.js"
  },
  "require": {
    "types": "./dist/flows/index.d.cts",
    "default": "./dist/flows/index.cjs"
  }
},
```

Matches the exact shape used by `./errors`, `./messages`, `./webhooks`, `./media`, `./templates`, `./phone-numbers`, `./multi-account`.

## tsup entry — `tsup.config.ts`

Add to the `entry` object (around lines 5-14):

```ts
'flows/index': 'src/flows/index.ts',
```

After this change, `tsup` produces:
- `dist/flows/index.js` (ESM)
- `dist/flows/index.cjs` (CJS)
- `dist/flows/index.d.ts` (ESM types)
- `dist/flows/index.d.cts` (CJS types)
- `dist/flows/index.js.map` + `.cjs.map` (sourcemaps)

## Subpath export verification test

Edit the existing subpath export verification test suite under `tests/exports/` (added in spec 009-subpath-exports) to include `./flows`:

1. **ESM resolution**: `import { Flows } from '@abdelrahmannasr-wa/cloud-api/flows'` resolves and `Flows` is a class
2. **CJS resolution**: `require('@abdelrahmannasr-wa/cloud-api/flows').Flows` is a class
3. **Type-only exports accessible**: `FlowCategory`, `FlowStatus`, `CreateFlowRequest` can be imported as types

Mirror the exact shape of existing `./templates` or `./media` test cases.

## Re-export checklist

| Symbol | Home module | Main barrel (`src/index.ts`) | Subpath |
|---|---|---|---|
| `Flows` | `src/flows/flows.ts` | ✓ | `./flows` ✓ |
| `FlowCategory` | `src/flows/types.ts` | ✓ | `./flows` ✓ |
| `FlowStatus` | `src/flows/types.ts` | ✓ | `./flows` ✓ |
| `Flow` | `src/flows/types.ts` | ✓ | `./flows` ✓ |
| `FlowValidationError` | `src/flows/types.ts` | ✓ | `./flows` ✓ |
| `FlowListParams` / `FlowListResponse` / `FlowGetOptions` | `src/flows/types.ts` | ✓ | `./flows` ✓ |
| `CreateFlowRequest` / `CreateFlowResponse` | `src/flows/types.ts` | ✓ | `./flows` ✓ |
| `UpdateFlowMetadataRequest` | `src/flows/types.ts` | ✓ | `./flows` ✓ |
| `UpdateFlowAssetsRequest` / `UpdateFlowAssetsResponse` | `src/flows/types.ts` | ✓ | `./flows` ✓ |
| `FlowDeleteResponse` / `FlowPublishResponse` / `FlowDeprecateResponse` | `src/flows/types.ts` | ✓ | `./flows` ✓ |
| `FlowPreviewResponse` | `src/flows/types.ts` | ✓ | `./flows` ✓ |
| `MAX_FLOW_NAME_LENGTH` / `MAX_FLOW_CATEGORIES` / `MAX_FLOW_JSON_BYTES` | `src/flows/types.ts` | ✓ | `./flows` ✓ |
| `FlowMessageOptions` | `src/messages/types.ts` | ✓ (via messages) | `./messages` ✓ |
| `FlowCompletionEvent` | `src/webhooks/types.ts` | ✓ (via webhooks) | `./webhooks` ✓ |
| `WebhookNfmReply` | `src/webhooks/types.ts` | ✓ (via webhooks) | `./webhooks` ✓ |

**Invariant**: Every `FlowXxx` type a consumer could reasonably need is accessible from BOTH the main barrel AND a subpath export.

## Backward compatibility

- No existing symbols are removed, renamed, or retyped.
- The only edited existing types are `WebhookInteractivePayload` (adds `'nfm_reply'` to a union and a new optional field) and `WebhookHandlerCallbacks` (adds a new optional field). Both are additive — existing consumers continue to compile and run unchanged.
- The existing `tests/exports/` verification tests for prior subpaths are unchanged; new assertions only add `./flows`.
