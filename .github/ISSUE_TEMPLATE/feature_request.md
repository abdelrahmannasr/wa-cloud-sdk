---
name: "✨ Feature Request"
about: "Suggest a new feature or improvement"
title: "[Feature]: "
labels: enhancement
assignees: ""
---

## Problem

<!-- What problem are you trying to solve? What is missing or awkward in the current API? Link to related issues if any. -->

## Proposed Solution

<!-- Describe the API you'd like to see. Concrete code helps a lot. -->

```typescript
import { WhatsApp } from 'wa-cloud-sdk';

const wa = new WhatsApp({
  accessToken: process.env.WA_ACCESS_TOKEN!,
  phoneNumberId: process.env.WA_PHONE_NUMBER_ID!,
});

// Proposed API usage:
// await wa.newFeature({ ... });
```

## Alternatives Considered

<!-- What other approaches have you thought about? Why is the proposed solution preferable? -->

## Additional Context

<!-- Links to Meta API docs, related SDKs, screenshots, or any other context that supports the request. -->
