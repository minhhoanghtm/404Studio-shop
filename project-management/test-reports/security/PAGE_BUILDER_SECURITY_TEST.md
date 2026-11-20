# TEST REPORT: Admin Visual Page Builder Security & Legal Protection Audit

- **Report ID**: `TR-PAGE-BUILDER-SECURITY`
- **Module**: `frontend/src/shared/cms/sanitizer.ts` & `frontend/src/shared/cms/legalValidator.ts`
- **Test Date**: 20/11/2026
- **Test Engine**: Vitest Suite (`src/test/pageBuilderSystem.test.ts`) & Playwright Network Injection
- **Compliance Standards**: Vietnam Law 91/2025/QH15, Decree 356/2025/NĐ-CP, Decree 13/2023/NĐ-CP, OWASP Top 10
- **Status**: `PASSED` (Zero High / Zero Medium Vulnerabilities)

---

## 1. Security Architecture & Threat Vectors Evaluated

1. **Cross-Site Scripting (XSS)**:
   - Malicious script injection via rich text blocks, HTML entities, and attribute payloads (`<img src=x onerror=alert(1)>`, `<script>`).
2. **Protocol & URL Exploitation**:
   - Injection of pseudo-protocols: `javascript:`, `data:`, `vbscript:`, `file:`, `blob:` into CTA buttons, text links, image sources, and video embeds.
   - Protocol-relative URLs (`//phishing-domain.com`).
3. **CSS / Style Injection**:
   - Injection of malicious CSS expression strings (`expression(...)`, `behavior: url(...)`, un-escaped closing quotes).
4. **Third-Party Video & Frame Embedding**:
   - Strict allowlisting of video sources (YouTube `youtube.com/embed`, Vimeo `player.vimeo.com/video`).
   - Rejection of unverified iframe sources.
5. **Statutory Legal Compliance Guardrail**:
   - Prevention of stripping or hiding mandatory consumer and privacy protection clauses under Vietnam Law 91/2025/QH15 and Decree 356/2025/NĐ-CP.
   - Blocking publication of statutory policies (`privacy`, `terms`, `cookie`, `return`, `shipping`) if required statutory clauses are absent or marked `mobile: false` / `desktop: false`.

---

## 2. Security Test Matrix & Verification

| Test ID | Threat / Attack Vector | Payload / Action | Defense Mechanism | Test Status |
|---|---|---|---|:---:|
| `SEC-XSS-01` | Malicious inline script | `<script>alert("XSS")</script>` | Sanitized by `sanitizeRichText` via DOMPurify stripping all active scripts | **PASS** |
| `SEC-XSS-02` | Event handler injection in HTML | `<img src=x onerror=fetch('/steal?c='+document.cookie)>` | Stripped `onerror`, only harmless tags/attributes retained | **PASS** |
| `SEC-URL-01` | JavaScript URI scheme in button | `javascript:alert(document.domain)` | Filtered by `sanitizeUrl`, replaced with fallback `#` | **PASS** |
| `SEC-URL-02` | Data URI HTML payload | `data:text/html;base64,PHNjcmlwdD4...` | Filtered by `sanitizeUrl`, replaced with fallback `#` | **PASS** |
| `SEC-URL-03` | Protocol-relative phishing URL | `//attacker.evil/auth` | Identified as insecure relative URL, replaced with fallback `#` | **PASS** |
| `SEC-EMBED-01` | Unauthorized external iframe | `<iframe src="https://evil-tracking.com">` | Allowlist enforcement allows only `youtube.com` and `vimeo.com` | **PASS** |
| `SEC-CSS-01` | CSS color expression injection | `color: expression(alert(1))` | Color sanitizer regex enforces hex, rgb, rgba, hsl, hsla, or named colors | **PASS** |
| `SEC-LEGAL-01` | Publishing Privacy Policy with missing User Rights clause | Privacy Policy missing 8 consumer rights under Decree 356/2025 | Validator fails: `hasUserRights = false`. Publishing blocked with modal guide | **PASS** |
| `SEC-LEGAL-02` | Hiding Data Controller info on Mobile viewports | Setting `responsive: { mobile: false }` on statutory block | Validator checks responsive visibility; fails if hidden on mobile or desktop | **PASS** |
| `SEC-LEGAL-03` | Statutory fallback on Storefront | Database returns empty sections or corrupted blocks | Storefront automatically displays verified statutory disclosures | **PASS** |

---

## 3. Findings & Certification
The Visual Page Builder incorporates defense-in-depth sanitization at the AST parsing, block rendering, and publishing layers. Dynamic content published by administrators cannot execute unauthorized scripts or bypass statutory consumer disclosures under Vietnamese digital privacy legislation.
