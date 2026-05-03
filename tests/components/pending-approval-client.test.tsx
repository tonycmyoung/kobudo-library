import { render, screen, waitFor } from "@testing-library/react"
import { describe, it, expect, vi, beforeEach } from "vitest"
import { Suspense } from "react"
import PendingApprovalClient from "@/app/pending-approval/pending-approval-client"

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

  it("shows 'see contact below' in on-hold card and admin email in footer", async () => {
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
      expect(screen.getByText(/see contact below/)).toBeInTheDocument()
      expect(screen.getAllByText(/headteacher@dojo\.com/).length).toBeGreaterThan(0)
    })
  })

  it("does not show Sign In button on 'Account on Hold' card", async () => {
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
      expect(screen.queryByRole("link", { name: /sign in/i })).not.toBeInTheDocument()
    })
  })

  it("shows 'Account Approved!' when is_approved is true", async () => {
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
