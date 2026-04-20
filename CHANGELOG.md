# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- **Messages** — Send text, image, video, audio, document, sticker, location, contacts, reactions, interactive buttons/lists, template messages, product messages, product list messages, and catalog messages
- **Media** — Upload, download, retrieve URLs, and delete media assets with client-side MIME type and file size validation
- **Templates** — List, get, create, update, and delete message templates with a fluent `TemplateBuilder` API and client-side validation
- **Webhooks** — Parse incoming events into typed objects, verify signatures (HMAC SHA-256), handle template status/quality events, order events, and flow completion events; integrate with Express or Next.js App Router via middleware factories; `Webhooks` wrapper class with pre-bound config
- **Phone numbers** — List, get details, manage business profiles, request verification codes, verify, register, and deregister phone numbers
- **Multi-account** — Manage multiple WABAs with lazy client instantiation, dynamic account add/remove, dual lookup (by name or phone number ID), distribution strategies (round-robin, weighted, sticky), and broadcast messaging with pool-based concurrency control
- **Catalog** — List catalogs, get catalog details, list products, get product, create product (strict, raises `ConflictError` on duplicate), upsert product, update product, delete product; with client-side validation
- **Flows** — List, get, create, update metadata, update assets, publish, deprecate, delete, and get preview link for WhatsApp Flows
- **Unified client** — Single `WhatsApp` entry point that wires all modules with a shared `HttpClient`; lazy module initialization
- **Core HTTP client** — Authentication, token bucket rate limiting, and exponential backoff retry with jitter
- **Typed error hierarchy** — `WhatsAppError`, `ApiError`, `RateLimitError`, `AuthenticationError`, `ValidationError`, `WebhookVerificationError`, `MediaError`, `ConflictError`
- **Zero runtime dependencies** — Uses only Node.js built-in APIs (`fetch`, `crypto`, `Buffer`, `URL`)
- **Dual module output** — ESM and CJS via tsup with subpath exports for `./errors`, `./messages`, `./webhooks`, `./media`, `./templates`, `./flows`, `./phone-numbers`, `./multi-account`, `./catalog`
- **TypeScript strict mode** — Full type safety with no `any` usage
