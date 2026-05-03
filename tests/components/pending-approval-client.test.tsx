import { render, screen, waitFor } from "@testing-library/react"
import { describe, it, expect, vi, beforeEach } from "vitest"
import { Suspense } from "react"
import PendingApprovalClient from "@/app/pending-approval/pending-approval-client"
import { useSearchParams } from "next/navigation"

vi.mock("@/lib/supabase/client", () => ({
  createClient: vi.fn(() => ({
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
      signOut: vi.fn().mockResolvedValue({}),
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
    vi.mocked(useSearchParams).mockReturnValue({ get: vi.fn(() => null) } as never)
  })

  it("shows 'Approval Pending' when email confirmed but never approved (approved_at null)", async () => {
    renderComponent()
    await waitFor(() => {
      expect(screen.getByText("Approval Pending")).toBeInTheDocument()
    })
  })

  it("shows 'Account on Hold' when email confirmed and approved_at is set but is_approved is false", async () => {
    const { createClient } = await import("@/lib/supabase/client")
    vi.mocked(createClient).mockReturnValue({
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
        signOut: vi.fn().mockResolvedValue({}),
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
    const { createClient } = await import("@/lib/supabase/client")
    vi.mocked(createClient).mockReturnValue({
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
        signOut: vi.fn().mockResolvedValue({}),
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
    const { createClient } = await import("@/lib/supabase/client")
    vi.mocked(createClient).mockReturnValue({
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
        signOut: vi.fn().mockResolvedValue({}),
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

  it("shows 'Account Created!' and Check Your Email box when fromSignup=true and no session", async () => {
    vi.mocked(useSearchParams).mockReturnValue({ get: vi.fn((k: string) => (k === "from" ? "signup" : null)) } as never)
    const { createClient } = await import("@/lib/supabase/client")
    vi.mocked(createClient).mockReturnValue({
      auth: {
        getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
        signOut: vi.fn().mockResolvedValue({}),
      },
      from: vi.fn(),
    } as never)

    renderComponent()
    await waitFor(() => {
      expect(screen.getByText("Account Created!")).toBeInTheDocument()
      expect(screen.getByText("Check Your Email")).toBeInTheDocument()
    })
  })

  it("shows 'Account Status' and calls signOut when not fromSignup and no session", async () => {
    const { createClient } = await import("@/lib/supabase/client")
    const mockSignOut = vi.fn().mockResolvedValue({})
    vi.mocked(createClient).mockReturnValue({
      auth: {
        getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
        signOut: mockSignOut,
      },
      from: vi.fn(),
    } as never)

    renderComponent()
    await waitFor(() => {
      expect(screen.getByText("Account Status")).toBeInTheDocument()
      expect(mockSignOut).toHaveBeenCalled()
    })
  })

  it("shows 'Email Confirmation Required' when email is not confirmed", async () => {
    const { createClient } = await import("@/lib/supabase/client")
    vi.mocked(createClient).mockReturnValue({
      auth: {
        getSession: vi.fn().mockResolvedValue({
          data: {
            session: {
              user: { id: "user-123", email: "user@test.com", email_confirmed_at: null },
            },
          },
        }),
        signOut: vi.fn().mockResolvedValue({}),
      },
      from: vi.fn(() => ({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { is_approved: false, approved_at: null, full_name: "Test User" },
          error: null,
        }),
      })),
    } as never)

    renderComponent()
    await waitFor(() => {
      expect(screen.getAllByText("Email Confirmation Required").length).toBeGreaterThan(0)
    })
  })

  it("shows error message when DB fetch fails", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {})
    const { createClient } = await import("@/lib/supabase/client")
    vi.mocked(createClient).mockReturnValue({
      auth: {
        getSession: vi.fn().mockResolvedValue({
          data: {
            session: {
              user: { id: "user-123", email: "user@test.com", email_confirmed_at: "2024-01-01T00:00:00Z" },
            },
          },
        }),
        signOut: vi.fn().mockResolvedValue({}),
      },
      from: vi.fn(() => ({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: { message: "DB error" } }),
      })),
    } as never)

    renderComponent()
    await waitFor(() => {
      expect(screen.getByText("Unable to check account status")).toBeInTheDocument()
    })
  })

  it("shows 'Account Approved!' when is_approved is true", async () => {
    const { createClient } = await import("@/lib/supabase/client")
    vi.mocked(createClient).mockReturnValue({
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
        signOut: vi.fn().mockResolvedValue({}),
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
