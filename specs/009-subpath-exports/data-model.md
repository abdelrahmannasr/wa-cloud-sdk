# Data Model: Subpath Exports

## Entities

This feature involves no runtime data entities. The "data" is the mapping between subpath names and module entry points.

### Subpath Export Mapping

| Subpath | Source Entry | ESM Output | CJS Output | Types (ESM) | Types (CJS) |
|---------|-------------|------------|------------|-------------|-------------|
| `./media` | `src/media/index.ts` | `dist/media/index.js` | `dist/media/index.cjs` | `dist/media/index.d.ts` | `dist/media/index.d.cts` |
| `./templates` | `src/templates/index.ts` | `dist/templates/index.js` | `dist/templates/index.cjs` | `dist/templates/index.d.ts` | `dist/templates/index.d.cts` |
| `./phone-numbers` | `src/phone-numbers/index.ts` | `dist/phone-numbers/index.js` | `dist/phone-numbers/index.cjs` | `dist/phone-numbers/index.d.ts` | `dist/phone-numbers/index.d.cts` |
| `./multi-account` | `src/multi-account/index.ts` | `dist/multi-account/index.js` | `dist/multi-account/index.cjs` | `dist/multi-account/index.d.ts` | `dist/multi-account/index.d.cts` |

### Exported Symbols Per Subpath

**./media**: Media, MediaCategory, StickerSubtype, MediaConstraint, MediaUploadOptions, MediaUploadResponse, MediaUrlResponse, MediaDeleteResponse, MEDIA_CONSTRAINTS

**./templates**: Templates, TemplateBuilder, Template, TemplateCategory, TemplateStatus, QualityScore, TemplateComponentResponse, ButtonResponse, CreateTemplateRequest, CreateTemplateComponent, CreateTemplateButton, CreateTemplateResponse, TemplateDeleteResponse, TemplateDeleteOptions, PagingInfo, TemplateListParams, TemplateListResponse, TemplateGetOptions, TEMPLATE_NAME_PATTERN, MAX_BODY_LENGTH, MAX_HEADER_TEXT_LENGTH, MAX_FOOTER_LENGTH, MAX_BUTTON_TEXT_LENGTH, MAX_QUICK_REPLY_BUTTONS, MAX_URL_BUTTONS, MAX_PHONE_NUMBER_BUTTONS

**./phone-numbers**: PhoneNumbers, PhoneNumber, BusinessProfile, BusinessProfileUpdate, PhoneNumberListParams, PhoneNumberListResponse, BusinessProfileResponse, VerificationCodeRequest, VerifyCodeRequest, RegisterRequest, SuccessResponse, Throughput, QualityRating, CodeVerificationStatus, NameStatus, PlatformType, ThroughputLevel, AccountMode, MessagingLimitTier, CodeMethod, BusinessVertical

**./multi-account**: WhatsAppMultiAccount, RoundRobinStrategy, WeightedStrategy, StickyStrategy, AccountConfig, MultiAccountConfig, DistributionStrategy, BroadcastMessageFactory, BroadcastOptions, BroadcastSuccess, BroadcastFailure, BroadcastResult
