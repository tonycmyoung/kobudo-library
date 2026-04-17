# Performance & Architecture Plan
Generated: 2026-04-16

## Status Key
- [ ] Not started
- [x] Done

---

## Ordered work items

### Batch 1 — Mechanical fixes (do directly, no planning needed)

| # | What | File(s) | Notes | Status |
|---|------|---------|-------|--------|
| 1 | Remove redundant `router.refresh()` | `components/user-profile.tsx` lines 346, 398 | Server action already calls revalidatePath; local state already updated | [x] |
| 2 | Parallelise 3 sequential queries | `app/profile/page.tsx` lines 27-59 | userProfile + favoriteCount + curriculums are independent → Promise.all | [x] |
| 3 | Parallelise 3 sequential queries | `lib/actions/users.tsx` `fetchStudentsForHeadTeacher` ~lines 721-750 | users + login stats + video view stats → Promise.all | [x] |
| 4 | N+1 loop → Promise.all | `lib/actions/curriculums.ts` ~lines 169-175, 500-507 | `deleteCurriculum` and `deleteLevelFromCurriculumSet` reorder loops | [x] |

### Batch 2 — Structural (light coordination needed)

| # | What | File(s) | Notes | Status |
|---|------|---------|-------|--------|
| 5 | Shared admin layout — eliminate duplicate auth+user-fetch | Create `app/admin/layout.tsx`; remove boilerplate from 8 admin pages | Removes 8 redundant DB calls per admin nav; prerequisite for #6 | [x] |
| 6 | Leverage middleware cache / React.cache for user profile | `lib/supabase/middleware.ts`, admin pages | Middleware caches isApproved+role but pages ignore it and re-fetch | [x] |
| 7 | N+1 curriculum video counts → single batch query | `lib/actions/curriculums.ts` `getCurriculums()` ~line 32 | Replace N count queries with `.in()` + JS reduce | [x] |

### Batch 3 — Caching layer (needs revalidateTag wired first)

| # | What | File(s) | Notes | Status |
|---|------|---------|-------|--------|
| 8 | Switch revalidatePath → revalidateTag across mutations | All server actions using revalidatePath | Prerequisite for #9 and #10; surgical invalidation vs whole-page rebuild | [x] |
| 9 | unstable_cache for curriculums list | `app/profile/page.tsx`, `lib/actions/curriculums.ts` | Add revalidateTag("curriculums") to add/update/delete/reorder actions | [x] |
| 10 | unstable_cache for curriculum sets + performers + categories | Similar pattern to #9 | Reference data that rarely changes | [x] |

### Batch 4 — Bigger lift

| # | What | File(s) | Notes | Status |
|---|------|---------|-------|--------|
| 11 | VideoLibrary server/client split | `components/video-library.tsx` | Move rarely-changing data (videos, categories, performers) to server component with unstable_cache; keep favorites client-side | [x] |

---

## Notes
- Items within each batch are independent; across batches, ordering matters (5 before 6; 8 before 9/10; 9/10 before 11)
- Batch 1 items are safe to do directly — isolated, mechanical, low risk
- Batch 2+ items touch more files; read affected files before editing
- After each item: run `npx vitest run <affected test files>` not the full suite
- Do NOT commit directly to main — use a branch per item or per batch
