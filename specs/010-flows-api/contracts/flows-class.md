# Contract: `Flows` CRUD class

**File**: `src/flows/flows.ts`
**Exports**: Named `Flows` class
**Dependency injection**: Takes `HttpClient` via constructor, same as existing `Templates`, `Media`, `PhoneNumbers`, `Messages` classes.

## Constructor

```ts
constructor(client: HttpClient, businessAccountId: string)
```

**Throws**: `ValidationError` if `businessAccountId` is empty or whitespace-only.
**Stores**: `private readonly client`, `private readonly businessAccountId`.

## Public methods

Every method is `async`, returns `Promise<ApiResponse<T>>`, accepts an optional `RequestOptions` as the last parameter, and routes through the injected `HttpClient`.

### `list(params?, requestOptions?)`

```ts
async list(
  params?: FlowListParams,
  requestOptions?: RequestOptions,
): Promise<ApiResponse<FlowListResponse>>
```

- **HTTP**: `GET {businessAccountId}/flows`
- **Query params**: `limit`, `after`, `before` passed through directly; `fields` joined with `,`
- **Empty params**: Both `params` and `requestOptions` omitted → call signature is `client.get(path, undefined)`
- **Merging**: When both `params` and `requestOptions` are provided, query params are merged into `requestOptions.params`

### `get(flowId, options?, requestOptions?)`

```ts
async get(
  flowId: string,
  options?: FlowGetOptions,
  requestOptions?: RequestOptions,
): Promise<ApiResponse<Flow>>
```

- **HTTP**: `GET {flowId}`
- **Query params**: `options.fields` joined with `,` if present
- **Note**: Path is the bare `flowId`, not `{wabaId}/{flowId}` — platform requirement

### `create(request, requestOptions?)`

```ts
async create(
  request: CreateFlowRequest,
  requestOptions?: RequestOptions,
): Promise<ApiResponse<CreateFlowResponse>>
```

- **HTTP**: `POST {businessAccountId}/flows`
- **Body**: The `request` object serialized as JSON
- **Platform validation**: Flow JSON validation errors return inside `CreateFlowResponse.validation_errors` within a 2xx response (not a 4xx). No exception thrown for validation failures.

### `updateMetadata(flowId, updates, requestOptions?)`

```ts
async updateMetadata(
  flowId: string,
  updates: UpdateFlowMetadataRequest,
  requestOptions?: RequestOptions,
): Promise<ApiResponse<{ success: boolean }>>
```

- **HTTP**: `POST {flowId}`
- **Body**: The `updates` object as JSON
- **Scope**: Only metadata (name, categories, endpoint_uri, application_id). Does NOT touch flow JSON.

### `updateAssets(flowId, request, requestOptions?)`

```ts
async updateAssets(
  flowId: string,
  request: UpdateFlowAssetsRequest,
  requestOptions?: RequestOptions,
): Promise<ApiResponse<UpdateFlowAssetsResponse>>
```

- **HTTP**: `POST {flowId}/assets` — **multipart/form-data**
- **Body construction**:
  - If `request.flow_json` is a `string`, use it directly
  - If `request.flow_json` is `Record<string, unknown>`, call `JSON.stringify(request.flow_json)` internally
  - Build a `Blob` with `type: 'application/json'`
  - Construct `FormData` with fields: `name` (default `'flow.json'`), `asset_type` (default `'FLOW_JSON'`), `file` (the Blob)
- **Transport**: Routes through existing `HttpClient.upload(path, formData, options)` — no new HttpClient work needed
- **Platform validation**: Validation errors return inside `UpdateFlowAssetsResponse.validation_errors`

### `publish(flowId, requestOptions?)`

```ts
async publish(
  flowId: string,
  requestOptions?: RequestOptions,
): Promise<ApiResponse<FlowPublishResponse>>
```

- **HTTP**: `POST {flowId}/publish`
- **Body**: Empty JSON `{}`

### `deprecate(flowId, requestOptions?)`

```ts
async deprecate(
  flowId: string,
  requestOptions?: RequestOptions,
): Promise<ApiResponse<FlowDeprecateResponse>>
```

- **HTTP**: `POST {flowId}/deprecate`
- **Body**: Empty JSON `{}`

### `delete(flowId, requestOptions?)`

```ts
async delete(
  flowId: string,
  requestOptions?: RequestOptions,
): Promise<ApiResponse<FlowDeleteResponse>>
```

- **HTTP**: `DELETE {flowId}`
- **Error surface**: Platform rejects deletion of non-draft flows with an `ApiError`. The SDK does not pre-check status; callers handle the error.

### `getPreview(flowId, requestOptions?)`

```ts
async getPreview(
  flowId: string,
  requestOptions?: RequestOptions,
): Promise<ApiResponse<FlowPreviewResponse>>
```

- **HTTP**: `GET {flowId}?fields=preview.invalidate(false)`
- **Shortcut**: Equivalent to calling `get(flowId, { fields: ['preview.invalidate(false)'] })` but returns a narrower response type for ergonomics.

## Error contract

| Scenario | SDK behavior |
|---|---|
| Empty/whitespace `businessAccountId` at construction | Throws `ValidationError('businessAccountId is required and cannot be empty', 'businessAccountId')` |
| Platform returns 4xx/5xx | Throws `ApiError` (with typed subclasses `AuthenticationError`, `RateLimitError` as applicable), via existing `HttpClient` error parsing |
| Flow JSON invalid (returned in 2xx `validation_errors`) | Returns the response normally; consumer inspects `validation_errors` |
| Delete non-draft flow | Platform returns 4xx → `ApiError` |
| Rate limit hit | `RateLimitError` → existing retry logic applies |

## TSDoc requirements

Every public method MUST have a TSDoc block including:
- Summary line
- `@param` for each parameter (with value semantics)
- `@returns` description
- `@throws` for error conditions
- `@example` block showing typical usage

Style reference: `src/templates/templates.ts:79-91`.

## Test coverage targets

| Method | Minimum test cases |
|---|---|
| `constructor` | 5 (valid, empty string, whitespace, undefined, null) |
| `list` | 5 (no params, limit+cursors, fields joined, requestOptions forwarded, response typing) |
| `get` | 4 (basic id, fields joined, requestOptions forwarded, response typing) |
| `create` | 3 (correct body+path, validation_errors pass-through, requestOptions forwarded) |
| `updateMetadata` | 3 (correct body+path, partial updates, requestOptions forwarded) |
| `updateAssets` | 4 (string flow_json, object flow_json → stringified, default name/asset_type, explicit name/asset_type) |
| `publish` | 2 (correct path, requestOptions forwarded) |
| `deprecate` | 2 (correct path, requestOptions forwarded) |
| `delete` | 2 (correct path, requestOptions forwarded) |
| `getPreview` | 2 (correct query param, response shape) |

**Total**: ~32 unit tests in `tests/flows/flows.test.ts`.

**Mock setup**: Copy `createMockClient()` from `tests/templates/templates.test.ts:9-26`, extended to include an `upload` spy in addition to `get`, `post`, `delete` spies.
