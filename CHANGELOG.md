# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2026-02-17

### Added

- **Core client** — HTTP client with authentication, token bucket rate limiting, and exponential backoff retry with jitter
- **Messages** — Send text, image, video, audio, document, sticker, location, contacts, reactions, interactive buttons/lists, and template messages
- **Media** — Upload, download, retrieve URLs, and delete media assets with client-side MIME type and file size validation
- **Templates** — List, get, create, update, and delete message templates with a fluent TemplateBuilder API and client-side validation
- **Webhooks** — Parse incoming events into typed objects, verify signatures (HMAC SHA-256), and integrate with Express or Next.js App Router via middleware factories
- **Phone numbers** — List, get details, manage business profiles, request verification codes, verify, register, and deregister phone numbers
- **Multi-account** — Manage multiple WABAs with lazy client instantiation, dynamic account add/remove, dual lookup (by name or phone number ID), distribution strategies (round-robin, weighted, sticky), and broadcast messaging with pool-based concurrency control
- **Unified client** — Single `WhatsApp` entry point that wires all modules with a shared `HttpClient`
- **Typed error hierarchy** — `WhatsAppError`, `ApiError`, `RateLimitError`, `AuthenticationError`, `ValidationError`, `WebhookVerificationError`, `MediaError`
- **Zero runtime dependencies** — Uses only Node.js built-in APIs (`fetch`, `crypto`, `Buffer`, `URL`)
- **Dual module output** — ESM and CJS via tsup with subpath exports for `./errors`, `./messages`, `./webhooks`
- **TypeScript strict mode** — Full type safety with no `any` usage

[0.1.0]: https://github.com/abdelrahmannasr/wa-cloud-sdk/releases/tag/v0.1.0
