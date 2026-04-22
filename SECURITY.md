# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.x     | :white_check_mark: Active support |
| < 1.0   | :x: No support     |

## Reporting a Vulnerability

**Please do NOT open a public GitHub issue for security vulnerabilities.**

If you discover a security issue in `@abdelrahmannasr-wa/cloud-api`, please report it privately by email to:

**a.nasr.yocto@gmail.com**

Include the following in your report, to the extent you can:

- A description of the vulnerability and its potential impact
- Steps to reproduce (proof-of-concept code, minimal repro, or a crash trace)
- Suggested fix or mitigation, if you have one
- Your name and affiliation (optional — credit will be given in the release notes if you'd like)

## Response Commitment

- **Acknowledgment**: within **48 hours** of receipt, confirming we have the report.
- **Detailed response**: within **7 days**, with our initial assessment, severity, and expected remediation timeline.
- Progress updates at least weekly until a fix is shipped.

If you do not receive an acknowledgment within 48 hours, please open a [GitHub private security advisory](https://github.com/abdelrahmannasr/wa-cloud-sdk/security/advisories/new) as a fallback channel.

## Responsible Disclosure

We follow a coordinated-disclosure model:

1. You report the issue privately.
2. We confirm, investigate, and develop a fix.
3. A patched version is released to npm with a security-focused changelog entry.
4. Only after users have had a reasonable window to upgrade do we publish the full technical details of the vulnerability.

Please give us a reasonable window to fix the issue before any public disclosure.

## Scope

This policy covers the `@abdelrahmannasr-wa/cloud-api` npm package only — that is, the TypeScript SDK code in this repository and its published artifacts.

**Out of scope:**

- The upstream Meta WhatsApp Cloud API itself. Issues with Meta's service, rate limits, account bans, or template approval should be reported to Meta directly via [developers.facebook.com](https://developers.facebook.com/docs/whatsapp/cloud-api).
- Applications or services that *use* this SDK. Please report those to the respective maintainers.
- Social engineering of maintainers or other community members.

Thank you for helping keep the SDK and its users safe.
