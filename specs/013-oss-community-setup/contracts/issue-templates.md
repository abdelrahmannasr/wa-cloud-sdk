# Contract: GitHub Issue Templates

**Satisfies**: FR-009, FR-010

## `.github/ISSUE_TEMPLATE/bug_report.md`

### YAML Frontmatter

```yaml
---
name: "🐛 Bug Report"
about: "Report a bug to help us improve"
title: "[Bug]: "
labels: bug
assignees: ""
---
```

### Required Body Sections (H2)

- `## Describe the Bug`
- `## To Reproduce` — MUST include a fenced `typescript` code block with an `import { WhatsApp } from '@abdelrahmannasr/wa-cloud-api'` example
- `## Expected Behavior`
- `## Actual Behavior`
- `## Environment` — MUST list: SDK version, Node.js version, package manager, OS, TypeScript version
- `## Additional Context`

## `.github/ISSUE_TEMPLATE/feature_request.md`

### YAML Frontmatter

```yaml
---
name: "✨ Feature Request"
about: "Suggest a new feature or improvement"
title: "[Feature]: "
labels: enhancement
assignees: ""
---
```

### Required Body Sections (H2)

- `## Problem`
- `## Proposed Solution` — MUST include a fenced `typescript` code block illustrating the proposed API usage
- `## Alternatives Considered`
- `## Additional Context`

## `.github/ISSUE_TEMPLATE/config.yml`

Exact content (YAML):

```yaml
blank_issues_enabled: false
contact_links:
  - name: "💬 Questions & Discussion"
    url: https://github.com/abdelrahmannasr/wa-cloud-sdk/discussions
    about: "Ask questions and discuss ideas with the community"
  - name: "📖 Meta WhatsApp Cloud API Docs"
    url: https://developers.facebook.com/docs/whatsapp/cloud-api
    about: "Official Meta WhatsApp Cloud API documentation"
```

## Validation

- `blank_issues_enabled: false` MUST be present (FR-010).
- At least one `contact_links` entry MUST point to Discussions (FR-010).
- Both templates MUST set a `title:` prefix (`[Bug]: ` / `[Feature]: `) so opened issues are scannable.
- Both templates MUST set exactly one `labels:` value matching the purpose.

## Non-requirements (explicit)

- NOT using GitHub's newer issue forms (YAML `name: …, description: …, body: [...]`): the spec's templates use the classic markdown-with-frontmatter form. Either works, but consistency with the spec wins.
