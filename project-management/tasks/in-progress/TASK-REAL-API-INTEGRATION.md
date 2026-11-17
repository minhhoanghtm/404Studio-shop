# TASK-REAL-API-INTEGRATION

Status: `IN_PROGRESS` — real API source audit and initial runtime cleanup completed; live verification is blocked by missing isolated backend environment.

Scope: remove runtime mock business data, bind frontend calls only to routes verified in `backend/src`, document contract gaps, and run real API/E2E checks only against approved test infrastructure.

Completed: corrected auth refresh/logout/profile/voucher/review routes; added request timeout, abort propagation, trusted-origin enforcement, and refresh serialization; removed fake authentication state, demo login defaults, order lookup results, payment identifiers/success inference, wallet vouchers, and dashboard figures.

Blockers: no configured test MongoDB/Redis, test accounts, or payment sandbox credentials were available. No API mutation or payment attempt was made.
