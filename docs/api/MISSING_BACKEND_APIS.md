# Missing backend APIs

Verified against source on 17/11/2026.

- Customer address CRUD: no dedicated user address routes. The frontend must not store a fake address book locally.
- Guest privacy/data-subject request submission: no `/api/support/tickets` route is mounted. Guest submission is unavailable; no success response may be shown.
- Payment result lookup by provider callback/order identifier: payment return/IPN routes exist, but no authenticated client status-query route was found for the result screen.
- Frontend cart hydration: `GET /api/cart` returns the cart, while detailed item retrieval is `GET /api/cart_items/:cartId`; a client adapter and live schema verification remain required.

These items are blockers, not invitations to introduce a mock endpoint or local business-data fallback.
