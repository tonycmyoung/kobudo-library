# Revoke Access UX Improvements Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Differentiate "pending approval" from "access revoked" on the pending-approval page, and give head teachers the same approve/revoke toggle that admins have on the student-management page.

**Architecture:** Two new server actions (`revokeUserAccess`, `restoreUserAccess`) follow the `deleteUserCompletely` pattern — service-role client, auth check, audit log. Both management components call these actions. The pending-approval page is split into a thin server wrapper (reads `ADMIN_EMAIL`) and an extracted client component that gains a new "Account on hold" UI state gated on `approved_at`.

**Tech Stack:** Next.js 15 App Router, TypeScript, Supabase (service-role client), Vitest + React Testing Library, shadcn/ui, lucide-react.

---

## File Map

| File | Change |
|---|---|
| `lib/actions/users.tsx` | Add `revokeUserAccess` and `restoreUserAccess` |
| `lib/actions/index.ts` | Export the two new actions |
| `components/user-management.tsx` | Update `toggleUserApproval` to call server actions |
| `components/student-management.tsx` | Add `toggleStudentApproval` function + approve/revoke button |
| `app/pending-approval/page.tsx` | Convert to thin server component wrapper |
| `app/pending-approval/pending-approval-client.tsx` | New file — extracted client component with "on hold" state |
| `tests/unit/lib/actions/users.test.ts` | Add tests for the two new server actions |
| `tests/components/pending-approval-client.test.tsx` | New file — tests for all UI states of the client component |

---

## Task 1: Server actions — `revokeUserAccess` and `restoreUserAccess`

**Files:**
- Modify: `lib/actions/users.tsx` (append after `deleteUserCompletely`)
- Modify: `tests/unit/lib/actions/users.test.ts` (append new describe blocks)

### Step 1.1: Write failing tests for `revokeUserAccess`

Append to `tests/unit/lib/actions/users.test.ts`. The existing file already has all mocks and imports set up — just add a new `describe` block at the end, inside the outer `describe("User Actions", ...)`.

```typescript
describe("revokeUserAccess", () => {
  it("returns error when not authenticated", async () => {
    mockSupabaseClient.auth.getUser.mockResolvedValue({ data: { user: null } })
    const result = await revokeUserAccess("user-123")
    expect(result).toEqual({ error: "Not authenticated" })
  })

  it("returns error when caller is not admin or head teacher", async () => {
    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: { id: "caller-id", email: "caller@test.com" } },
    })
    mockSupabaseClient.from.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: { role: "Student" } }),
    })
    const result = await revokeUserAccess("user-123")
    expect(result).toEqual({ error: "Unauthorized" })
  })

  it("sets is_approved to false without touching approved_at", async () => {
    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: { id: "caller-id", email: "caller@test.com" } },
    })
    mockSupabaseClient.from.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: { role: "Admin" } }),
    })
    const updateMock = vi.fn().mockReturnThis()
    mockServiceClient.from.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: { email: "user@test.com", full_name: "Test User" } }),
      update: updateMock,
    })
    mockServiceClient.from.mockReturnValueOnce({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: { email: "user@test.com", full_name: "Test User" } }),
    })
    mockServiceClient.from.mockReturnValue({
      update: updateMock,
      eq: vi.fn().mockResolvedValue({ error: null }),
    })

    const result = await revokeUserAccess("user-123")

    expect(result).toEqual({ success: "User access revoked" })
    expect(updateMock).toHaveBeenCalledWith({ is_approved: false })
  })

  it("returns error when database update fails", async () => {
    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: { id: "caller-id", email: "caller@test.com" } },
    })
    mockSupabaseClient.from.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: { role: "Admin" } }),
    })
    mockServiceClient.from.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({ error: { message: "DB error" } }),
      single: vi.fn().mockResolvedValue({ data: { email: "user@test.com", full_name: "Test User" } }),
    })
    const result = await revokeUserAccess("user-123")
    expect(result).toEqual({ error: "Failed to revoke user access" })
  })
})

describe("restoreUserAccess", () => {
  it("returns error when not authenticated", async () => {
    mockSupabaseClient.auth.getUser.mockResolvedValue({ data: { user: null } })
    const result = await restoreUserAccess("user-123")
    expect(result).toEqual({ error: "Not authenticated" })
  })

  it("returns error when caller is not admin or head teacher", async () => {
    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: { id: "caller-id", email: "caller@test.com" } },
    })
    mockSupabaseClient.from.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: { role: "Student" } }),
    })
    const result = await restoreUserAccess("user-123")
    expect(result).toEqual({ error: "Unauthorized" })
  })

  it("sets is_approved to true and updates approved_at", async () => {
    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: { id: "caller-id", email: "caller@test.com" } },
    })
    mockSupabaseClient.from.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: { role: "Head Teacher" } }),
    })
    const updateMock = vi.fn().mockReturnThis()
    mockServiceClient.from.mockReturnValueOnce({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: { email: "user@test.com", full_name: "Test User" } }),
    })
    mockServiceClient.from.mockReturnValue({
      update: updateMock,
      eq: vi.fn().mockResolvedValue({ error: null }),
    })

    const result = await restoreUserAccess("user-123")

    expect(result).toEqual({ success: "User access restored" })
    expect(updateMock).toHaveBeenCalledWith(
      expect.objectContaining({ is_approved: true, approved_at: expect.any(String) }),
    )
  })
})
```

Also add `revokeUserAccess, restoreUserAccess` to the import at the top of the test file.

- [ ] **Step 1.2: Run tests to verify they fail**

```bash
npm test -- tests/unit/lib/actions/users.test.ts --reporter=verbose 2>&1 | tee /tmp/test-out.txt
grep -E "revokeUserAccess|restoreUserAccess|FAIL|cannot find" /tmp/test-out.txt
```

Expected: import errors or test failures (functions don't exist yet).

- [ ] **Step 1.3: Implement `revokeUserAccess`**

Append to `lib/actions/users.tsx` (after `deleteUserCompletely`, before `updateProfile`):

```typescript
export async function revokeUserAccess(userId: string) {
  try {
    const supabase = await createServerClient()
    const { data: currentUser } = await supabase.auth.getUser()
    if (!currentUser.user) return { error: "Not authenticated" }

    const { data: callerProfile } = await supabase
      .from("users")
      .select("role")
      .eq("id", currentUser.user.id)
      .single()

    if (callerProfile?.role !== "Admin" && callerProfile?.role !== "Head Teacher") {
      return { error: "Unauthorized" }
    }

    const serviceSupabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

    const { data: targetUser } = await serviceSupabase
      .from("users")
      .select("email, full_name")
      .eq("id", userId)
      .single()

    const { error } = await serviceSupabase
      .from("users")
      .update({ is_approved: false })
      .eq("id", userId)

    if (error) {
      console.error("Error revoking user access:", error)
      return { error: "Failed to revoke user access" }
    }

    await logAuditEvent({
      actor_id: currentUser.user.id,
      actor_email: currentUser.user.email!,
      action: "user_revoke",
      target_id: userId,
      target_email: targetUser?.email || "",
      additional_data: { target_name: targetUser?.full_name },
    })

    revalidateTag("admin-users")
    return { success: "User access revoked" }
  } catch (error) {
    console.error("Error in revokeUserAccess:", error)
    return { error: "Failed to revoke user access" }
  }
}
```

- [ ] **Step 1.4: Implement `restoreUserAccess`**

Append immediately after `revokeUserAccess`:

```typescript
export async function restoreUserAccess(userId: string) {
  try {
    const supabase = await createServerClient()
    const { data: currentUser } = await supabase.auth.getUser()
    if (!currentUser.user) return { error: "Not authenticated" }

    const { data: callerProfile } = await supabase
      .from("users")
      .select("role")
      .eq("id", currentUser.user.id)
      .single()

    if (callerProfile?.role !== "Admin" && callerProfile?.role !== "Head Teacher") {
      return { error: "Unauthorized" }
    }

    const serviceSupabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

    const { data: targetUser } = await serviceSupabase
      .from("users")
      .select("email, full_name")
      .eq("id", userId)
      .single()

    const { error } = await serviceSupabase
      .from("users")
      .update({ is_approved: true, approved_at: new Date().toISOString() })
      .eq("id", userId)

    if (error) {
      console.error("Error restoring user access:", error)
      return { error: "Failed to restore user access" }
    }

    await logAuditEvent({
      actor_id: currentUser.user.id,
      actor_email: currentUser.user.email!,
      action: "user_restore",
      target_id: userId,
      target_email: targetUser?.email || "",
      additional_data: { target_name: targetUser?.full_name },
    })

    revalidateTag("admin-users")
    return { success: "User access restored" }
  } catch (error) {
    console.error("Error in restoreUserAccess:", error)
    return { error: "Failed to restore user access" }
  }
}
```

- [ ] **Step 1.5: Run tests to verify they pass**

```bash
npm test -- tests/unit/lib/actions/users.test.ts --reporter=verbose 2>&1 | tee /tmp/test-out.txt
grep -E "revokeUserAccess|restoreUserAccess|FAIL|PASS" /tmp/test-out.txt
```

Expected: all new tests PASS.

- [ ] **Step 1.6: Commit**

```bash
git add lib/actions/users.tsx tests/unit/lib/actions/users.test.ts
git commit -m "feat: add revokeUserAccess and restoreUserAccess server actions"
```

---

## Task 2: Export new actions from index

**Files:**
- Modify: `lib/actions/index.ts`

- [ ] **Step 2.1: Add exports**

In `lib/actions/index.ts`, add `revokeUserAccess` and `restoreUserAccess` to the existing `./users` export line:

```typescript
export {
  inviteUser,
  approveUserServerAction,
  rejectUserServerAction,
  updateUserFields,
  updateStudentForHeadTeacher,
  updatePendingUserFields,
  deleteUserCompletely,
  revokeUserAccess,
  restoreUserAccess,
  updateProfile,
  fetchPendingUsers,
  fetchUnconfirmedEmailUsers,
  resendConfirmationEmail,
  adminResetUserPassword,
  fetchStudentsForHeadTeacher,
} from "./users"
```

- [ ] **Step 2.2: Type-check**

```bash
npm run type-check 2>&1 | tee /tmp/tc-out.txt
grep -E "error TS|revokeUser|restoreUser" /tmp/tc-out.txt
```

Expected: no errors.

- [ ] **Step 2.3: Commit**

```bash
git add lib/actions/index.ts
git commit -m "feat: export revokeUserAccess and restoreUserAccess from actions index"
```

---

## Task 3: Update `user-management.tsx` — switch `toggleUserApproval` to server actions

**Files:**
- Modify: `components/user-management.tsx`

The existing `toggleUserApproval` (line ~1053) makes a direct Supabase client call and nulls `approved_at` on revoke. Replace it entirely.

- [ ] **Step 3.1: Update import in `user-management.tsx`**

Find the existing import line (line ~34):
```typescript
import { deleteUserCompletely, updateUserFields, adminResetUserPassword } from "@/lib/actions"
```

Replace with:
```typescript
import { deleteUserCompletely, updateUserFields, adminResetUserPassword, revokeUserAccess, restoreUserAccess } from "@/lib/actions"
```

- [ ] **Step 3.2: Replace `toggleUserApproval` body**

Find the `toggleUserApproval` function (line ~1053–1087). Replace its entire body:

```typescript
const toggleUserApproval = async (userId: string, currentStatus: boolean) => {
  setProcessingUsers((prev) => new Set(prev).add(userId))

  try {
    const result = currentStatus
      ? await revokeUserAccess(userId)
      : await restoreUserAccess(userId)

    if (result.error) throw new Error(result.error)

    setUsers((prev) =>
      prev.map((user) =>
        user.id === userId
          ? {
              ...user,
              is_approved: !currentStatus,
              approved_at: !currentStatus ? new Date().toISOString() : user.approved_at,
            }
          : user,
      ),
    )
  } catch (error) {
    console.error("Error updating user approval:", error)
  } finally {
    setProcessingUsers((prev) => {
      const newSet = new Set(prev)
      newSet.delete(userId)
      return newSet
    })
  }
}
```

The key changes: calls server actions instead of direct Supabase client; on revoke, `approved_at` stays as-is in local state (no null assignment); on restore, `approved_at` is set to now.

- [ ] **Step 3.3: Type-check and lint**

```bash
npm run type-check 2>&1 | tee /tmp/tc-out.txt && npm run lint 2>&1 | tee -a /tmp/tc-out.txt
grep -E "error|warn" /tmp/tc-out.txt | grep -v "node_modules"
```

Expected: no errors.

- [ ] **Step 3.4: Update `user-management` component tests**

`tests/components/user-management.test.tsx` currently mocks the Supabase client for `toggleUserApproval`. After this change it must mock the server actions instead.

In `tests/components/user-management.test.tsx`:

1. Add `revokeUserAccess` and `restoreUserAccess` to the existing `vi.mock("@/lib/actions", ...)` block:

```typescript
vi.mock("@/lib/actions", () => ({
  deleteUserCompletely: vi.fn(),
  updateUserFields: vi.fn(),
  adminResetUserPassword: vi.fn(),
  revokeUserAccess: vi.fn().mockResolvedValue({ success: "User access revoked" }),
  restoreUserAccess: vi.fn().mockResolvedValue({ success: "User access restored" }),
}))
```

2. Add the import at the top of the file alongside the existing actions import:

```typescript
import { deleteUserCompletely, updateUserFields, adminResetUserPassword, revokeUserAccess, restoreUserAccess } from "@/lib/actions"
```

3. Find the test "should toggle user approval when approve/revoke button is clicked" (line ~244). Replace the assertion from `mockUpdate`/`mockEq` to the server action:

```typescript
it("should toggle user approval when approve/revoke button is clicked", async () => {
  render(<UserManagement />)

  await waitFor(() => {
    expect(screen.getByText("Jane Smith")).toBeInTheDocument()
  })

  const approveButtons = screen.getAllByLabelText("Approve user")
  await user.click(approveButtons[0])

  await waitFor(() => {
    expect(restoreUserAccess).toHaveBeenCalledWith("user-2")
  })
})
```

4. Find the error handling test around line 1073 that clicks "Approve user" and mocks `mockEq` to fail. Update it to mock `restoreUserAccess` to reject instead:

```typescript
vi.mocked(restoreUserAccess).mockRejectedValueOnce(new Error("Approval failed"))
```

Remove the `mockEq.mockResolvedValue(...)` line that set up the old Supabase error path.

- [ ] **Step 3.5: Run updated component tests**

```bash
npm test -- tests/components/user-management.test.tsx --reporter=verbose 2>&1 | tee /tmp/test-out.txt
grep -E "PASS|FAIL|✓|✗" /tmp/test-out.txt
```

Expected: all tests pass.

- [ ] **Step 3.6: Commit**

```bash
git add components/user-management.tsx tests/components/user-management.test.tsx
git commit -m "feat: update user-management toggleUserApproval to use server actions"
```

---

## Task 4: Add approve/revoke toggle to `student-management.tsx`

**Files:**
- Modify: `components/student-management.tsx`

- [ ] **Step 4.1: Update import**

Find the existing import (line ~31):
```typescript
import { deleteUserCompletely } from "@/lib/actions"
```

Replace with:
```typescript
import { deleteUserCompletely, revokeUserAccess, restoreUserAccess } from "@/lib/actions"
```

- [ ] **Step 4.2: Add lucide icons**

Find the lucide-react import line (it includes `Trash2` at minimum). Add `UserX` and `UserCheck` to it:

```typescript
import { ..., Trash2, UserX, UserCheck } from "lucide-react"
```

- [ ] **Step 4.3: Add `toggleStudentApproval` function**

Add this function immediately after the `deleteUser` function (line ~371):

```typescript
const toggleStudentApproval = async (userId: string, currentStatus: boolean) => {
  setProcessingUsers((prev) => new Set(prev).add(userId))

  try {
    const result = currentStatus
      ? await revokeUserAccess(userId)
      : await restoreUserAccess(userId)

    if (!result.success) throw new Error(result.error || "Failed to update approval")

    setUsers((prev) =>
      prev.map((user) =>
        user.id === userId
          ? {
              ...user,
              is_approved: !currentStatus,
              approved_at: !currentStatus ? new Date().toISOString() : user.approved_at,
            }
          : user,
      ),
    )
    toast.success(currentStatus ? "User access revoked" : "User access restored")
  } catch (error) {
    console.error("Error updating student approval:", error)
    toast.error("Failed to update user access. Please try again.")
  } finally {
    setProcessingUsers((prev) => {
      const newSet = new Set(prev)
      newSet.delete(userId)
      return newSet
    })
  }
}
```

- [ ] **Step 4.4: Add approve/revoke button to student row**

Find the Head Teacher action buttons section (around line ~924–947). It currently has edit and delete buttons, both gated on `userRole === "Head Teacher"`. Add an approve/revoke button between them:

```tsx
{userRole === "Head Teacher" && (
  <Button
    size="sm"
    variant="outline"
    onClick={() => toggleStudentApproval(student.id, student.is_approved)}
    disabled={isProcessing}
    className={
      student.is_approved
        ? "border-red-600 text-red-400 hover:bg-red-600 hover:text-white p-1 h-6 w-6"
        : "border-green-600 text-green-400 hover:bg-green-600 hover:text-white p-1 h-6 w-6"
    }
    aria-label={student.is_approved ? "Revoke access" : "Restore access"}
  >
    {student.is_approved ? <UserX className="w-3 h-3" /> : <UserCheck className="w-3 h-3" />}
  </Button>
)}
```

- [ ] **Step 4.5: Type-check and lint**

```bash
npm run type-check 2>&1 | tee /tmp/tc-out.txt && npm run lint 2>&1 | tee -a /tmp/tc-out.txt
grep -E "error|warn" /tmp/tc-out.txt | grep -v "node_modules"
```

Expected: no errors.

- [ ] **Step 4.6: Commit**

```bash
git add components/student-management.tsx
git commit -m "feat: add approve/revoke toggle to student-management for head teachers"
```

---

## Task 5: Refactor pending-approval page + add "Account on hold" state

**Files:**
- Modify: `app/pending-approval/page.tsx` (becomes server wrapper)
- Create: `app/pending-approval/pending-approval-client.tsx` (extracted client component)
- Create: `tests/components/pending-approval-client.test.tsx`

### Step 5.1: Write failing tests for the new client component

Create `tests/components/pending-approval-client.test.tsx`:

```typescript
import { render, screen, waitFor } from "@testing-library/react"
import { describe, it, expect, vi, beforeEach } from "vitest"
import { Suspense } from "react"
import PendingApprovalClient from "@/app/pending-approval/pending-approval-client"

// Mock Supabase browser client
vi.mock("@supabase/ssr", () => ({
  createBrowserClient: vi.fn(() => ({
    auth: {
      getSession: vi.fn().mockResolvedValue({
        data: {
          session: {
            user: {
              id: "user-123",
              email: "user@test.com",
              email_confirmed_at: "2024-01-01T00:00:00Z",
            },
          },
        },
      }),
    },
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: { is_approved: false, approved_at: null, full_name: "Test User" },
        error: null,
      }),
    })),
  })),
}))

// next/navigation mock
vi.mock("next/navigation", () => ({
  useSearchParams: vi.fn(() => ({ get: vi.fn(() => null) })),
}))

const renderComponent = (adminEmail = "admin@test.com") =>
  render(
    <Suspense fallback={<div>Loading...</div>}>
      <PendingApprovalClient adminEmail={adminEmail} />
    </Suspense>
  )

describe("PendingApprovalClient", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("shows 'Approval Pending' when email confirmed but never approved (approved_at null)", async () => {
    renderComponent()
    await waitFor(() => {
      expect(screen.getByText("Approval Pending")).toBeInTheDocument()
    })
  })

  it("shows 'Account on Hold' when email confirmed and approved_at is set but is_approved is false", async () => {
    const { createBrowserClient } = await import("@supabase/ssr")
    vi.mocked(createBrowserClient).mockReturnValue({
      auth: {
        getSession: vi.fn().mockResolvedValue({
          data: {
            session: {
              user: {
                id: "user-123",
                email: "user@test.com",
                email_confirmed_at: "2024-01-01T00:00:00Z",
              },
            },
          },
        }),
      },
      from: vi.fn(() => ({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { is_approved: false, approved_at: "2024-06-01T00:00:00Z", full_name: "Test User" },
          error: null,
        }),
      })),
    } as never)

    renderComponent()
    await waitFor(() => {
      expect(screen.getByText("Account on Hold")).toBeInTheDocument()
    })
  })

  it("shows admin email in 'Account on Hold' message", async () => {
    const { createBrowserClient } = await import("@supabase/ssr")
    vi.mocked(createBrowserClient).mockReturnValue({
      auth: {
        getSession: vi.fn().mockResolvedValue({
          data: {
            session: {
              user: {
                id: "user-123",
                email: "user@test.com",
                email_confirmed_at: "2024-01-01T00:00:00Z",
              },
            },
          },
        }),
      },
      from: vi.fn(() => ({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { is_approved: false, approved_at: "2024-06-01T00:00:00Z", full_name: "Test User" },
          error: null,
        }),
      })),
    } as never)

    renderComponent("headteacher@dojo.com")
    await waitFor(() => {
      expect(screen.getByText(/headteacher@dojo.com/)).toBeInTheDocument()
    })
  })

  it("shows 'Account Approved' when is_approved is true", async () => {
    const { createBrowserClient } = await import("@supabase/ssr")
    vi.mocked(createBrowserClient).mockReturnValue({
      auth: {
        getSession: vi.fn().mockResolvedValue({
          data: {
            session: {
              user: {
                id: "user-123",
                email: "user@test.com",
                email_confirmed_at: "2024-01-01T00:00:00Z",
              },
            },
          },
        }),
      },
      from: vi.fn(() => ({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { is_approved: true, approved_at: "2024-06-01T00:00:00Z", full_name: "Test User" },
          error: null,
        }),
      })),
    } as never)

    renderComponent()
    await waitFor(() => {
      expect(screen.getByText("Account Approved!")).toBeInTheDocument()
    })
  })
})
```

- [ ] **Step 5.2: Run tests to verify they fail**

```bash
npm test -- tests/components/pending-approval-client.test.tsx --reporter=verbose 2>&1 | tee /tmp/test-out.txt
grep -E "FAIL|cannot find|does not exist" /tmp/test-out.txt
```

Expected: fail — the file being imported doesn't exist yet.

- [ ] **Step 5.3: Create `pending-approval-client.tsx`**

Create `app/pending-approval/pending-approval-client.tsx`. This is the current `page.tsx` content, extracted into a named client component, with three changes:

1. Add `adminEmail: string` prop to the component signature
2. Add `approved_at: string | null` to `UserStatus` interface
3. Include `approved_at` in the Supabase select query
4. Set `approved_at` in `setUserStatus`
5. Add the "Account on hold" case to `getStatusContent()` and the JSX body

```typescript
"use client"

import { useEffect, useState } from "react"
import { createBrowserClient } from "@supabase/ssr"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Clock, Mail, CheckCircle, AlertCircle, ShieldOff } from "lucide-react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"

interface UserStatus {
  email_confirmed: boolean
  is_approved: boolean
  approved_at: string | null
  email?: string
  full_name?: string
}

interface Props {
  adminEmail: string
}

export default function PendingApprovalClient({ adminEmail }: Props) {
  const [userStatus, setUserStatus] = useState<UserStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const searchParams = useSearchParams()
  const fromSignup = searchParams.get("from") === "signup"

  useEffect(() => {
    const checkUserStatus = async () => {
      try {
        const supabase = createBrowserClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        )

        const {
          data: { session },
        } = await supabase.auth.getSession()

        if (!session?.user) {
          if (fromSignup) {
            setUserStatus(null)
            setLoading(false)
            return
          }
          await supabase.auth.signOut()
          setUserStatus(null)
          setLoading(false)
          return
        }

        const { data: userData, error: userError } = await supabase
          .from("users")
          .select("is_approved, approved_at, full_name")
          .eq("id", session.user.id)
          .single()

        if (userError) {
          console.error("Error fetching user data:", userError)
          setError("Unable to check account status")
          setLoading(false)
          return
        }

        setUserStatus({
          email_confirmed: !!session.user.email_confirmed_at,
          is_approved: userData?.is_approved || false,
          approved_at: userData?.approved_at || null,
          email: session.user.email,
          full_name: userData?.full_name,
        })
      } catch (err) {
        console.error("Status check error:", err)
        setError("Unable to check account status")
      } finally {
        setLoading(false)
      }
    }

    checkUserStatus()
  }, [fromSignup])

  const getStatusContent = () => {
    if (loading) {
      return {
        icon: <Clock className="w-8 h-8 text-white" />,
        iconBg: "bg-gray-600",
        title: "Checking Status...",
        subtitle: "Please wait while we check your account",
      }
    }

    if (fromSignup && !userStatus) {
      return {
        icon: <Mail className="w-8 h-8 text-white" />,
        iconBg: "bg-blue-600",
        title: "Account Created!",
        subtitle: "Please check your email to confirm your address",
      }
    }

    if (error || !userStatus) {
      return {
        icon: <AlertCircle className="w-8 h-8 text-white" />,
        iconBg: "bg-gray-600",
        title: "Account Status",
        subtitle: "Please sign up or sign in to check your status",
      }
    }

    if (!userStatus.email_confirmed) {
      return {
        icon: <Mail className="w-8 h-8 text-white" />,
        iconBg: "bg-orange-600",
        title: "Email Confirmation Required",
        subtitle: "Please check your email and confirm your address",
      }
    }

    if (userStatus.email_confirmed && userStatus.is_approved) {
      return {
        icon: <CheckCircle className="w-8 h-8 text-white" />,
        iconBg: "bg-green-600",
        title: "Account Approved!",
        subtitle: "Your account is ready to use",
      }
    }

    // Email confirmed, not approved — check whether they were previously approved
    if (userStatus.approved_at) {
      return {
        icon: <ShieldOff className="w-8 h-8 text-white" />,
        iconBg: "bg-red-700",
        title: "Account on Hold",
        subtitle: "Your access has been put on hold",
      }
    }

    return {
      icon: <Clock className="w-8 h-8 text-white" />,
      iconBg: "bg-yellow-600",
      title: "Approval Pending",
      subtitle: "Your email is confirmed, waiting for approval",
    }
  }

  const statusContent = getStatusContent()

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-red-900 via-orange-900 to-yellow-900 px-4 py-12 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md bg-black/80 border-yellow-600/50 backdrop-blur-sm">
        <CardHeader className="space-y-4 text-center">
          <div className={`mx-auto w-16 h-16 ${statusContent.iconBg} rounded-full flex items-center justify-center`}>
            {statusContent.icon}
          </div>
          <CardTitle className="text-3xl font-bold text-white">{statusContent.title}</CardTitle>
          <CardDescription className="text-gray-300 text-lg">{statusContent.subtitle}</CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {fromSignup && !userStatus && !loading && (
            <div className="bg-blue-500/10 border border-blue-500/50 text-blue-400 px-4 py-6 rounded-lg">
              <div className="flex items-start space-x-3">
                <Mail className="w-5 h-5 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium mb-2">Check Your Email</p>
                  <p className="text-sm text-blue-300">
                    We&apos;ve sent you a confirmation email. Please click the link in the email to verify your address.
                  </p>
                  <p className="text-sm text-blue-300 mt-2">
                    Look for an email from <strong>OKL Admin</strong> with subject{" "}
                    <strong>&quot;Confirm Your Signup - Okinawa Kobudo Library&quot;</strong>
                  </p>
                  <p className="text-sm text-blue-300 mt-2">
                    After confirming your email, an administrator will review and approve your account.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Email not confirmed */}
          {userStatus && !userStatus.email_confirmed && (
            <div className="bg-orange-500/10 border border-orange-500/50 text-orange-400 px-4 py-6 rounded-lg">
              <div className="flex items-start space-x-3">
                <Mail className="w-5 h-5 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium mb-2">Email Confirmation Required</p>
                  <p className="text-sm text-orange-300">
                    Please check your email and click the confirmation link. You have 24 hours to confirm your email
                    address.
                  </p>
                  <p className="text-sm text-orange-300 mt-2">
                    Look for an email from <strong>OKL Admin</strong> with subject{" "}
                    <strong>&quot;Confirm Your Signup - Okinawa Kobudo Library&quot;</strong>
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Email confirmed, approved */}
          {userStatus && userStatus.email_confirmed && userStatus.is_approved && (
            <>
              <div className="bg-green-500/10 border border-green-500/50 text-green-400 px-4 py-6 rounded-lg">
                <div className="flex items-start space-x-3">
                  <CheckCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium mb-2">You&apos;re all set!</p>
                    <p className="text-sm text-green-300">
                      {userStatus.full_name && `Welcome, ${userStatus.full_name}! `}
                      Your account has been approved and you now have full access to the Okinawa Kobudo Library.
                    </p>
                  </div>
                </div>
              </div>
              <Button asChild className="w-full bg-green-600 hover:bg-green-700 text-white py-6 text-lg font-medium">
                <Link href={`${process.env.NEXT_PUBLIC_FULL_SITE_URL || "/"}`}>Access the Library</Link>
              </Button>
            </>
          )}

          {/* Email confirmed, access revoked (previously approved) */}
          {userStatus && userStatus.email_confirmed && !userStatus.is_approved && userStatus.approved_at && (
            <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-6 rounded-lg">
              <div className="flex items-start space-x-3">
                <ShieldOff className="w-5 h-5 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium mb-2">Access on Hold</p>
                  <p className="text-sm text-red-300">
                    Your access has been put on hold by a Head Teacher or admin. Please reach out to your Head Teacher,
                    or{" "}
                    <a href={`mailto:${adminEmail}`} className="underline hover:text-red-200">
                      {adminEmail}
                    </a>
                    , for more information.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Email confirmed, pending approval (never previously approved) */}
          {userStatus && userStatus.email_confirmed && !userStatus.is_approved && !userStatus.approved_at && (
            <>
              <div className="bg-yellow-500/10 border border-yellow-500/50 text-yellow-400 px-4 py-6 rounded-lg">
                <div className="flex items-start space-x-3">
                  <CheckCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-yellow-300">
                      {userStatus.full_name && `Thank you, ${userStatus.full_name}! `}
                      Your email has been confirmed. Your account is now pending administrator approval.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-cyan-500/10 border border-cyan-500/50 text-cyan-400 px-4 py-6 rounded-lg">
                <div className="flex items-start space-x-3">
                  <Clock className="w-5 h-5 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-cyan-300">
                      An administrator will review and approve your access. You&apos;ll receive an email notification once
                      approved.
                    </p>
                    <p className="text-sm text-cyan-300 mt-2">This usually takes 24-48 hours.</p>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* No user session or error */}
          {(!userStatus || error) && !loading && (
            <div className="bg-gray-500/10 border border-gray-500/50 text-gray-400 px-4 py-6 rounded-lg">
              <div className="flex flex-col space-y-4">
                <div className="flex items-start space-x-3">
                  <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-gray-300">{error || "Please sign in to check your account status."}</p>
                  </div>
                </div>
                <div>
                  <Button
                    asChild
                    variant="outline"
                    className="w-full border-gray-600 text-gray-300 hover:bg-gray-600 bg-transparent"
                  >
                    <Link href={`${process.env.NEXT_PUBLIC_FULL_SITE_URL || ""}/auth/login`}>Sign In</Link>
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Action buttons */}
          {!fromSignup && (
            <div className="flex flex-col space-y-3">
              <Button
                asChild
                variant="outline"
                className="w-full border-gray-600 text-gray-300 hover:bg-gray-600 bg-transparent"
              >
                <Link href={`${process.env.NEXT_PUBLIC_FULL_SITE_URL || ""}/auth/login`}>Sign In</Link>
              </Button>
              {(!userStatus || error) && (
                <Button
                  asChild
                  variant="outline"
                  className="w-full border-gray-600 text-gray-300 hover:bg-gray-600 bg-transparent"
                >
                  <Link href={`${process.env.NEXT_PUBLIC_FULL_SITE_URL || ""}/auth/sign-up`}>Create Account</Link>
                </Button>
              )}
            </div>
          )}

          {/* Contact Information */}
          <div className="text-center text-gray-400 text-sm border-t border-gray-700 pt-4">
            <p>
              Questions? Contact us at{" "}
              <a href={`mailto:${adminEmail}`} className="text-red-400 hover:text-red-300">
                {adminEmail}
              </a>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
```

- [ ] **Step 5.4: Replace `page.tsx` with server wrapper**

Replace the entire content of `app/pending-approval/page.tsx`:

```typescript
import { Suspense } from "react"
import PendingApprovalClient from "./pending-approval-client"

export default function PendingApprovalPage() {
  const adminEmail = process.env.ADMIN_EMAIL || ""
  return (
    <Suspense>
      <PendingApprovalClient adminEmail={adminEmail} />
    </Suspense>
  )
}
```

- [ ] **Step 5.5: Run the new component tests**

```bash
npm test -- tests/components/pending-approval-client.test.tsx --reporter=verbose 2>&1 | tee /tmp/test-out.txt
grep -E "PASS|FAIL|✓|✗" /tmp/test-out.txt
```

Expected: all 4 tests PASS.

- [ ] **Step 5.6: Run the full test suite**

```bash
npm test -- --reporter=verbose 2>&1 | tee /tmp/test-out.txt
grep -E "FAIL|✗" /tmp/test-out.txt
```

Expected: no failures.

- [ ] **Step 5.7: Type-check**

```bash
npm run type-check 2>&1 | tee /tmp/tc-out.txt
grep "error TS" /tmp/tc-out.txt
```

Expected: no errors.

- [ ] **Step 5.8: Commit**

```bash
git add app/pending-approval/page.tsx app/pending-approval/pending-approval-client.tsx tests/components/pending-approval-client.test.tsx
git commit -m "feat: differentiate pending approval vs access revoked on pending-approval page"
```

---

## Final check

- [ ] **Run full suite one last time**

```bash
npm test -- --reporter=verbose 2>&1 | tee /tmp/test-out.txt
grep -E "FAIL|✗|coverage" /tmp/test-out.txt
```

Expected: all tests pass, coverage above 50% threshold.
