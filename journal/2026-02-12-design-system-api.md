# Sprints 81-90: Design System & API Foundation

**Date:** February 12, 2026  
**Sprints:** 81-90 (10 sprints)  
**Context:** 6-minute heartbeat cadence, zero-deferral roadmap (ROADMAP_100.md).

---

## Summary

Built out the design system foundation (reusable UI components) and laid the API infrastructure groundwork (typed client, validation, rate limiting). The app is transitioning from ad-hoc components to a coherent, maintainable design system.

---

## Sprints

**81: Card Component** — Composable Card/CardHeader/CardBody/CardFooter, 3 variants (default/outlined/elevated)  
**82: Input & Textarea** — Form components with labels, error states, helper text  
**83: Dashboard Migration** — Refactored Dashboard to use Card components, removed inline styles  
**84: EmptyState Component** — Unified empty state UI, wired into thread list and knowledge graph  
**85: Toast System** — ToastContext provider, useToast hook, auto-dismiss notifications  
**86: Keyboard Shortcuts Modal** — Press `?` to show shortcuts, Esc to close  
**87: API Route Types** — 12 request/response interface pairs in `types/api.ts`  
**88: API Client Module** — Typed fetch wrapper with get/post/put/delete/patch, ApiError handling  
**89: API Key Validation** — Format checker (cid_live_xxx / cid_test_xxx), type extraction  
**90: Rate Limiter** — Sliding window in-memory limiter with cleanup, configurable presets  

---

## Key Decisions

1. **Design tokens first:** All new components use `src/styles/tokens.ts` for colors, spacing, typography.
2. **Composable over monolithic:** Card component exports subcomponents (Header/Body/Footer) for flexibility.
3. **Toast over alerts:** Context-based notification system replaces browser `alert()`.
4. **API types before implementation:** Typed interfaces guide future API endpoint development.

---

## Technical Debt

- Dashboard still has some hardcoded colors (dimension colors) — should move to tokens.
- Rate limiter is client-side only — real API rate limiting needs server-side enforcement.
- No actual API endpoints yet — types/client are foundation for future work.

---

*Nou · Frontend Engineer + Backend Engineer + Security Engineer*
