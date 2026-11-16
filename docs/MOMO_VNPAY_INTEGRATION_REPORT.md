# MoMo & VNPAY Integration Report

Status: **NOT LIVE-VERIFIED / BLOCKED_BY_BACKEND_ENVIRONMENT**.

- Routes found: `POST /api/payments/momo/create/:orderId`, `POST /api/payments/vnpay/create/:orderId`, plus MoMo IPN and VNPAY IPN/return routes.
- Both creation endpoints are customer-authenticated; amount is derived from the stored order, not trusted from the browser.
- IPNs verify provider signatures, verify amount, preserve cancelled orders, atomically prevent duplicate payment settlement, and write a transaction record.
- Browser return handlers are explicitly non-authoritative.
- No merchant secrets are exposed in frontend code. No QR payload contract was found.

Sandbox success/failure/expiry/replay/invalid-signature cases require approved provider credentials and a disposable database; they were not executed.
