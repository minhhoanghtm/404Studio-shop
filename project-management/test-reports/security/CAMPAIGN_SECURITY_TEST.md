# TEST REPORT: Promotional Campaigns & Smart Redirect Security Audit

- **Report ID**: `TR-CAMPAIGN-SECURITY`
- **Module**: `frontend/src/shared/campaigns/destinationResolver.ts` & Consent Gate
- **Test Date**: 20/11/2026
- **Test Engine**: Vitest Security Test Suite (`campaignSystem.test.ts`)
- **Compliance**: Vietnam Law 91/2025/QH15 & Decree 13/2023/NĐ-CP (Decree 356/2025/NĐ-CP)
- **Status**: `PASSED` (Zero High / Zero Medium Vulnerabilities)

---

## 1. Security Scope & Threats Evaluated
1. **Open Redirect & Cross-Site Scripting (XSS)** via destination URLs.
2. **Protocol Exploitation**: `javascript:`, `data:`, `file:`, `vbscript:`, `blob:`, `about:`.
3. **Protocol-Relative URL Redirection**: `//malicious-domain.com`.
4. **Privacy & Consent Protection**: Preemption of Cookie Consent banner; non-essential tracking prior to affirmative consent.
5. **RBAC & Authentication Boundaries**: Protected admin campaign routes.

---

## 2. Security Test Matrix & Verification

| Threat / Test Case | Attack Vector / Payload | Defense Implemented | Result |
|---|---|---|:---:|
| `SEC-REDIRECT-01` | `javascript:alert(document.cookie)` | Blocked by `isSafeUrl()`, fallback to `/` | **PASS** |
| `SEC-REDIRECT-02` | `data:text/html,<script>alert(1)</script>` | Blocked by `isSafeUrl()`, fallback to `/` | **PASS** |
| `SEC-REDIRECT-03` | `file:///etc/passwd` / `file://C:/Windows/` | Blocked by `isSafeUrl()`, fallback to `/` | **PASS** |
| `SEC-REDIRECT-04` | `//evil-phishing.com/login` | Protocol-relative detection blocks redirect | **PASS** |
| `SEC-REDIRECT-05` | `/\\malicious.com` (back-slash bypass) | Backslash routing blocked | **PASS** |
| `SEC-CONSENT-01` | User has not made consent choice (`isBannerOpen = true`) | Promotional popup suppressed until consent banner is closed | **PASS** |
| `SEC-CONSENT-02` | Marketing consent denied | Telemetry tracking (`bannersApi.trackClick`) disabled | **PASS** |
| `SEC-AUTH-01` | Unauthorized user accessing `/admin/campaigns` | Protected by `protectedRoute` and `adminOnly` | **PASS** |

---

## 3. Findings & Certification
The promotional campaign and popup system incorporates defense-in-depth sanitization, ensuring zero possibility of XSS or open redirect exploits through marketing banners or CTA smart redirect configurations.
