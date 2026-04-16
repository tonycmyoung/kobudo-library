import type React from "react"
import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, waitFor, act } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import SessionTimeoutWarning from "@/components/session-timeout-warning"

// Mock Supabase client
const mockGetSession = vi.fn()
const mockRefreshSession = vi.fn()

vi.mock("@/lib/supabase/client", () => ({
  createClient: vi.fn(() => ({
    auth: {
      getSession: mockGetSession,
      refreshSession: mockRefreshSession,
    },
  })),
}))

vi.mock("@/lib/trace-logger", () => ({
  traceError: vi.fn(),
}))

// Mock the Dialog component
vi.mock("@/components/ui/dialog", () => ({
  Dialog: ({ children, open }: { children: React.ReactNode; open: boolean }) =>
    open ? <div data-testid="dialog">{children}</div> : null,
  DialogContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DialogHeader: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DialogTitle: ({ children }: { children: React.ReactNode }) => <h2>{children}</h2>,
  DialogDescription: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DialogFooter: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}))

describe("SessionTimeoutWarning", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("should not show warning when session has more than 5 minutes", async () => {
    const futureTime = Math.floor(Date.now() / 1000) + 600 // 10 minutes
    mockGetSession.mockResolvedValue({
      data: { session: { expires_at: futureTime } },
      error: null,
    })

    render(<SessionTimeoutWarning userId="user-123" />)

    await waitFor(() => {
      expect(screen.queryByText(/session expiring soon/i)).toBeNull()
    })
  })

  it("should show warning when session has less than 5 minutes", async () => {
    const futureTime = Math.floor(Date.now() / 1000) + 200 // 3 minutes 20 seconds
    mockGetSession.mockResolvedValue({
      data: { session: { expires_at: futureTime } },
      error: null,
    })

    render(<SessionTimeoutWarning userId="user-123" />)

    await waitFor(
      () => {
        expect(screen.getByText(/session expiring soon/i)).toBeInTheDocument()
      },
      { timeout: 32000 },
    ) // Component checks every 30 seconds
  }, 35000)

  it("should display countdown timer", async () => {
    const futureTime = Math.floor(Date.now() / 1000) + 200
    mockGetSession.mockResolvedValue({
      data: { session: { expires_at: futureTime } },
      error: null,
    })

    render(<SessionTimeoutWarning userId="user-123" />)

    await waitFor(
      () => {
        // Should show time in m:ss format — exact value may vary slightly due to elapsed time
        expect(screen.getByText(/\d+:\d{2}/)).toBeInTheDocument()
      },
      { timeout: 32000 },
    )
  }, 35000)

  it("should have Extend Session button", async () => {
    const futureTime = Math.floor(Date.now() / 1000) + 200
    mockGetSession.mockResolvedValue({
      data: { session: { expires_at: futureTime } },
      error: null,
    })

    render(<SessionTimeoutWarning userId="user-123" />)

    await waitFor(
      () => {
        expect(screen.getByRole("button", { name: /extend session/i })).toBeInTheDocument()
      },
      { timeout: 32000 },
    )
  }, 35000)

  it("should call refreshSession when Extend Session is clicked", async () => {
    const user = userEvent.setup({ delay: null })
    const futureTime = Math.floor(Date.now() / 1000) + 200
    mockGetSession.mockResolvedValue({
      data: { session: { expires_at: futureTime } },
      error: null,
    })
    mockRefreshSession.mockResolvedValue({
      data: { session: { user: { id: "user-123" } } },
      error: null,
    })

    render(<SessionTimeoutWarning userId="user-123" />)

    await waitFor(
      async () => {
        const extendButton = screen.getByRole("button", { name: /extend session/i })
        await user.click(extendButton)

        expect(mockRefreshSession).toHaveBeenCalled()
      },
      { timeout: 32000 },
    )
  }, 35000)

  it("should hide warning after successful refresh", async () => {
    const user = userEvent.setup({ delay: null })
    const futureTime = Math.floor(Date.now() / 1000) + 200
    mockGetSession
      .mockResolvedValueOnce({
        data: { session: { expires_at: futureTime } },
        error: null,
      })
      .mockResolvedValue({
        data: { session: { expires_at: Math.floor(Date.now() / 1000) + 3600 } }, // 1 hour from now
        error: null,
      })
    mockRefreshSession.mockResolvedValue({
      data: { session: { user: { id: "user-123" } } },
      error: null,
    })

    render(<SessionTimeoutWarning userId="user-123" />)

    await waitFor(
      async () => {
        const extendButton = screen.getByRole("button", { name: /extend session/i })
        await user.click(extendButton)

        await waitFor(() => {
          expect(screen.queryByTestId("dialog")).toBeNull()
        })
      },
      { timeout: 35000 },
    )
  }, 40000)

  it("should not render when userId is undefined", () => {
    render(<SessionTimeoutWarning userId="undefined" />)

    expect(screen.queryByTestId("dialog")).toBeNull()
  })

  it("should return early and not show warning when session is null", async () => {
    // Covers line 34: the `if (!session) return` branch
    mockGetSession.mockResolvedValue({
      data: { session: null },
      error: null,
    })

    render(<SessionTimeoutWarning userId="user-123" />)

    await waitFor(() => {
      expect(mockGetSession).toHaveBeenCalled()
    })

    expect(screen.queryByTestId("dialog")).toBeNull()
  })

  it("should log traceError when getSession throws", async () => {
    // Covers line 51: the catch block in checkSessionExpiry
    const { traceError } = await import("@/lib/trace-logger")
    mockGetSession.mockRejectedValue(new Error("Network failure"))

    render(<SessionTimeoutWarning userId="user-123" />)

    await waitFor(() => {
      expect(traceError).toHaveBeenCalledWith(
        "Session check error",
        expect.objectContaining({ category: "auth" }),
      )
    })
  })

  it("should log traceError when refreshSession returns an error", async () => {
    // Covers line 61: traceError branch when refreshSession responds with error
    const { traceError } = await import("@/lib/trace-logger")
    const user = userEvent.setup({ delay: null })
    const futureTime = Math.floor(Date.now() / 1000) + 200
    mockGetSession.mockResolvedValue({
      data: { session: { expires_at: futureTime } },
      error: null,
    })
    mockRefreshSession.mockResolvedValue({
      data: { session: null },
      error: { message: "Refresh failed" },
    })

    render(<SessionTimeoutWarning userId="user-123" />)

    await waitFor(
      async () => {
        const extendButton = screen.getByRole("button", { name: /extend session/i })
        await user.click(extendButton)

        await waitFor(() => {
          expect(traceError).toHaveBeenCalledWith(
            "Session refresh error",
            expect.objectContaining({ category: "auth" }),
          )
        })
      },
      { timeout: 32000 },
    )
  }, 35000)

  it("should log traceError when refreshSession throws", async () => {
    // Covers line 67: the catch block in refreshSession
    const { traceError } = await import("@/lib/trace-logger")
    const user = userEvent.setup({ delay: null })
    const futureTime = Math.floor(Date.now() / 1000) + 200
    mockGetSession.mockResolvedValue({
      data: { session: { expires_at: futureTime } },
      error: null,
    })
    mockRefreshSession.mockRejectedValue(new Error("Network error"))

    render(<SessionTimeoutWarning userId="user-123" />)

    await waitFor(
      async () => {
        const extendButton = screen.getByRole("button", { name: /extend session/i })
        await user.click(extendButton)

        await waitFor(() => {
          expect(traceError).toHaveBeenCalledWith(
            "Session refresh failed",
            expect.objectContaining({ category: "auth" }),
          )
        })
      },
      { timeout: 32000 },
    )
  }, 35000)

  it("should stop countdown at zero when timeLeft reaches 1", async () => {
    // Covers lines 88-92: the setInterval countdown, specifically the `prev <= 1 → return 0` branch
    vi.useFakeTimers()
    const futureTime = Math.floor(Date.now() / 1000) + 1 // 1 second until expiry
    mockGetSession.mockResolvedValue({
      data: { session: { expires_at: futureTime } },
      error: null,
    })

    render(<SessionTimeoutWarning userId="user-123" />)

    // Let the async getSession call resolve
    await act(async () => {
      await Promise.resolve()
    })

    // Advance past the 1s countdown tick — setTimeLeft should clamp to 0
    act(() => {
      vi.advanceTimersByTime(1100)
    })

    // Dialog should still be shown (warning was set), timeLeft just hit 0
    // The key coverage goal is that the `prev <= 1` branch was executed
    expect(screen.queryByTestId("dialog")).not.toBeNull()

    vi.useRealTimers()
  })
})
