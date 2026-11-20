# Spring AI Security Test Report

## Static verification

- Both internal paths require a shared secret of at least 32 characters.
- HMAC signatures are verified with a 60-second timestamp window and constant-time comparison.
- The Node tool adapter allows only six explicit read/prepare tool names.
- Identity comes from Node after JWT/RBAC verification, not model arguments or browser headers.
- The Spring cart tool always sends `confirmed: false`; mutation remains guarded by Node pending-action confirmation.

## Runtime verification

`BLOCKED_BY_BACKEND_ENVIRONMENT`: required safe test credentials and service configuration were unavailable.
