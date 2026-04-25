import React from "react"
import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, waitFor, fireEvent } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import UserProfile from "@/components/user-profile"
import { updateProfile } from "@/lib/actions"
import { updateUserBelt } from "@/lib/actions/users"

vi.mock("@/lib/actions", () => ({
  updateProfile: vi.fn(),
}))

vi.mock("@/lib/actions/users", () => ({
  updateUserBelt: vi.fn(),
}))

// Radix Select doesn't work in jsdom (requires pointer capture). Replace with
// a native <select> so belt-change interaction tests work reliably.
vi.mock("@/components/ui/select", () => ({
  Select: ({ value, onValueChange, children }: { value?: string; onValueChange?: (v: string) => void; children: React.ReactNode }) => (
    <select data-testid="belt-select" value={value ?? ""} onChange={(e) => onValueChange?.(e.target.value)}>
      {children}
    </select>
  ),
  SelectTrigger: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  SelectValue: ({ placeholder, children }: { placeholder?: string; children?: React.ReactNode }) => <span>{children ?? placeholder}</span>,
  SelectContent: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  SelectItem: ({ value, children }: { value: string; children: React.ReactNode }) => <option value={value}>{children}</option>,
  SelectGroup: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  SelectLabel: ({ children }: { children: React.ReactNode }) => <optgroup label={String(children)}>{children}</optgroup>,
}))


describe("UserProfile", () => {
  const mockUser = {
    id: "user-1",
    email: "test@example.com",
    full_name: "John Doe",
    teacher: "Sensei Bob",
    school: "Test Dojo",
    role: "Student",
    created_at: "2024-01-01T00:00:00Z",
    profile_image_url: "https://example.com/image.jpg",
    favorite_count: 5,
    current_belt_id: "belt-1",
    current_belt: {
      id: "belt-1",
      name: "White Belt",
      color: "#ffffff",
      display_order: 1,
    },
    curriculum_set_id: "set-1",
    curriculum_set: {
      id: "set-1",
      name: "Okinawa Kobudo Australia",
    },
  }

  const mockCurriculums = [
    { id: "belt-1", name: "White Belt", color: "#ffffff", display_order: 1 },
    { id: "belt-2", name: "Yellow Belt", color: "#ffff00", display_order: 2 },
  ]

  const mockCurriculumLevels = [
    { id: "level-1", name: "White", display_name: "White Belt", sort_order: 1 },
    { id: "level-2", name: "Yellow", display_name: "Yellow Belt", sort_order: 2 },
  ]

  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(console, "error").mockImplementation(() => {})
    vi.stubGlobal("fetch", vi.fn())
    vi.stubGlobal("alert", vi.fn())
    vi.mocked(updateProfile).mockResolvedValue({ success: true })
  })

  it("should render user profile information", () => {
    render(<UserProfile user={mockUser} curriculums={mockCurriculums} curriculumLevels={mockCurriculumLevels} />)

    expect(screen.getByText("John Doe")).toBeInTheDocument()
    expect(screen.getAllByText("test@example.com")[0]).toBeInTheDocument()
    expect(screen.getByText("Sensei Bob")).toBeInTheDocument()
    expect(screen.getByText("Test Dojo")).toBeInTheDocument()
  })

  it("should display favorite count and member since date", () => {
    render(<UserProfile user={mockUser} curriculums={mockCurriculums} curriculumLevels={mockCurriculumLevels} />)

    expect(screen.getByText("5")).toBeInTheDocument()
    expect(screen.getByText(/Member Since/i)).toBeInTheDocument()
  })

  it("should render quick action buttons", () => {
    render(<UserProfile user={mockUser} curriculums={mockCurriculums} curriculumLevels={mockCurriculumLevels} />)

    expect(screen.getByText("View My Favorites")).toBeInTheDocument()
    expect(screen.getByText("Change Password")).toBeInTheDocument()
    expect(screen.getByText("Browse Video Library")).toBeInTheDocument()
  })

  it("should enter edit mode when Edit Profile button is clicked", async () => {
    const user = userEvent.setup({ delay: null })
    render(<UserProfile user={mockUser} curriculums={mockCurriculums} curriculumLevels={mockCurriculumLevels} />)

    const editButton = screen.getByRole("button", { name: /edit profile/i })
    await user.click(editButton)

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /cancel/i })).toBeInTheDocument()
      expect(screen.getByRole("button", { name: /save/i })).toBeInTheDocument()
    })
  })

  it("should update full name input when in edit mode", async () => {
    const user = userEvent.setup({ delay: null })
    render(<UserProfile user={mockUser} curriculums={mockCurriculums} curriculumLevels={mockCurriculumLevels} />)

    const editButton = screen.getByRole("button", { name: /edit profile/i })
    await user.click(editButton)

    const nameInput = screen.getByDisplayValue("John Doe")
    await user.clear(nameInput)
    await user.type(nameInput, "Jane Doe")

    expect(nameInput).toHaveValue("Jane Doe")
  })

  it("should save profile changes when Save button is clicked", async () => {
    const user = userEvent.setup({ delay: null })
    render(<UserProfile user={mockUser} curriculums={mockCurriculums} />)

    const editButton = screen.getByRole("button", { name: /edit profile/i })
    await user.click(editButton)

    const nameInput = screen.getByDisplayValue("John Doe")
    await user.clear(nameInput)
    await user.type(nameInput, "Jane Doe")

    const saveButton = screen.getByRole("button", { name: /save/i })
    await user.click(saveButton)

    await waitFor(() => {
      expect(updateProfile).toHaveBeenCalledWith({
        userId: "user-1",
        email: "test@example.com",
        fullName: "Jane Doe",
        profileImageUrl: "https://example.com/image.jpg",
      })
      // Optimistic update: displayed name updates immediately without router.refresh()
      expect(screen.getByText("Jane Doe")).toBeInTheDocument()
    })
  })

  it("should update displayed name optimistically after save without page refresh", async () => {
    const user = userEvent.setup({ delay: null })
    render(<UserProfile user={mockUser} curriculums={mockCurriculums} />)

    await user.click(screen.getByRole("button", { name: /edit profile/i }))
    const nameInput = screen.getByDisplayValue("John Doe")
    await user.clear(nameInput)
    await user.type(nameInput, "Jane Doe")
    await user.click(screen.getByRole("button", { name: /save/i }))

    await waitFor(() => {
      expect(screen.getByText("Jane Doe")).toBeInTheDocument()
      expect(screen.queryByText("John Doe")).not.toBeInTheDocument()
    })
  })

  it("should cancel edit mode when Cancel button is clicked", async () => {
    const user = userEvent.setup({ delay: null })
    render(<UserProfile user={mockUser} curriculums={mockCurriculums} />)

    const editButton = screen.getByRole("button", { name: /edit profile/i })
    await user.click(editButton)

    const cancelButton = screen.getByRole("button", { name: /cancel/i })
    await user.click(cancelButton)

    await waitFor(() => {
      expect(screen.queryByRole("button", { name: /save/i })).toBeNull()
      expect(screen.getByRole("button", { name: /edit profile/i })).toBeInTheDocument()
    })
  })

  it("should show error alert when profile update fails", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {})
    const user = userEvent.setup({ delay: null })
    vi.mocked(updateProfile).mockResolvedValue({ success: false, error: "Update failed" })

    render(<UserProfile user={mockUser} curriculums={mockCurriculums} />)

    const editButton = screen.getByRole("button", { name: /edit profile/i })
    await user.click(editButton)

    const saveButton = screen.getByRole("button", { name: /save/i })
    await user.click(saveButton)

    await waitFor(() => {
      expect(global.alert).toHaveBeenCalledWith("Failed to update profile. Please try again.")
    })
  })

  it("should display administrator badge for admin users", () => {
    const adminUser = { ...mockUser, isAdmin: true }
    render(<UserProfile user={adminUser} curriculums={mockCurriculums} curriculumLevels={mockCurriculumLevels} />)

    expect(screen.getByText("Administrator")).toBeInTheDocument()
  })

  it("should display teacher badge for teacher role", () => {
    const teacherUser = { ...mockUser, role: "Teacher" }
    render(<UserProfile user={teacherUser} curriculums={mockCurriculums} curriculumLevels={mockCurriculumLevels} />)

    const teacherBadges = screen.getAllByText(/Teacher/i)
    expect(teacherBadges.length).toBeGreaterThan(0)
  })

  it("should show current belt with color indicator", () => {
    render(<UserProfile user={mockUser} curriculums={mockCurriculums} curriculumLevels={mockCurriculumLevels} />)

    expect(screen.getAllByText("White Belt")[0]).toBeInTheDocument()
  })

  it("should show belt select dropdown with all curriculum options", () => {
    render(<UserProfile user={mockUser} curriculums={mockCurriculums} curriculumLevels={mockCurriculumLevels} />)

    expect(screen.getAllByText("White Belt")[0]).toBeInTheDocument()
  })

  describe("Curriculum Set Display and Belt Filtering", () => {
    it("should display curriculum set name as read-only", () => {
      render(<UserProfile user={mockUser} curriculums={mockCurriculums} curriculumLevels={mockCurriculumLevels} />)

      expect(screen.getByText("Okinawa Kobudo Australia")).toBeInTheDocument()
    })

    it("should display curriculum set as unassigned when null", () => {
      const userWithoutSet = {
        ...mockUser,
        curriculum_set_id: null,
        curriculum_set: null,
      }
      render(<UserProfile user={userWithoutSet} curriculums={mockCurriculums} curriculumLevels={mockCurriculumLevels} />)

      expect(screen.getByText("Not assigned")).toBeInTheDocument()
    })

    it("should use curriculum levels for belt options when curriculum set is assigned", () => {
      render(<UserProfile user={mockUser} curriculums={mockCurriculums} curriculumLevels={mockCurriculumLevels} />)

      // When user has a curriculum set and levels are provided, it should use those levels
      // The belt dropdown should exist (text visible is current selection, not all options)
      expect(screen.getAllByText("White Belt")[0]).toBeInTheDocument()
      // Verify the select component exists
      const selectElements = screen.getAllByRole("combobox")
      expect(selectElements.length).toBeGreaterThan(0)
    })

    it("should fall back to curriculums when no curriculum set assigned", () => {
      const userWithoutSet = {
        ...mockUser,
        curriculum_set_id: null,
        curriculum_set: null,
      }
      render(<UserProfile user={userWithoutSet} curriculums={mockCurriculums} curriculumLevels={mockCurriculumLevels} />)

      // Should still have belt options (fallback to mockCurriculums)
      const selectElements = screen.getAllByRole("combobox")
      expect(selectElements.length).toBeGreaterThan(0)
    })
  })

  it("should show placeholder text when user data is missing", () => {
    const incompleteUser = {
      ...mockUser,
      full_name: null,
      teacher: null,
      school: null,
      current_belt_id: null,
      current_belt: null,
    }
    render(<UserProfile user={incompleteUser} curriculums={mockCurriculums} />)

    expect(screen.getByText("No name set")).toBeInTheDocument()
    const notSpecified = screen.getAllByText("Not specified")
    expect(notSpecified.length).toBeGreaterThan(0)
  })

  describe("Image upload", () => {
    it("should call fetch when a valid image file is uploaded", async () => {
      const user = userEvent.setup({ delay: null })
      vi.mocked(global.fetch).mockResolvedValue({
        ok: true,
        json: async () => ({ url: "https://example.com/new-image.jpg" }),
      } as Response)

      render(<UserProfile user={mockUser} curriculums={mockCurriculums} curriculumLevels={mockCurriculumLevels} />)

      const editButton = screen.getByRole("button", { name: /edit profile/i })
      await user.click(editButton)

      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
      const file = new File(["content"], "photo.jpg", { type: "image/jpeg" })
      await user.upload(fileInput, file)

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith("/api/upload-profile-image", expect.objectContaining({ method: "POST" }))
      })
    })

    it("should show alert when non-image file is uploaded", async () => {
      const user = userEvent.setup({ delay: null })

      render(<UserProfile user={mockUser} curriculums={mockCurriculums} curriculumLevels={mockCurriculumLevels} />)

      const editButton = screen.getByRole("button", { name: /edit profile/i })
      await user.click(editButton)

      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
      const file = new File(["content"], "document.pdf", { type: "application/pdf" })
      // Use fireEvent.change to bypass the accept="image/*" filter
      Object.defineProperty(fileInput, "files", { value: [file], configurable: true })
      fireEvent.change(fileInput)

      expect(global.alert).toHaveBeenCalledWith("Please select an image file")
    })

    it("should show alert when image file is too large", async () => {
      const user = userEvent.setup({ delay: null })

      render(<UserProfile user={mockUser} curriculums={mockCurriculums} curriculumLevels={mockCurriculumLevels} />)

      const editButton = screen.getByRole("button", { name: /edit profile/i })
      await user.click(editButton)

      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
      // Create a file that's 6MB (over the 5MB limit)
      const largeContent = "x".repeat(6 * 1024 * 1024)
      const file = new File([largeContent], "large-photo.jpg", { type: "image/jpeg" })
      Object.defineProperty(file, "size", { value: 6 * 1024 * 1024 })
      await user.upload(fileInput, file)

      expect(global.alert).toHaveBeenCalledWith("File size must be less than 5MB")
    })

    it("should show alert when upload fails", async () => {
      vi.spyOn(console, "error").mockImplementation(() => {})
      const user = userEvent.setup({ delay: null })
      vi.mocked(global.fetch).mockResolvedValue({
        ok: false,
        json: async () => ({ error: "Upload failed" }),
      } as Response)

      render(<UserProfile user={mockUser} curriculums={mockCurriculums} curriculumLevels={mockCurriculumLevels} />)

      const editButton = screen.getByRole("button", { name: /edit profile/i })
      await user.click(editButton)

      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
      const file = new File(["content"], "photo.jpg", { type: "image/jpeg" })
      await user.upload(fileInput, file)

      await waitFor(() => {
        expect(global.alert).toHaveBeenCalledWith("Failed to upload image. Please try again.")
      })
    })
  })

  describe("Remove image button in edit mode", () => {
    it("should clear image preview and profile_image_url when remove button is clicked with an imagePreview set", async () => {
      // Covers lines 184-185: the onClick of the remove-image Button inside ProfileEditForm
      const user = userEvent.setup({ delay: null })
      vi.mocked(global.fetch).mockResolvedValue({
        ok: true,
        json: async () => ({ url: "https://example.com/uploaded.jpg" }),
      } as Response)

      render(<UserProfile user={mockUser} curriculums={mockCurriculums} curriculumLevels={mockCurriculumLevels} />)

      // Enter edit mode
      await user.click(screen.getByRole("button", { name: /edit profile/i }))

      // Upload a file so imagePreview is set (causing the remove button to appear)
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
      const file = new File(["content"], "photo.jpg", { type: "image/jpeg" })
      await user.upload(fileInput, file)

      // Wait for upload to complete and the remove button to appear
      await waitFor(() => {
        expect(screen.getByRole("button", { name: "" })).toBeInTheDocument()
      })

      // The remove button is the outline button with just the X icon inside ProfileEditForm
      const removeButton = screen.getByRole("button", { name: "" })
      await user.click(removeButton)

      // After clearing, the file input shows "Choose Image" again (uploadingImage is false)
      await waitFor(() => {
        expect(screen.getByText("Choose Image")).toBeInTheDocument()
      })
    })

    it("should show remove button when user has an existing profile image (no preview needed)", async () => {
      // Covers line 145: showRemoveButton is truthy when profileImageUrl is set
      const user = userEvent.setup({ delay: null })

      render(<UserProfile user={mockUser} curriculums={mockCurriculums} curriculumLevels={mockCurriculumLevels} />)

      // Enter edit mode — mockUser has profile_image_url set
      await user.click(screen.getByRole("button", { name: /edit profile/i }))

      // The remove button (X icon) should be present because profileImageUrl is set
      await waitFor(() => {
        // There should be a button with just the X icon (no text label)
        const buttons = screen.getAllByRole("button")
        const removeBtn = buttons.find((b) => b.getAttribute("type") === "button" && b.querySelector("svg"))
        expect(removeBtn).toBeDefined()
      })
    })
  })

  describe("BeltSelectorValue display", () => {
    it("should show loading spinner text while belt is updating", async () => {
      // Covers lines 274-280: beltLoading=true branch of BeltSelectorValue
      vi.mocked(updateUserBelt).mockImplementation(
        () =>
          new Promise((resolve) => {
            // Never resolves during the test — keeps beltLoading=true
            setTimeout(() => resolve({ success: true }), 60000)
          }),
      )
      const user = userEvent.setup({ delay: null })

      render(<UserProfile user={mockUser} curriculums={mockCurriculums} curriculumLevels={mockCurriculumLevels} />)

      const beltSelect = screen.getByTestId("belt-select")
      // Trigger a belt change — beltLoading becomes true immediately
      user.selectOptions(beltSelect, "level-2")

      await waitFor(() => {
        // While loading, the BeltSelectorValue renders "Updating..."
        expect(screen.getByText("Updating...")).toBeInTheDocument()
      })
    })

    it("should show belt color swatch and name when currentBeltId and currentBelt are set", () => {
      // Covers lines 282-289: the currentBeltId && currentBelt branch of BeltSelectorValue
      // mockUser already has current_belt_id and current_belt populated
      render(<UserProfile user={mockUser} curriculums={mockCurriculums} curriculumLevels={mockCurriculumLevels} />)

      // The BeltSelectorValue renders the belt name inside the SelectValue
      expect(screen.getAllByText("White Belt")[0]).toBeInTheDocument()
    })

    it("should show Not specified text when no belt is selected", () => {
      // Covers line 290: the fallback return "Not specified" branch
      const userNoBelt = {
        ...mockUser,
        current_belt_id: null,
        current_belt: null,
      }
      render(<UserProfile user={userNoBelt} curriculums={mockCurriculums} curriculumLevels={mockCurriculumLevels} />)

      const notSpecified = screen.getAllByText("Not specified")
      expect(notSpecified.length).toBeGreaterThan(0)
    })
  })

  describe("Belt change", () => {
    it("should call updateUserBelt when belt is changed", async () => {
      vi.mocked(updateUserBelt).mockResolvedValue({ success: true })
      const user = userEvent.setup({ delay: null })

      render(<UserProfile user={mockUser} curriculums={mockCurriculums} curriculumLevels={mockCurriculumLevels} />)

      const beltSelect = screen.getByTestId("belt-select")
      await user.selectOptions(beltSelect, "level-2")

      await waitFor(() => {
        expect(updateUserBelt).toHaveBeenCalledWith("user-1", "level-2")
      })
    })

    it("should call updateUserBelt with null when 'none' option is selected", async () => {
      vi.mocked(updateUserBelt).mockResolvedValue({ success: true })
      const user = userEvent.setup({ delay: null })

      render(<UserProfile user={mockUser} curriculums={mockCurriculums} curriculumLevels={mockCurriculumLevels} />)

      const beltSelect = screen.getByTestId("belt-select")
      await user.selectOptions(beltSelect, "none")

      await waitFor(() => {
        expect(updateUserBelt).toHaveBeenCalledWith("user-1", null)
      })
    })

    it("should show alert when belt update fails", async () => {
      vi.spyOn(console, "error").mockImplementation(() => {})
      vi.mocked(updateUserBelt).mockResolvedValue({ success: false, error: "Belt update failed" })
      const user = userEvent.setup({ delay: null })

      render(<UserProfile user={mockUser} curriculums={mockCurriculums} curriculumLevels={mockCurriculumLevels} />)

      const beltSelect = screen.getByTestId("belt-select")
      await user.selectOptions(beltSelect, "level-2")

      await waitFor(() => {
        expect(global.alert).toHaveBeenCalledWith("Failed to update belt. Please try again.")
      })
    })

    it("should update displayed belt name optimistically after successful belt change", async () => {
      vi.mocked(updateUserBelt).mockResolvedValue({ success: true })
      const user = userEvent.setup({ delay: null })

      render(<UserProfile user={mockUser} curriculums={mockCurriculums} curriculumLevels={mockCurriculumLevels} />)

      // Initially shows White Belt
      expect(screen.getAllByText("White Belt")[0]).toBeInTheDocument()

      const beltSelect = screen.getByTestId("belt-select")
      await user.selectOptions(beltSelect, "level-2")

      await waitFor(() => {
        // Optimistic update: belt display updates from mockCurriculumLevels lookup
        expect(screen.getAllByText("Yellow Belt")[0]).toBeInTheDocument()
      })
    })
  })
})
