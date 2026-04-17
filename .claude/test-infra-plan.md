# Test Infrastructure Plan
Generated: 2026-04-17

## Status Key
- [ ] Not started
- [~] In progress
- [x] Done

---

## Batch 1 — Config & setup fixes (mechanical, no test logic changes)

| # | What | File(s) | Notes | Status |
|---|------|---------|-------|--------|
| 1 | Include tests in TypeScript checking | `tsconfig.json` | Remove "tests" from exclude — DEFERRED to after Batch 3; removing it reveals ~30 pre-existing type errors in mock data that will be fixed during mock standardisation | [x] |
| 2 | Fix `console.error` global spy | `tests/setup.ts` | Was silencing ALL errors globally (Claude introduced). Removed mockImplementation — spy kept for assertions, real errors now visible | [x] |
| 3 | Replace `global.alert/confirm` assignments with `vi.stubGlobal()` | `tests/components/user-management.test.tsx`, `student-management.test.tsx`, `user-profile.test.tsx` | File-scope assignments aren't restored by `vi.restoreAllMocks()`; `vi.stubGlobal()` inside `beforeEach` is | [x] |

---

## Batch 2 — Shared mock state fixes (isolation bugs)

| # | What | File(s) | Notes | Status |
|---|------|---------|-------|--------|
| 4 | Fix `mockCookieStore` shared mutable state | `tests/unit/lib/actions/auth.test.ts` | Replaced with fresh `vi.mocked(cookies).mockResolvedValue()` in `beforeEach` | [x] |
| 5 | Remove or integrate `resetMockData()` | `tests/mocks/supabase-global.ts` | File entirely deleted — no test imported it; dead code | [x] |
| 6 | Remove or wire `setupNavigationMocks()` | `tests/mocks/next-navigation.ts` | Removed the dead function; rest of file is used correctly via setup.ts | [x] |

---

## Batch 3 — Supabase mock standardisation

| # | What | File(s) | Notes | Status |
|---|------|---------|-------|--------|
| 7 | Audit the three divergent Supabase mock patterns | All test files | Map which files use (a) global setup mock, (b) file-level redeclaration, (c) local factory | [x] |
| 8 | Create a shared Supabase mock utility | `tests/mocks/supabase.ts` (existing) | Cast mockFrom `as any` to allow partial chain overrides; `createMockSupabaseClient` already provides shared factory | [x] |
| 9 | Migrate unit action tests to shared mock | `tests/unit/lib/actions/*.test.ts` | Fixed `from: vi.fn(...) as any` pattern; explicit chain mocks appropriate for unit tests and left as-is | [x] |
| 10 | Migrate component tests to shared mock | `tests/components/*.test.tsx` | Removed redundant bare `vi.mock("@/lib/supabase/client")` declarations from 4 component tests | [x] |

---

## Batch 4 — Test quality (behaviour over implementation)

| # | What | File(s) | Notes | Status |
|---|------|---------|-------|--------|
| 11 | Refactor implementation-detail assertions | `tests/components/video-card.test.tsx` and others flagged in review | Replace `expect(mockFrom).toHaveBeenCalledWith(...)` with DOM assertions where the test intent is about visible behaviour | [ ] |

---

## Notes
- Batch 1 is safe to do directly on a single branch — pure config/setup changes
- Batch 2 items are independent of each other but should land before Batch 3
- Batch 3 item 7 (audit) must complete before 8–10 (migration)
- Batch 4 is lowest priority — tests pass, this is quality improvement only
- After each batch: run full suite to confirm nothing regressed
- Do NOT change what tests are testing — only how mocks/setup work
