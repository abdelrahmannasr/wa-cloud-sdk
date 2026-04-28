---
name: "🐛 Bug Report"
about: "Report a bug to help us improve"
title: "[Bug]: "
labels: bug
assignees: ""
---

<!--
Before filing: please verify the issue is in this SDK and not in the
upstream Meta WhatsApp Cloud API. If the failure is an error code or
behavior returned from Meta's API, it likely belongs to Meta's docs
(https://developers.facebook.com/docs/whatsapp/cloud-api) rather than
this repository.
-->

## Describe the Bug

<!-- A clear, concise description of the bug. -->

## To Reproduce

```typescript
import { WhatsApp } from '@abdelrahmannasr/wa-cloud-api';

const wa = new WhatsApp({
  accessToken: process.env.WA_ACCESS_TOKEN!,
  phoneNumberId: process.env.WA_PHONE_NUMBER_ID!,
});

// Minimal reproduction steps:
await wa.messages.sendText({ to: '1234567890', body: 'Hello!' });
```

## Expected Behavior

<!-- What you expected to happen. -->

## Actual Behavior

<!-- What actually happened, including error messages / stack traces. -->

## Environment

- **SDK version**: <!-- e.g. 0.5.0 -->
- **Node.js version**: <!-- output of `node --version` -->
- **Package manager**: <!-- pnpm / npm / yarn + version -->
- **OS**: <!-- macOS 14.4 / Ubuntu 22.04 / Windows 11 / etc. -->
- **TypeScript version**: <!-- output of `tsc --version`, or N/A if plain JS -->

## Additional Context

<!-- Logs, screenshots, related issues, or anything else that helps us understand the problem. -->
