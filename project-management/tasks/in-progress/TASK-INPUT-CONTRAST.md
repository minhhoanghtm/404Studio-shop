# TASK-INPUT-CONTRAST — Global Input Contrast, Readability & Form UI Audit

**Status:** IN_PROGRESS
**Priority:** HIGH
**Scope:** `frontend/` only

## Objective

Standardize contrast and readable states for all native text-entry controls in light and dark themes without altering form logic, validation, APIs, or backend code.

## Audit inventory

The source audit identified 31 files containing `input`, `textarea`, or `select` controls. Coverage includes authentication and OTP, checkout/address, cart coupons, search, AI chat, account security, contact, privacy, reviews, footer subscriptions, and admin filters/forms.

## Root cause

Controls were styled independently with fixed `bg-noir-*` and `text-white` Tailwind utilities. Those values bypassed the `html.light` color variables, allowing an input's text/background pairing to become theme-inappropriate.

## Planned verification

- TypeScript/build, lint, Vitest, and Docker frontend build.
- Static audit for all native controls and the required semantic tokens.
- Playwright discovery and focused UI execution where the local browser runner is available.
