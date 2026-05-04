# Design: Revoke Access UX Improvements

**Date:** 2026-05-03
**Status:** Approved

## Overview

Two related improvements to the user approval/revocation flow:

1. The pending-approval page currently shows identical "awaiting approval" content to both new signups and users whose access has been revoked. Users who were previously approved should see an "Account on hold" message instead.
2. Head teachers can currently delete students but cannot revoke or restore their access. The same approve/revoke toggle available to admins should be available to head teachers on the student-management page.

## Design

### 1. Server Actions (`/lib/actions/users.ts`)

Two new server actions, following the same pattern as `deleteUserCompletely` (service-role client, audit log, returns `{ success, error }`):

**`revokeUserAccess(userId: string)`**
- Sets `is_approved: false`
- Leaves `approved_at` untouched — preserving the signal that the user was once approved
- Logs an audit event

**`restoreUserAccess(userId: string)`**
- Sets `is_approved: true`
- Sets `approved_at: now()` — records the restore timestamp
- Logs an audit event
- Does NOT send an approval email (unlike `approveUserServerAction`, which is for first-time approvals)

### 2. Component Changes

**`user-management.tsx`**

The existing `toggleUserApproval` function currently makes a direct Supabase client call and nulls `approved_at` on revoke. It is updated to call `revokeUserAccess` or `restoreUserAccess` depending on current state. The direct Supabase call and the `approved_at: null` assignment are removed.

**`student-management.tsx`**

A new `toggleStudentApproval` function is added, mirroring the shape of `deleteUser` (server action call, optimistic local state update, toast feedback). An approve/revoke toggle button is added to each student row, matching the admin UI exactly: red revoke icon when `is_approved`, green approve icon when not.

### 3. Pending Approval Page

**`app/pending-approval/page.tsx`** is refactored from a thin server component wrapper. It reads `process.env.ADMIN_EMAIL` and passes it as a prop to the existing client component (renamed to `PendingApprovalClient` or similar).

**Note:** The existing client component already has multiple conditional UI states (email confirmation, approval pending, approved, error states). The refactor must preserve all existing states — only the "awaiting approval while `is_approved: false`" case is split into two: null `approved_at` (new signup) vs set `approved_at` (revoked).

The client component gains a new UI state based on `approved_at`:

| `approved_at` | `is_approved` | Shown state |
|---|---|---|
| `null` | `false` | Existing "Awaiting approval" content (unchanged) |
| set | `false` | New "Account on hold" state (see below) |
| set | `true` | Existing "Account approved" state (unchanged) |

**"Account on hold" message:**
> Your access has been put on hold by a Head Teacher or admin. Please reach out to your Head Teacher, or [ADMIN_EMAIL], for more information.

The `approved_at` field must be included in the Supabase query on the pending page.

### Fallback: NEXT_PUBLIC_ADMIN_EMAIL rename (Option B)

Option A (server wrapper) is the primary path. Fall back to Option B only if the server wrapper introduces a test-isolation problem that cannot be resolved cleanly.

Option B: rename `ADMIN_EMAIL` to `NEXT_PUBLIC_ADMIN_EMAIL` throughout the codebase. References to update: `env.template`, `lib/actions/email.tsx`, `lib/actions/notifications.tsx`, `README.md`, `docs/DEPLOYMENT_AND_TESTING_GUIDE.md`, `docs/DEPLOYMENT_CHECKLIST.md`, `.env.local`, and `tests/unit/lib/actions/email.test.ts`.

## Data Integrity

The key invariant: `approved_at` is `null` only for users who have never been approved. It is never nulled after being set. This allows the pending page to distinguish new signups (null) from revoked users (set).

- Revoke: `approved_at` unchanged
- Restore: `approved_at` updated to now (records restore time; still non-null, invariant preserved)

## Testing

- Unit tests for `revokeUserAccess` and `restoreUserAccess` server actions
- Unit tests for the pending page client component covering all three UI states (awaiting, on hold, approved)
- Existing tests for `toggleUserApproval` in user-management updated to reflect server action calls
