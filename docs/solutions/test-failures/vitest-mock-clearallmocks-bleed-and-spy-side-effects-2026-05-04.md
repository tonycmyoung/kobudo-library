---
title: "Vitest: clearAllMocks bleed, console.error spy throws, getByText multi-match"
date: 2026-05-04
category: docs/solutions/test-failures/
module: Testing
problem_type: test_failure
component: testing_framework
symptoms:
  - "mockReturnValue set in one test bleeds into subsequent tests despite vi.clearAllMocks() in beforeEach"
  - "Component state (via setError) is never updated — console.error spy throws before the setState call is reached"
  - "getByText throws 'Found multiple elements' when the same text appears in both a card title and a body paragraph"
root_cause: test_isolation
resolution_type: test_fix
severity: high
tags:
  - vitest
  - react-testing-library
  - mock-isolation
  - console-spy
  - getbytext
---

# Vitest: clearAllMocks bleed, console.error spy throws, getByText multi-match

## Problem

Three related Vitest + React Testing Library failure modes that produce misleading test results: mock return values leaking between tests, a global `console.error` spy interrupting component state updates, and `getByText` failing on ambiguous multi-element matches. Each is non-obvious because the symptom (wrong rendered state, wrong error message, query throw) appears far from the actual cause.

## Symptoms

**Pitfall 1 — `mockReturnValue` bleeding across tests:**
- A test expecting to render the "Account Status" card instead renders "Account Created!" (a different UI branch)
- The symptom appears in a test that never explicitly configures the relevant mock
- `vi.clearAllMocks()` is already present in `beforeEach` and provides no relief

**Pitfall 2 — Global `console.error` spy blocks component state:**
- A test expecting an error message (`"Unable to check account status"`) instead finds the unauthenticated fallback (`"Please sign in..."`)
- Mock setup and assertions both look correct
- Debug logs show the data-fetching callback fires, but `setError` is never reached
- No lint or type errors — the test silently renders the wrong branch

**Pitfall 3 — `getByText` throws on multi-element matches:**
- `screen.getByText("Email Confirmation Required")` throws `"Found multiple elements with the text..."`
- The string is unambiguous and correctly spelled
- The element is definitely in the DOM

## What Didn't Work

**Pitfall 1:**
- `vi.clearAllMocks()` in `beforeEach` was already there — it only resets call history (`.mock.calls`, `.mock.results`), not return values set with `mockReturnValue`
- Changing test ordering — the leak is not order-dependent once any test in the file sets a `mockReturnValue`

**Pitfall 2:**
- Re-reading mock setup and assertions — both were correct
- Looking for conditional rendering logic bugs — the component code was fine
- The root cause is not in the test file at all; it is in `tests/setup.ts` installing a spy that throws on any `console.error` call

**Pitfall 3:**
- Verifying the text content — string was present and correct
- Using `queryByText` instead — same problem, still an ambiguous match
- The component intentionally renders the same string in both a `<CardTitle>` heading and a `<p>` in the card body

## Solution

**Pitfall 1 — Explicitly reset `mockReturnValue` in `beforeEach`:**

```typescript
beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(useSearchParams).mockReturnValue(
    { get: vi.fn(() => null) } as unknown as ReturnType<typeof useSearchParams>
  )
})
```

The key distinction: `vi.clearAllMocks()` resets call history for all mocks. `vi.restoreAllMocks()` (used in `afterEach` in this project) restores spies created with `vi.spyOn` to their originals — but has **no effect** on `vi.fn()` mocks or `vi.mock()` factory stubs. Those retain their `mockReturnValue` across tests regardless of either call. The only reliable fix is an explicit re-`mockReturnValue()` in `beforeEach`.

Do NOT switch to `vi.resetAllMocks()` globally — it resets implementations as well as return values, breaking module-level `vi.mock()` factories defined outside `beforeEach`.

**Pitfall 2 — Install a local `console.error` no-op for any test that exercises an error path:**

```typescript
it('shows error message when DB fetch fails', async () => {
  vi.spyOn(console, 'error').mockImplementation(() => {})

  mockSupabase.from.mockReturnValue({
    select: vi.fn().mockReturnValue({
      eq: vi.fn().mockResolvedValue({ data: null, error: { message: 'DB error' } }),
    }),
  })

  render(<AccountStatus />)
  expect(await screen.findByText('Unable to check account status')).toBeInTheDocument()
})
```

This works via property-replacement layering: `vi.spyOn` replaces `console.error` with a new no-op, wrapping the already-installed throwing spy. Because the local spy's implementation runs instead, the throw is suppressed and execution reaches `setState`. `vi.restoreAllMocks()` in `afterEach` restores both layers in order.

**Pitfall 3 — Target by role (preferred) or use `getAllByText`:**

```typescript
// Preferred: semantically precise, single-element match
expect(
  screen.getByRole('heading', { name: 'Email Confirmation Required' })
).toBeInTheDocument()

// Alternative: when role targeting is not practical
expect(screen.getAllByText('Email Confirmation Required')).toHaveLength(2)
```

## Why This Works

**Pitfall 1:** `vi.clearAllMocks()` resets call counts and recorded arguments. `vi.restoreAllMocks()` restores spies. Neither touches the return value of a `vi.fn()` or `vi.mock()` module factory stub — that value persists until explicitly overridden. Setting the neutral value in `beforeEach` ensures every test starts from a known state.

**Pitfall 2:** `tests/setup.ts` installs a project-wide `console.error` spy whose implementation throws. When a component calls `console.error(...)` before `setError(...)`, the thrown error unwinds the call stack before state is updated. An outer `catch` block may re-enter the same throwing spy, compounding the problem. The component renders its initial state rather than the error state the test expects. A local no-op override swallows the log and allows execution to reach the `setState` call.

**Pitfall 3:** `getByText` enforces a single-match contract — it throws if zero or more than one element matches. When the same string is rendered in multiple nodes (card heading + body paragraph), the contract is violated. `getByRole` narrows the query to a specific semantic element. `getAllByText` relaxes the contract to "one or more" and `.toHaveLength(n)` asserts the expected count precisely.

## Prevention

The single highest-leverage step is **reading `tests/setup.ts` before writing any new describe block.** The throwing `console.error` spy is the hardest failure to diagnose — the symptom is a wrong component state, the cause is in the infrastructure file.

Checklist before writing a new test file or describe block:

1. **Read `tests/setup.ts`** — identify which globals have throwing implementations. Any component code path that calls those globals will abort mid-execution.

2. **In `beforeEach`, explicitly reset any mock that has `mockReturnValue` set anywhere in the describe block.** This applies to `vi.fn()` mocks and `vi.mock()` factory stubs — `vi.restoreAllMocks()` does NOT reset these. Reset to the neutral default explicitly.

3. **Any test that deliberately triggers an error path where the component calls `console.error`:** install a local no-op at the top of the `it` block:
   ```typescript
   vi.spyOn(console, 'error').mockImplementation(() => {})
   ```

4. **Before using `getByText`:** check whether the text string appears more than once in the rendered output. Use `getByRole` for semantic targeting, or `getAllByText(...).toHaveLength(n)` when the count is known.

## Related Issues

- No existing `docs/solutions/` docs cover this problem area (this is the first entry in the knowledge store)
- `tests/setup.ts` contains the global spy configuration that triggers Pitfall 2 — check there first when debugging unexpected component state in error-path tests
