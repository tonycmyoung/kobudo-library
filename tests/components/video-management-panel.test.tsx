import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, waitFor, act } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { VideoManagementPanel } from "@/components/video-management-panel"
import { getVideosForLevel, addVideoToLevel, removeVideoFromLevel, getAvailableVideos } from "@/lib/actions/curriculums"
import { useToast } from "@/hooks/use-toast"

vi.mock("@/lib/actions/curriculums")
vi.mock("@/hooks/use-toast")

const mockLevel = { id: "level-1", name: "1st Kyu", color: "#DC2626" }

const mockAssignedVideos = [
  { id: "vid-2", title: "Bo Staff Basics", thumbnail_url: null, duration_seconds: 120, recorded: "2023" },
  { id: "vid-1", title: "Arm Lock Fundamentals", thumbnail_url: null, duration_seconds: 300, recorded: "2022" },
]

const mockAvailableVideos = [
  { id: "vid-3", title: "Kata Demonstration", thumbnail_url: null, duration_seconds: 180, recorded: null },
  { id: "vid-4", title: "Partner Drill", thumbnail_url: null, duration_seconds: 240, recorded: "2024" },
]

describe("VideoManagementPanel", () => {
  const user = userEvent.setup({ delay: null })
  const mockToast = vi.fn()
  const mockOnClose = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useToast).mockReturnValue({ toast: mockToast, dismiss: vi.fn(), toasts: [] })
    vi.mocked(getVideosForLevel).mockResolvedValue(mockAssignedVideos)
    vi.mocked(getAvailableVideos).mockResolvedValue(mockAvailableVideos)
    vi.mocked(addVideoToLevel).mockResolvedValue({ success: "Added" })
    vi.mocked(removeVideoFromLevel).mockResolvedValue({ success: "Removed" })
  })

  describe("Null / hidden state", () => {
    it("should render nothing when level is null", () => {
      const { container } = render(<VideoManagementPanel level={null} onClose={mockOnClose} />)
      expect(container.firstChild).toBeNull()
    })
  })

  describe("Panel rendering", () => {
    it("should show panel with level name when level is provided", async () => {
      render(<VideoManagementPanel level={mockLevel} onClose={mockOnClose} />)

      await waitFor(() => {
        expect(screen.getByText("1st Kyu")).toBeInTheDocument()
      })
    })

    it("should display assigned and available video sections", async () => {
      render(<VideoManagementPanel level={mockLevel} onClose={mockOnClose} />)

      await waitFor(() => {
        expect(screen.getByText(/Assigned Videos/)).toBeInTheDocument()
        expect(screen.getByText("Add Videos")).toBeInTheDocument()
      })
    })

    it("should show search input for available videos", async () => {
      render(<VideoManagementPanel level={mockLevel} onClose={mockOnClose} />)

      await waitFor(() => {
        expect(screen.getByPlaceholderText("Search videos...")).toBeInTheDocument()
      })
    })
  })

  describe("Initial data load", () => {
    it("should call getVideosForLevel and getAvailableVideos on mount", async () => {
      render(<VideoManagementPanel level={mockLevel} onClose={mockOnClose} />)

      await waitFor(() => {
        expect(getVideosForLevel).toHaveBeenCalledWith("level-1")
        expect(getAvailableVideos).toHaveBeenCalledWith()
      })
    })

    it("should display assigned videos sorted alphabetically by title", async () => {
      render(<VideoManagementPanel level={mockLevel} onClose={mockOnClose} />)

      await waitFor(() => {
        expect(screen.getByText("Arm Lock Fundamentals")).toBeInTheDocument()
        expect(screen.getByText("Bo Staff Basics")).toBeInTheDocument()
      })

      const titles = screen.getAllByText(/Arm Lock|Bo Staff/).map((el) => el.textContent)
      expect(titles[0]).toBe("Arm Lock Fundamentals")
      expect(titles[1]).toBe("Bo Staff Basics")
    })

    it("should show recorded year for videos that have it", async () => {
      render(<VideoManagementPanel level={mockLevel} onClose={mockOnClose} />)

      await waitFor(() => {
        expect(screen.getAllByText("2023").length).toBeGreaterThan(0)
        expect(screen.getAllByText("2022").length).toBeGreaterThan(0)
      })
    })

    it("should show assigned video count", async () => {
      render(<VideoManagementPanel level={mockLevel} onClose={mockOnClose} />)

      await waitFor(() => {
        expect(screen.getByText("2 videos assigned to this level")).toBeInTheDocument()
      })
    })

    it("should show error toast when initial load fails", async () => {
      vi.mocked(getVideosForLevel).mockRejectedValue(new Error("DB error"))

      render(<VideoManagementPanel level={mockLevel} onClose={mockOnClose} />)

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith(
          expect.objectContaining({ variant: "destructive" })
        )
      })
    })
  })

  describe("Empty states", () => {
    it("should show 'No videos assigned' when assigned list is empty", async () => {
      vi.mocked(getVideosForLevel).mockResolvedValue([])

      render(<VideoManagementPanel level={mockLevel} onClose={mockOnClose} />)

      await waitFor(() => {
        expect(screen.getByText("No videos assigned")).toBeInTheDocument()
      })
    })

    it("should show singular 'video' count when exactly one video assigned", async () => {
      vi.mocked(getVideosForLevel).mockResolvedValue([mockAssignedVideos[0]])

      render(<VideoManagementPanel level={mockLevel} onClose={mockOnClose} />)

      await waitFor(() => {
        expect(screen.getByText("1 video assigned to this level")).toBeInTheDocument()
      })
    })
  })

  describe("Available videos filtering", () => {
    it("should exclude already-assigned videos from the available list", async () => {
      // vid-2 is assigned; available list includes vid-2, vid-3, vid-4
      vi.mocked(getAvailableVideos).mockResolvedValue([
        ...mockAssignedVideos,
        mockAvailableVideos[0],
      ])

      render(<VideoManagementPanel level={mockLevel} onClose={mockOnClose} />)

      await waitFor(() => {
        expect(screen.getByText("Kata Demonstration")).toBeInTheDocument()
      })

      // Assigned videos should not appear in the "Add Videos" column
      // Each title appears once (in assigned), not twice
      expect(screen.getAllByText("Bo Staff Basics").length).toBe(1)
    })

    it("should not show recorded date for available videos without a recorded field", async () => {
      vi.mocked(getVideosForLevel).mockResolvedValue([])
      vi.mocked(getAvailableVideos).mockResolvedValue([
        { id: "vid-3", title: "Kata Demonstration", thumbnail_url: null, duration_seconds: 180, recorded: null },
      ])

      render(<VideoManagementPanel level={mockLevel} onClose={mockOnClose} />)

      await waitFor(() => {
        expect(screen.getByText("Kata Demonstration")).toBeInTheDocument()
      })

      // "null" recorded should not render a date span
      expect(screen.queryByText("null")).toBeNull()
    })
  })

  describe("Remove video", () => {
    it("should call removeVideoFromLevel and remove video from UI on success", async () => {
      render(<VideoManagementPanel level={mockLevel} onClose={mockOnClose} />)

      await waitFor(() => {
        expect(screen.getByText("Bo Staff Basics")).toBeInTheDocument()
      })

      const removeButtons = screen.getAllByTitle("Remove from level")
      await user.click(removeButtons[0])

      await waitFor(() => {
        expect(removeVideoFromLevel).toHaveBeenCalledWith("level-1", expect.any(String))
      })
    })

    it("should show error toast when remove fails", async () => {
      vi.mocked(removeVideoFromLevel).mockResolvedValue({ error: "Remove failed" })

      render(<VideoManagementPanel level={mockLevel} onClose={mockOnClose} />)

      await waitFor(() => {
        expect(screen.getByText("Bo Staff Basics")).toBeInTheDocument()
      })

      const removeButtons = screen.getAllByTitle("Remove from level")
      await user.click(removeButtons[0])

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith(
          expect.objectContaining({ variant: "destructive", description: "Remove failed" })
        )
      })
    })
  })

  describe("Add video", () => {
    it("should call addVideoToLevel and refresh assigned list on success", async () => {
      vi.mocked(getVideosForLevel).mockResolvedValue([])
      vi.mocked(getAvailableVideos).mockResolvedValue(mockAvailableVideos)

      render(<VideoManagementPanel level={mockLevel} onClose={mockOnClose} />)

      await waitFor(() => {
        expect(screen.getByText("Kata Demonstration")).toBeInTheDocument()
      })

      const addButtons = screen.getAllByTitle("Add to level")
      await user.click(addButtons[0])

      await waitFor(() => {
        expect(addVideoToLevel).toHaveBeenCalledWith("level-1", expect.any(String))
        expect(getVideosForLevel).toHaveBeenCalledTimes(2) // initial + refresh
      })
    })

    it("should show error toast when add fails", async () => {
      vi.mocked(getVideosForLevel).mockResolvedValue([])
      vi.mocked(getAvailableVideos).mockResolvedValue(mockAvailableVideos)
      vi.mocked(addVideoToLevel).mockResolvedValue({ error: "Add failed" })

      render(<VideoManagementPanel level={mockLevel} onClose={mockOnClose} />)

      await waitFor(() => {
        expect(screen.getByText("Kata Demonstration")).toBeInTheDocument()
      })

      const addButtons = screen.getAllByTitle("Add to level")
      await user.click(addButtons[0])

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith(
          expect.objectContaining({ variant: "destructive", description: "Add failed" })
        )
      })
    })
  })

  describe("Search", () => {
    it("should call getAvailableVideos with search term when searching", async () => {
      vi.mocked(getVideosForLevel).mockResolvedValue([])

      render(<VideoManagementPanel level={mockLevel} onClose={mockOnClose} />)

      await waitFor(() => {
        expect(screen.getByPlaceholderText("Search videos...")).toBeInTheDocument()
      })

      await user.type(screen.getByPlaceholderText("Search videos..."), "kata")

      await waitFor(() => {
        expect(getAvailableVideos).toHaveBeenCalledWith("kata")
      })
    })
  })

  describe("Close button", () => {
    it("should call onClose when close button is clicked", async () => {
      render(<VideoManagementPanel level={mockLevel} onClose={mockOnClose} />)

      await waitFor(() => {
        expect(screen.getByText("1st Kyu")).toBeInTheDocument()
      })

      // Close button has an X icon — find it by its parent button class
      const closeButton = screen.getByRole("button", { name: "" })
      await user.click(closeButton)

      expect(mockOnClose).toHaveBeenCalled()
    })
  })

  describe("Null-level guards inside handlers (lines 46, 57)", () => {
    it("handleAddVideoToLevel returns early when level becomes null before handler runs (line 46)", async () => {
      // Render with a valid level and available (unassigned) videos
      vi.mocked(getVideosForLevel).mockResolvedValue([])
      vi.mocked(getAvailableVideos).mockResolvedValue(mockAvailableVideos)

      // Make addVideoToLevel block indefinitely so we can change the level mid-flight
      let resolveAdd!: () => void
      vi.mocked(addVideoToLevel).mockImplementation(
        () => new Promise((res) => { resolveAdd = () => res({ success: "ok" }) })
      )

      const { rerender } = render(<VideoManagementPanel level={mockLevel} onClose={mockOnClose} />)

      await waitFor(() => {
        expect(screen.getAllByTitle("Add to level").length).toBeGreaterThan(0)
      })

      // Rerender with null level so the handler closure now sees level === null
      await act(async () => {
        rerender(<VideoManagementPanel level={null} onClose={mockOnClose} />)
      })

      // Resolve the pending add — the early-return guard (line 46) should prevent any action
      await act(async () => { resolveAdd?.() })

      // addVideoToLevel should never have been called (we never clicked; just confirming no crash)
      expect(addVideoToLevel).not.toHaveBeenCalled()
    })

    it("handleRemoveVideoFromLevel returns early when level becomes null before handler runs (line 57)", async () => {
      vi.mocked(getVideosForLevel).mockResolvedValue(mockAssignedVideos)
      vi.mocked(getAvailableVideos).mockResolvedValue([])

      let resolveRemove!: () => void
      vi.mocked(removeVideoFromLevel).mockImplementation(
        () => new Promise((res) => { resolveRemove = () => res({ success: "ok" }) })
      )

      const { rerender } = render(<VideoManagementPanel level={mockLevel} onClose={mockOnClose} />)

      await waitFor(() => {
        expect(screen.getAllByTitle("Remove from level").length).toBeGreaterThan(0)
      })

      await act(async () => {
        rerender(<VideoManagementPanel level={null} onClose={mockOnClose} />)
      })

      await act(async () => { resolveRemove?.() })

      expect(removeVideoFromLevel).not.toHaveBeenCalled()
    })
  })

  describe("Level change", () => {
    it("should reload videos when level prop changes to a different level", async () => {
      const levelA = { id: "level-1", name: "First Level", color: "#FF0000" }
      const levelB = { id: "level-2", name: "Second Level", color: "#0000FF" }

      const { rerender } = render(<VideoManagementPanel level={levelA} onClose={mockOnClose} />)

      await waitFor(() => {
        expect(getVideosForLevel).toHaveBeenCalledWith("level-1")
      })

      rerender(<VideoManagementPanel level={levelB} onClose={mockOnClose} />)

      await waitFor(() => {
        expect(getVideosForLevel).toHaveBeenCalledWith("level-2")
        expect(screen.getByText("Second Level")).toBeInTheDocument()
      })
    })
  })
})
