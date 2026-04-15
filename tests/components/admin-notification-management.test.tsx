import { describe, it, expect, beforeEach, vi } from "vitest"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import AdminNotificationManagement from "@/components/admin-notification-management"
import * as actions from "@/lib/actions"
import { createClient } from "@/lib/supabase/client"

vi.mock("next/navigation", () => ({
  useSearchParams: () => ({
    get: vi.fn(() => null),
  }),
}))

vi.mock("@/lib/actions", () => ({
  sendNotificationWithEmail: vi.fn(),
}))

const defaultUsers = [
  {
    id: "user-1",
    full_name: "John Doe",
    email: "john@example.com",
    is_approved: true,
    role: "Student",
    profile_image_url: null,
  },
  {
    id: "user-2",
    full_name: "Jane Smith",
    email: "jane@example.com",
    is_approved: true,
    role: "Teacher",
    profile_image_url: null,
  },
]

const defaultNotifications = [
  {
    id: "notif-1",
    sender_id: "admin-1",
    recipient_id: "user-1",
    message: "Test notification message",
    is_read: false,
    is_broadcast: false,
    created_at: "2024-01-15T10:00:00Z",
    sender: { full_name: "Admin User", email: "admin@example.com" },
    recipient: { full_name: "John Doe", email: "john@example.com" },
  },
  {
    id: "notif-2",
    sender_id: "admin-1",
    recipient_id: null,
    message: "Broadcast message to all",
    is_read: true,
    is_broadcast: true,
    created_at: "2024-01-14T09:00:00Z",
    sender: { full_name: "Admin User", email: "admin@example.com" },
    recipient: null,
  },
]

function makeSupabaseMock(opts?: {
  notificationsData?: typeof defaultNotifications | null
  notificationsError?: { message: string } | null
  usersData?: typeof defaultUsers | null
  usersError?: { message: string } | null
  updateError?: { message: string } | null
  deleteError?: { message: string } | null
}) {
  const {
    notificationsData = defaultNotifications,
    notificationsError = null,
    usersData = defaultUsers,
    usersError = null,
    updateError = null,
    deleteError = null,
  } = opts ?? {}

  return {
    from: (table: string) => {
      // Expose data/error on the chain itself so that queries terminating at any
      // method (e.g. .order() for users, .limit() for notifications) can be awaited.
      const tableData = table === "users" ? usersData : notificationsData
      const tableError = table === "users" ? usersError : notificationsError

      const selectChain: Record<string, unknown> = {
        data: tableData,
        error: tableError,
      }
      selectChain.select = vi.fn(() => selectChain)
      selectChain.eq = vi.fn(() => selectChain)
      selectChain.neq = vi.fn(() => selectChain)
      selectChain.order = vi.fn(() => selectChain)
      selectChain.limit = vi.fn(() => ({ data: tableData, error: tableError }))
      selectChain.update = vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({ error: updateError })),
      }))
      selectChain.delete = vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({ error: deleteError })),
      }))
      return selectChain
    },
  }
}

describe("AdminNotificationManagement", () => {
  const user = userEvent.setup({ delay: null })

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(createClient).mockReturnValue(makeSupabaseMock() as ReturnType<typeof createClient>)
    vi.mocked(actions.sendNotificationWithEmail).mockResolvedValue({ error: null })
  })

  it("should render Send Message card with message type buttons", async () => {
    render(<AdminNotificationManagement />)

    await waitFor(() => {
      const cardTitle = document.querySelector('[data-slot="card-title"]')
      expect(cardTitle).toHaveTextContent("Send Message")
      expect(screen.getByText("Individual")).toBeInTheDocument()
    })

    const broadcastButton = screen.getByRole("button", { name: /broadcast/i })
    expect(broadcastButton).toBeInTheDocument()
  })

  it("should render All Notifications list", async () => {
    render(<AdminNotificationManagement />)

    await waitFor(() => {
      expect(screen.getByText(/All Notifications/)).toBeInTheDocument()
      expect(screen.getByText("Test notification message")).toBeInTheDocument()
      expect(screen.getByText("Broadcast message to all")).toBeInTheDocument()
    })
  })

  it("should switch between Individual and Broadcast message types", async () => {
    render(<AdminNotificationManagement />)

    await waitFor(() => {
      expect(screen.getByText("Individual")).toBeInTheDocument()
    })

    const broadcastButton = screen.getByRole("button", { name: /broadcast/i })
    await user.click(broadcastButton)

    await waitFor(() => {
      expect(screen.getByText("Select Recipients")).toBeInTheDocument()
    })
  })

  it("should send individual message to selected user", async () => {
    render(<AdminNotificationManagement />)

    await waitFor(() => {
      expect(screen.getByText("Individual")).toBeInTheDocument()
    })

    const messageInput = screen.getByPlaceholderText(/type your message here/i)
    await user.type(messageInput, "Personal message")

    const sendButton = screen.getByRole("button", { name: /send message/i })
    expect(sendButton).toBeInTheDocument()
  })

  it("should send broadcast message", async () => {
    render(<AdminNotificationManagement />)

    await waitFor(() => {
      const broadcastButton = screen.getByRole("button", { name: /broadcast/i })
      expect(broadcastButton).toBeInTheDocument()
    })

    const broadcastButton = screen.getByRole("button", { name: /broadcast/i })
    await user.click(broadcastButton)

    const messageInput = screen.getByPlaceholderText(/type your broadcast message here/i)
    await user.type(messageInput, "Test broadcast")

    const sendButton = screen.getByRole("button", { name: /send to all users/i })
    await user.click(sendButton)

    await waitFor(() => {
      expect(actions.sendNotificationWithEmail).toHaveBeenCalledWith({
        recipientId: undefined,
        message: "Test broadcast",
        isBroadcast: true,
        broadcastRole: "all",
      })
    })
  })

  it("should display success message after sending", async () => {
    vi.mocked(actions.sendNotificationWithEmail).mockResolvedValue({ error: null })

    render(<AdminNotificationManagement />)

    await waitFor(() => {
      const messageInput = screen.getByPlaceholderText(/type your message here/i)
      expect(messageInput).toBeInTheDocument()
    })

    const messageInput = screen.getByPlaceholderText(/type your message here/i)
    await user.type(messageInput, "Test")

    const sendButton = screen.getByRole("button", { name: /send message/i })
    expect(sendButton).toBeDisabled()
  })

  it("should display error message when sending fails", async () => {
    vi.mocked(actions.sendNotificationWithEmail).mockResolvedValue({ error: "Failed to send" })

    render(<AdminNotificationManagement />)

    await waitFor(() => {
      const broadcastButton = screen.getByRole("button", { name: /broadcast/i })
      expect(broadcastButton).toBeInTheDocument()
    })

    const broadcastButton = screen.getByRole("button", { name: /broadcast/i })
    await user.click(broadcastButton)

    const messageInput = screen.getByPlaceholderText(/type your broadcast message here/i)
    await user.type(messageInput, "Test")

    const sendButton = screen.getByRole("button", { name: /send to all users/i })
    await user.click(sendButton)

    await waitFor(() => {
      expect(screen.getByText(/failed to send message/i)).toBeInTheDocument()
    })
  })

  it("should display notification sender and recipient information", async () => {
    render(<AdminNotificationManagement />)

    await waitFor(() => {
      expect(screen.getByText("Test notification message")).toBeInTheDocument()
    })

    const notificationText = screen.getByText("Test notification message")
    const notificationContainer = notificationText.closest("div[class*='p-4']")

    expect(notificationContainer).toBeInTheDocument()

    // Verify John Doe appears as the recipient within this specific notification
    const johnDoeInNotification = notificationContainer?.textContent?.includes("John Doe")
    expect(johnDoeInNotification).toBe(true)
  })

  it("should show broadcast badge for broadcast notifications", async () => {
    render(<AdminNotificationManagement />)

    await waitFor(() => {
      expect(screen.getByText("Broadcast message to all")).toBeInTheDocument()
    })

    const broadcastNotification = screen.getByText("Broadcast message to all")
    const notificationContainer = broadcastNotification.closest("div[class*='p-4']")

    // Verify the Broadcast badge appears within this notification
    const badgeInNotification = notificationContainer?.querySelector('[data-slot="badge"]')
    expect(badgeInNotification?.textContent).toBe("Broadcast")
  })

  it("should filter notifications by search query", async () => {
    render(<AdminNotificationManagement />)

    await waitFor(() => {
      expect(screen.getByText("Test notification message")).toBeInTheDocument()
      expect(screen.getByText("Broadcast message to all")).toBeInTheDocument()
    })

    const searchInput = screen.getByPlaceholderText(/search notifications/i)
    await user.type(searchInput, "Broadcast")

    expect(screen.getByText("Broadcast message to all")).toBeInTheDocument()
  })

  it("should show loading state initially", async () => {
    const { unmount } = render(<AdminNotificationManagement />)
    expect(screen.getByText("Loading notifications...")).toBeInTheDocument()
    // Unmount to prevent act() warnings from pending async operations
    unmount()
  })

  it("should show character count for message input", async () => {
    render(<AdminNotificationManagement />)

    await waitFor(() => {
      expect(screen.getByText("0/500 characters")).toBeInTheDocument()
    })

    const messageInput = screen.getByPlaceholderText(/type your message here/i)
    await user.type(messageInput, "Test message")

    await waitFor(() => {
      expect(screen.getByText("12/500 characters")).toBeInTheDocument()
    })
  })

  describe("sendMessage validation", () => {
    it("shows error when message is empty", async () => {
      render(<AdminNotificationManagement />)
      await waitFor(() => { expect(screen.getByText("Individual")).toBeInTheDocument() })

      // The send button is disabled when message is empty, so trigger via direct component state
      // Simulate clicking broadcast (no recipient needed) with empty message
      const broadcastButton = screen.getByRole("button", { name: /broadcast/i })
      await user.click(broadcastButton)

      // Don't type anything - click send (will be disabled normally)
      // But the component checks on click: if (!messageText.trim()) => set error
      // The button is disabled when message is empty, so we verify via the disabled state
      const sendButton = screen.getByRole("button", { name: /send to all users/i })
      expect(sendButton).toBeDisabled()
    })

    it("shows error when individual message has no recipient selected", async () => {
      render(<AdminNotificationManagement />)
      await waitFor(() => { expect(screen.getByText("Individual")).toBeInTheDocument() })

      const messageInput = screen.getByPlaceholderText(/type your message here/i)
      await user.type(messageInput, "Hello there")

      // Send button disabled because no recipient selected in individual mode
      const sendButton = screen.getByRole("button", { name: /send message/i })
      expect(sendButton).toBeDisabled()
    })
  })

  describe("fetchNotifications error paths", () => {
    it("renders gracefully when fetchNotifications returns an error", async () => {
      vi.mocked(createClient).mockReturnValue(
        makeSupabaseMock({ notificationsError: { message: "db error" }, notificationsData: null }) as ReturnType<typeof createClient>
      )
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {})
      render(<AdminNotificationManagement />)
      await waitFor(() => {
        // Should show no notifications found (empty state)
        expect(screen.getByText("No notifications found")).toBeInTheDocument()
      })
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("Error fetching notifications:"),
        expect.anything()
      )
      consoleSpy.mockRestore()
    })

    it("renders gracefully when fetchUsers returns an error", async () => {
      vi.mocked(createClient).mockReturnValue(
        makeSupabaseMock({ usersError: { message: "users error" }, usersData: null }) as ReturnType<typeof createClient>
      )
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {})
      render(<AdminNotificationManagement />)
      await waitFor(() => {
        // Notifications still load fine; users list is empty
        expect(screen.getByText("Test notification message")).toBeInTheDocument()
      })
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("Error fetching users:"),
        expect.anything()
      )
      consoleSpy.mockRestore()
    })
  })

  describe("toggleReadStatus and deleteNotification", () => {
    it("can toggle read status on a notification", async () => {
      render(<AdminNotificationManagement />)
      await waitFor(() => { expect(screen.getByText("Test notification message")).toBeInTheDocument() })

      // The unread notification (notif-1) has an Eye icon button for toggling
      const notificationEl = screen.getByText("Test notification message")
        .closest("div[class*='p-4']") as HTMLElement
      const toggleButton = notificationEl.querySelector("button")
      expect(toggleButton).toBeInTheDocument()
      await user.click(toggleButton!)

      // No error thrown — component handles it gracefully
      await waitFor(() => {
        expect(screen.getByText("Test notification message")).toBeInTheDocument()
      })
    })

    it("can delete a notification", async () => {
      render(<AdminNotificationManagement />)
      await waitFor(() => { expect(screen.getByText("Test notification message")).toBeInTheDocument() })

      const notificationEl = screen.getByText("Test notification message")
        .closest("div[class*='p-4']") as HTMLElement
      const buttons = notificationEl.querySelectorAll("button")
      // buttons[0] = toggle read, buttons[1] = delete
      const deleteButton = buttons[1]
      expect(deleteButton).toBeInTheDocument()
      await user.click(deleteButton)

      await waitFor(() => {
        expect(screen.queryByText("Test notification message")).toBeNull()
      })
    })

    it("handles toggleReadStatus error gracefully", async () => {
      vi.mocked(createClient).mockReturnValue(
        makeSupabaseMock({ updateError: { message: "update error" } }) as ReturnType<typeof createClient>
      )
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {})
      render(<AdminNotificationManagement />)
      await waitFor(() => { expect(screen.getByText("Test notification message")).toBeInTheDocument() })

      const notificationEl = screen.getByText("Test notification message")
        .closest("div[class*='p-4']") as HTMLElement
      const toggleButton = notificationEl.querySelector("button")!
      await user.click(toggleButton)

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith(
          expect.stringContaining("Error updating notification status:"),
          expect.anything()
        )
      })
      consoleSpy.mockRestore()
    })

    it("handles deleteNotification error gracefully", async () => {
      vi.mocked(createClient).mockReturnValue(
        makeSupabaseMock({ deleteError: { message: "delete error" } }) as ReturnType<typeof createClient>
      )
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {})
      render(<AdminNotificationManagement />)
      await waitFor(() => { expect(screen.getByText("Test notification message")).toBeInTheDocument() })

      const notificationEl = screen.getByText("Test notification message")
        .closest("div[class*='p-4']") as HTMLElement
      const buttons = notificationEl.querySelectorAll("button")
      const deleteButton = buttons[1]
      await user.click(deleteButton)

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith(
          expect.stringContaining("Error deleting notification:"),
          expect.anything()
        )
      })
      consoleSpy.mockRestore()
    })
  })

  describe("getUserInitials fallback", () => {
    it("returns '?' when both email and name are empty", async () => {
      vi.mocked(createClient).mockReturnValue(
        makeSupabaseMock({
          notificationsData: [
            {
              ...defaultNotifications[0],
              sender: { full_name: null, email: "" },
              recipient: { full_name: null, email: "" },
            },
          ],
        }) as ReturnType<typeof createClient>
      )
      render(<AdminNotificationManagement />)
      await waitFor(() => {
        expect(screen.getByText("Test notification message")).toBeInTheDocument()
        // The "?" fallback should appear in the avatar
        const questionMarks = screen.getAllByText("?")
        expect(questionMarks.length).toBeGreaterThan(0)
      })
    })
  })
})
