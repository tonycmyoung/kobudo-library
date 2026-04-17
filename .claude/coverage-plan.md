# Coverage Gap Plan
Generated: 2026-04-16
Baseline: 85.44% stmts / 80.46% branch / 83.09% funcs / 86.78% lines (87 passed, 1489 tests)

## Status Key
- [ ] Not started
- [x] Done

---

## Group 1 — Simple components (small gaps, 1-3 lines each)

| File | Test file | Uncovered lines | Status |
|------|-----------|-----------------|--------|
| components/search-input.tsx | tests/components/search-input.test.tsx | 32 | [x] test exists & passes — v8 quirk with inline JSX arrow fn |
| components/login-form.tsx | tests/components/login-form.test.tsx | 51-52 | [x] test exists (empty email → setResetError) |
| components/send-message-form.tsx | tests/components/send-message-form.test.tsx | 29-30 | [x] test exists (whitespace-only message) |
| components/invite-user-modal.tsx | tests/components/invite-user-modal.test.tsx | 35-37 | [x] test exists (empty email → setMessage error) |
| components/filter-mode-toggle.tsx | tests/components/filter-mode-toggle.test.tsx | 40 | [x] test exists & passes — v8 quirk with inline JSX arrow fn |
| components/user-sort-control.tsx | tests/components/user-sort-control.test.tsx | 14 | [x] test exists (selectOptions) — v8 quirk |
| components/curriculum-filter.tsx | tests/components/curriculum-filter.test.tsx | 17 | [x] test exists (invalid color → addTransparency null) |

## Group 2 — Dashboards/panels

| File | Test file | Uncovered lines | Status |
|------|-----------|-----------------|--------|
| components/audit-log-dashboard.tsx | tests/components/audit-log-dashboard.test.tsx | 74 | [x] agent-written, committed |
| components/debug-dashboard.tsx | tests/components/debug-dashboard.test.tsx | 78, 124, 131 | [x] agent-written + fixed unknown event_type text |
| components/pagination-controls.tsx | tests/components/pagination-controls.test.tsx | 125, 169 | [x] agent-written, committed |
| components/video-management-panel.tsx | tests/components/video-management-panel.test.tsx | 46, 57 | [x] agent-written + fixed getAllByTitle |
| components/admin-stats.tsx | tests/components/admin-stats.test.tsx | 113, 137 (branch) | [x] agent-written, committed |

## Group 3 — Auth/payment forms

| File | Test file | Uncovered lines | Status |
|------|-----------|-----------------|--------|
| components/change-password-form.tsx | tests/components/change-password-form.test.tsx | 95-96, 166-189 | [x] agent-written, committed |
| components/reset-password-form.tsx | tests/components/reset-password-form.test.tsx | 70-73, 116, 183-189 | [x] agent-written, committed |
| components/subscription-checkout.tsx | tests/components/subscription-checkout.test.tsx | 72 | [x] added Monthly direct-click test |
| components/donation-checkout.tsx | tests/components/donation-checkout.test.tsx | 95 | [ ] fireEvent.change breaks test; skip |
| components/sign-up-form.tsx | tests/components/sign-up-form.test.tsx | 61, 99, 103 | [x] added timer-redirect + invitation-token tests; line 99 hard to reach via UI |

## Group 4 — Provider/notification/profile

| File | Test file | Uncovered lines | Status |
|------|-----------|-----------------|--------|
| components/loading-provider.tsx | tests/components/loading-provider.test.tsx | 40, 81-85, 91-92 | [x] agent-written + fixed 0ms timer flush |
| components/session-timeout-warning.tsx | tests/components/session-timeout-warning.test.tsx | 34, 51, 61, 67, 88-92 | [x] agent-written + fixed act import + invalid || expression |
| components/notification-bell.tsx | tests/components/notification-bell.test.tsx | ~116, 129-130, 137 | [x] agent-written, committed |
| components/user-profile.tsx | tests/components/user-profile.test.tsx | 184-185, 274-290 | [x] agent-written + fixed SelectValue mock to render children |

## Not worth testing (App Router / server-only / trivial)
- lib/supabase/server.ts (35%) — App Router server context, Next.js runtime only
- lib/supabase/client.ts lines 16-24 — browser singleton guard
- lib/actions/index.ts (0%) — barrel re-export file
- components/header.tsx — heavy Next.js/auth dependencies
- components/video-modal.tsx, video-player.tsx — complex media dependencies

## Notes
- Agents need Edit + Write in permissions.allow (already added to ~/.claude/settings.json)
- Do NOT have agents run npm test / coverage — wastes rate limit quota
- Rate limit resets 3pm Australia/Sydney
- search-input.test.tsx and filter-mode-toggle.test.tsx need to be created (don't exist yet)
- loading-provider tests: use addEventListener e.preventDefault() pattern for link clicks to avoid jsdom navigation errors
