# API Contract: PhoneNumbers Class

**Module**: `src/phone-numbers/phone-numbers.ts`
**Feature Branch**: `005-multi-account-management`

## Class: PhoneNumbers

### Constructor

```
PhoneNumbers(client: HttpClient, businessAccountId: string)
```

- **Throws** `ValidationError` if `businessAccountId` is empty or missing

### Methods

---

#### list(params?, requestOptions?) → Promise<ApiResponse<PhoneNumberListResponse>>

List all phone numbers registered under the business account.

**Meta API**: `GET /{waba_id}/phone_numbers`

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `params.fields` | string | No | Comma-separated field names |
| `params.limit` | number | No | Page size |
| `params.after` | string | No | Forward pagination cursor |
| `params.before` | string | No | Backward pagination cursor |
| `requestOptions` | RequestOptions | No | Timeout, signal, headers |

**Response**: `PhoneNumberListResponse`
```
{
  data: PhoneNumber[]
  paging?: { cursors?: { before?: string, after?: string } }
}
```

**Errors**: Platform errors (400, 401, 403, 500) propagated via ApiError.

---

#### get(phoneNumberId, params?, requestOptions?) → Promise<ApiResponse<PhoneNumber>>

Get details for a specific phone number.

**Meta API**: `GET /{phone_number_id}`

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `phoneNumberId` | string | Yes | Phone number ID |
| `params.fields` | string | No | Comma-separated field names |
| `requestOptions` | RequestOptions | No | Timeout, signal, headers |

**Validation**: Throws `ValidationError` if `phoneNumberId` is empty.

**Response**: `PhoneNumber` (single object, no `data` wrapper).

---

#### getBusinessProfile(phoneNumberId, params?, requestOptions?) → Promise<ApiResponse<BusinessProfile>>

Get the business profile for a phone number.

**Meta API**: `GET /{phone_number_id}/whatsapp_business_profile`

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `phoneNumberId` | string | Yes | Phone number ID |
| `params.fields` | string | No | Comma-separated field names (default: all) |
| `requestOptions` | RequestOptions | No | Timeout, signal, headers |

**Validation**: Throws `ValidationError` if `phoneNumberId` is empty.

**Response**: `BusinessProfile` (SDK unwraps the single-element `data` array from Meta's response).

---

#### updateBusinessProfile(phoneNumberId, profile, requestOptions?) → Promise<ApiResponse<SuccessResponse>>

Update the business profile for a phone number.

**Meta API**: `POST /{phone_number_id}/whatsapp_business_profile`

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `phoneNumberId` | string | Yes | Phone number ID |
| `profile` | BusinessProfileUpdate | Yes | Partial update fields |
| `requestOptions` | RequestOptions | No | Timeout, signal, headers |

**Validation**: Throws `ValidationError` if `phoneNumberId` is empty.

**Request body**: `{ messaging_product: "whatsapp", ...profile }` — SDK auto-injects `messaging_product`.

**Response**: `SuccessResponse` → `{ success: boolean }`

---

#### requestVerificationCode(phoneNumberId, options, requestOptions?) → Promise<ApiResponse<SuccessResponse>>

Request a verification code via SMS or voice call.

**Meta API**: `POST /{phone_number_id}/request_code`

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `phoneNumberId` | string | Yes | Phone number ID |
| `options.codeMethod` | CodeMethod | Yes | `'SMS'` or `'VOICE'` |
| `options.language` | string | Yes | Locale code (e.g., `'en_US'`) |
| `requestOptions` | RequestOptions | No | Timeout, signal, headers |

**Validation**:
- Throws `ValidationError` if `phoneNumberId` is empty
- Throws `ValidationError` if `codeMethod` is not `'SMS'` or `'VOICE'`
- Throws `ValidationError` if `language` is empty

**Request body**: `{ code_method: "SMS", language: "en_US" }`

**Response**: `SuccessResponse` → `{ success: boolean }`

---

#### verifyCode(phoneNumberId, options, requestOptions?) → Promise<ApiResponse<SuccessResponse>>

Submit a verification code.

**Meta API**: `POST /{phone_number_id}/verify_code`

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `phoneNumberId` | string | Yes | Phone number ID |
| `options.code` | string | Yes | 6-digit verification code |
| `requestOptions` | RequestOptions | No | Timeout, signal, headers |

**Validation**:
- Throws `ValidationError` if `phoneNumberId` is empty
- Throws `ValidationError` if `code` is empty

**Request body**: `{ code: "123456" }`

**Response**: `SuccessResponse` → `{ success: boolean }`

---

#### register(phoneNumberId, options, requestOptions?) → Promise<ApiResponse<SuccessResponse>>

Register a verified phone number with the Cloud API.

**Meta API**: `POST /{phone_number_id}/register`

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `phoneNumberId` | string | Yes | Phone number ID |
| `options.pin` | string | Yes | 6-digit two-step verification PIN |
| `requestOptions` | RequestOptions | No | Timeout, signal, headers |

**Validation**:
- Throws `ValidationError` if `phoneNumberId` is empty
- Throws `ValidationError` if `pin` is empty

**Request body**: `{ messaging_product: "whatsapp", pin: "123456" }`

**Response**: `SuccessResponse` → `{ success: boolean }`

---

#### deregister(phoneNumberId, requestOptions?) → Promise<ApiResponse<SuccessResponse>>

Deregister a phone number from the Cloud API.

**Meta API**: `POST /{phone_number_id}/deregister`

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `phoneNumberId` | string | Yes | Phone number ID |
| `requestOptions` | RequestOptions | No | Timeout, signal, headers |

**Validation**: Throws `ValidationError` if `phoneNumberId` is empty.

**Request body**: `{}` (empty)

**Response**: `SuccessResponse` → `{ success: boolean }`
