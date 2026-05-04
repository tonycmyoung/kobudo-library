import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, waitFor } from "@testing-library/react"
import SignOutPage from "@/app/signout/page"
import * as actions from "@/lib/actions"

const mockPush = vi.fn()

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}))

vi.mock("@/lib/actions", () => ({
  signOutServerAction: vi.fn(),
}))

describe("SignOutPage", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("should render the signing out message", () => {
    vi.mocked(actions.signOutServerAction).mockResolvedValue({ success: true })

    render(<SignOutPage />)

    expect(screen.getByText("Signing out...")).toBeInTheDocument()
  })

  it("should call signOutServerAction and redirect to / on mount", async () => {
    vi.mocked(actions.signOutServerAction).mockResolvedValue({ success: true })

    render(<SignOutPage />)

    await waitFor(() => {
      expect(actions.signOutServerAction).toHaveBeenCalledOnce()
      expect(mockPush).toHaveBeenCalledWith("/")
    })
  })

  it("should not call signOutServerAction a second time if effect re-runs", async () => {
    vi.mocked(actions.signOutServerAction).mockResolvedValue({ success: true })

    const { rerender } = render(<SignOutPage />)

    await waitFor(() => {
      expect(actions.signOutServerAction).toHaveBeenCalledOnce()
    })

    rerender(<SignOutPage />)

    await waitFor(() => {
      expect(actions.signOutServerAction).toHaveBeenCalledOnce()
    })
  })
})
