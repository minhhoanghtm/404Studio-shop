# Real API integration audit

Date: 17/11/2026. Scope: source-level frontend/backend audit.

## Findings

- Runtime mock business data was present in auth/session, cart, wishlist, voucher wallet, order lookup, payment result, privacy request, admin, and security paths.
- The centralized client had route drift and a broken concurrent-401 refresh path.
- Backend routes are mounted beneath `/api`; the router source was used as contract authority.

## Remediation completed

- Client now has a configurable base URL, trusted absolute URL rejection, 15-second configurable timeout, abort propagation, same-origin credentials, and single-flight `/auth/refreshToken` refresh.
- Corrected source-confirmed API paths and removed fake auth session/default credentials, fabricated order lookup responses, fake voucher wallet entries, invented payment references/success, and dashboard figures.

## Remaining risk

Many older local-state cart/wishlist/test fixtures and pages require a separate full migration. Live API compatibility remains unverified without approved isolated services.
