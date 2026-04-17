import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import NotificationBell from "@/components/notification-bell"
import { createClient } from "@/lib/supabase/client"
import { fetchNotificationsWithSenders } from "@/lib/actions"
import { useRouter } from "next/navigation"
import { traceError } from "@/lib/trace-logger"

vi.mock("@/lib/actions")
vi.mock("next/navigation")
vi.mock("@/lib/utils/date", () => ({
  formatTimeAgo: (_date: string) => "2 hours ago",
}))
vi.mock("@/lib/trace-logger", () => ({
  traceError: vi.fn(),
}))

const mockPush = vi.fn()
const mockFrom = vi.fn()
const mockUpdate = vi.fn()
const mockDelete = vi.fn()
const mockEq = vi.fn()
const mockIn = vi.fn()
const mockSelect = vi.fn()

const mockNotifications = [
  {
    id: "notif-1",
    sender_id: "user-1",
    message: "Test notification 1",
    is_read: false,
    created_at: "2024-01-01T00:00:00Z",
    sender: {
      full_name: "John Doe",
      email: "john@example.com",
      profile_image_url: null,
    },
  },
  {
    id: "notif-2",
    sender_id: "user-2",
    message: "Test notification 2",
    is_read: true,
    created_at: "2024-01-02T00:00:00Z",
    sender: {
      full_name: "Jane Smith",
      email: "jane@example.com",
      profile_image_url: null,
    },
  },
]

describe("NotificationBell", () => {
  const user = userEvent.setup({ delay: null })

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useRouter).mockReturnValue({ push: mockPush } as unknown as ReturnType<typeof useRouter>)
    vi.mocked(fetchNotificationsWithSenders).mockResolvedValue({
      data: mockNotifications,
      error: null,
    })

    mockEq.mockResolvedValue({ data: null, error: null })
    mockIn.mockReturnValue({ select: mockSelect })
    mockSelect.mockResolvedValue({ data: null, error: null })
    mockUpdate.mockReturnValue({ eq: mockEq, in: mockIn })
    mockDelete.mockReturnValue({ eq: mockEq, in: mockIn })

    mockFrom.mockReturnValue({
      update: mockUpdate,
      delete: mockDelete,
    })

    vi.mocked(createClient).mockReturnValue({
      from: mockFrom,
    } as unknown as ReturnType<typeof createClient>)
  })

  it("should render notification bell button", async () => {
    const { unmount } = render(<NotificationBell userId="user-123" />)
    expect(screen.getByRole("button")).toBeInTheDocument()
    unmount()
  })

  it("should display unread count badge", async () => {
    render(<NotificationBell userId="user-123" />)

    await waitFor(() => {
      expect(screen.getByText("1")).toBeInTheDocument()
    })
  })

  it("should not display badge when no unread notifications", async () => {
    vi.mocked(fetchNotificationsWithSenders).mockResolvedValue({
      data: mockNotifications.map((n) => ({ ...n, is_read: true })),
      error: null,
    })

    render(<NotificationBell userId="user-123" />)

    await waitFor(() => {
      expect(fetchNotificationsWithSenders).toHaveBeenCalled()
    })

    expect(screen.queryByText("1")).toBeNull()
  })

  it("should open dropdown when bell is clicked", async () => {
    render(<NotificationBell userId="user-123" />)

    await user.click(screen.getByRole("button"))

    await waitFor(() => {
      expect(screen.getByText("Notifications")).toBeInTheDocument()
    })
  })

  it("should display all notifications in dropdown", async () => {
    render(<NotificationBell userId="user-123" />)

    await user.click(screen.getByRole("button"))

    await waitFor(() => {
      expect(screen.getByText("Test notification 1")).toBeInTheDocument()
      expect(screen.getByText("Test notification 2")).toBeInTheDocument()
    })
  })

  it("should show sender names", async () => {
    render(<NotificationBell userId="user-123" />)

    await user.click(screen.getByRole("button"))

    await waitFor(() => {
      expect(screen.getByText("John Doe")).toBeInTheDocument()
      expect(screen.getByText("Jane Smith")).toBeInTheDocument()
    })
  })

  it("should mark notification as read when check button is clicked", async () => {
    render(<NotificationBell userId="user-123" />)

    await user.click(screen.getByRole("button"))

    await waitFor(() => {
      expect(screen.getByText("Test notification 1")).toBeInTheDocument()
    })

    const checkButtons = screen.getAllByTitle("Mark as read")
    await user.click(checkButtons[0])

    await waitFor(() => {
      expect(mockUpdate).toHaveBeenCalled()
      expect(mockEq).toHaveBeenCalledWith("id", "notif-1")
    })
  })

  it("should delete notification when delete button is clicked", async () => {
    render(<NotificationBell userId="user-123" />)

    await user.click(screen.getByRole("button"))

    await waitFor(() => {
      expect(screen.getByText("Test notification 1")).toBeInTheDocument()
    })

    const deleteButtons = screen.getAllByTitle("Delete notification")
    await user.click(deleteButtons[0])

    await waitFor(() => {
      expect(mockDelete).toHaveBeenCalled()
    })
  })

  it("should mark all notifications as read", async () => {
    render(<NotificationBell userId="user-123" />)

    await user.click(screen.getByRole("button"))

    await waitFor(() => {
      expect(screen.getByText(/1 unread/)).toBeInTheDocument()
    })

    await user.click(screen.getByText(/all read/i))

    await waitFor(() => {
      expect(mockUpdate).toHaveBeenCalled()
      expect(mockIn).toHaveBeenCalledWith("id", ["notif-1"])
    })
  })

  it("should delete all notifications", async () => {
    render(<NotificationBell userId="user-123" />)

    await user.click(screen.getByRole("button"))

    await waitFor(() => {
      expect(screen.getByText("Test notification 1")).toBeInTheDocument()
    })

    await user.click(screen.getByText(/clear all/i))

    await waitFor(() => {
      expect(mockDelete).toHaveBeenCalled()
      expect(mockIn).toHaveBeenCalledWith("id", ["notif-1", "notif-2"])
    })
  })

  it("should clear notifications from UI after delete all, even when response contains data", async () => {
    // Verifies the component handles delete responses that unexpectedly include data
    // (SonarQube: returned value of delete chain must not be silently ignored)
    const mockSelectWithData = vi.fn().mockResolvedValue({
      data: [{ id: "notif-1" }, { id: "notif-2" }],
      error: null,
    })
    mockIn.mockReturnValue({ select: mockSelectWithData })

    render(<NotificationBell userId="user-123" />)

    await user.click(screen.getByRole("button"))

    await waitFor(() => {
      expect(screen.getByText("Test notification 1")).toBeInTheDocument()
    })

    await user.click(screen.getByText(/clear all/i))

    await waitFor(() => {
      expect(mockDelete).toHaveBeenCalled()
      expect(mockSelectWithData).toHaveBeenCalled()
      // Notifications should be cleared from the UI regardless of response data shape
      expect(screen.queryByText("Test notification 1")).toBeNull()
    })
  })

  it("should show empty state when no notifications", async () => {
    vi.mocked(fetchNotificationsWithSenders).mockResolvedValue({
      data: [],
      error: null,
    })

    render(<NotificationBell userId="user-123" />)

    await user.click(screen.getByRole("button"))

    await waitFor(() => {
      expect(screen.getByText("No notifications yet")).toBeInTheDocument()
    })
  })

  it("should navigate to admin notifications on reply for admin users", async () => {
    render(<NotificationBell userId="user-123" isAdmin={true} />)

    await user.click(screen.getByRole("button"))

    await waitFor(() => {
      expect(screen.getByText("Test notification 1")).toBeInTheDocument()
    })

    const replyButtons = screen.getAllByTitle("Reply")
    await user.click(replyButtons[0])

    expect(mockPush).toHaveBeenCalledWith("/admin/notifications?replyTo=user-1")
  })

  it("should navigate to contact page on reply for regular users", async () => {
    render(<NotificationBell userId="user-123" isAdmin={false} />)

    await user.click(screen.getByRole("button"))

    await waitFor(() => {
      expect(screen.getByText("Test notification 1")).toBeInTheDocument()
    })

    const replyButtons = screen.getAllByTitle("Reply")
    await user.click(replyButtons[0])

    expect(mockPush).toHaveBeenCalledWith("/contact")
  })

  it("should display purple badge for admin users", async () => {
    const { unmount } = render(<NotificationBell userId="user-123" isAdmin={true} />)
    const button = screen.getByRole("button")
    expect(button).toHaveClass("hover:ring-purple-500/50")
    unmount()
  })

  it("should display red badge for regular users", async () => {
    const { unmount } = render(<NotificationBell userId="user-123" isAdmin={false} />)
    const button = screen.getByRole("button")
    expect(button).toHaveClass("hover:ring-yellow-400/50")
    unmount()
  })

  it("should not fetch notifications with invalid userId", async () => {
    render(<NotificationBell userId="" />)

    await waitFor(() => {
      expect(traceError).toHaveBeenCalledWith(
        expect.stringContaining("Invalid userId"),
        expect.objectContaining({ category: "notifications" })
      )
    })
  })

  it("should log traceError when markAllAsRead throws", async () => {
    // Covers line 116: catch block in markAllAsRead
    mockIn.mockReturnValue({ select: mockSelect })
    // Make the update chain throw instead of resolving
    mockUpdate.mockImplementation(() => {
      throw new Error("Network error")
    })

    render(<NotificationBell userId="user-123" />)

    await user.click(screen.getByRole("button"))

    await waitFor(() => {
      expect(screen.getByText(/1 unread/)).toBeInTheDocument()
    })

    await user.click(screen.getByText(/all read/i))

    await waitFor(() => {
      expect(traceError).toHaveBeenCalledWith(
        "Error marking all notifications as read",
        expect.objectContaining({ category: "notifications" }),
      )
    })
  })

  it("should log traceError when deleteNotification returns an error", async () => {
    // Covers lines 129-130: error branch in deleteNotification
    mockEq.mockResolvedValue({ data: null, error: { message: "Delete failed" } })
    mockDelete.mockReturnValue({ eq: mockEq, in: mockIn })

    render(<NotificationBell userId="user-123" />)

    await user.click(screen.getByRole("button"))

    await waitFor(() => {
      expect(screen.getByText("Test notification 1")).toBeInTheDocument()
    })

    const deleteButtons = screen.getAllByTitle("Delete notification")
    await user.click(deleteButtons[0])

    await waitFor(() => {
      expect(traceError).toHaveBeenCalledWith(
        "Error deleting notification",
        expect.objectContaining({ category: "notifications" }),
      )
    })
  })

  it("should log traceError when deleteNotification throws", async () => {
    // Covers line 137: catch block in deleteNotification
    mockDelete.mockImplementation(() => {
      throw new Error("Network error")
    })

    render(<NotificationBell userId="user-123" />)

    await user.click(screen.getByRole("button"))

    await waitFor(() => {
      expect(screen.getByText("Test notification 1")).toBeInTheDocument()
    })

    const deleteButtons = screen.getAllByTitle("Delete notification")
    await user.click(deleteButtons[0])

    await waitFor(() => {
      expect(traceError).toHaveBeenCalledWith(
        "Error deleting notification",
        expect.objectContaining({ category: "notifications" }),
      )
    })
  })
})
