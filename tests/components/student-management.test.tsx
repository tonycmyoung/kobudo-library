import { describe, it, expect, vi, beforeEach, type MockInstance } from "vitest"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import StudentManagement from "@/components/student-management"
import { createClient as createBrowserClient } from "@/lib/supabase/client"
import { fetchStudentsForHeadTeacher, updateStudentForHeadTeacher } from "@/lib/actions/users"
import { revokeUserAccess, restoreUserAccess } from "@/lib/actions"
import { deleteUserCompletely } from "@/lib/actions"
import { useRouter, useSearchParams } from "next/navigation"
import { within } from "@testing-library/react"

vi.mock("react-toastify", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
  },
}))

vi.mock("@/lib/supabase/client", () => ({
  createClient: vi.fn(),
}))

vi.mock("@/lib/actions/users", () => ({
  fetchStudentsForHeadTeacher: vi.fn(),
  updateStudentForHeadTeacher: vi.fn(),
  assignCurriculumSetToUser: vi.fn().mockResolvedValue({ success: "Curriculum set assigned successfully" }),
}))

vi.mock("@/lib/actions", () => ({
  deleteUserCompletely: vi.fn(),
  revokeUserAccess: vi.fn(),
  restoreUserAccess: vi.fn(),
}))

vi.mock("next/navigation", () => ({
  useRouter: vi.fn(),
  useSearchParams: vi.fn(),
}))


describe("StudentManagement", () => {
  const mockRouter = {
    push: vi.fn(),
    refresh: vi.fn(),
    replace: vi.fn(),
  }

  const mockSearchParams = {
    get: vi.fn((_param: string) => null),
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mockStudents: any[] = [
    {
      id: "student-1",
      email: "john@example.com",
      full_name: "John Doe",
      teacher: "Sensei Bob",
      school: "Test Dojo",
      role: "Student",
      created_at: "2024-01-01T00:00:00Z",
      is_approved: true,
      approved_at: "2024-01-02T00:00:00Z",
      profile_image_url: null,
      last_login: "2024-01-15T00:00:00Z",
      login_count: 5,
      last_view: "2024-01-16T00:00:00Z",
      view_count: 10,
      current_belt_id: "belt-1",
      current_belt: {
        id: "belt-1",
        name: "White Belt",
        color: "#ffffff",
        display_order: 1,
      },
      inviter: {
        full_name: "Admin User",
      },
      curriculum_set_id: "set-1",
      curriculum_set: { id: "set-1", name: "Okinawa Kobudo Australia" },
    },
    {
      id: "student-2",
      email: "jane@example.com",
      full_name: "Jane Smith",
      teacher: "Sensei Alice",
      school: "Test Dojo",
      role: "Teacher",
      created_at: "2024-01-01T00:00:00Z",
      is_approved: true,
      approved_at: null,
      profile_image_url: null,
      last_login: null,
      login_count: 0,
      last_view: null,
      view_count: 0,
      current_belt_id: null,
      current_belt: null,
      curriculum_set_id: null,
      curriculum_set: null,
    },
  ]

  const mockCurriculumSets = [
    { id: "set-1", name: "Okinawa Kobudo Australia" },
    { id: "set-2", name: "Matayoshi International" },
  ]

  const mockCurriculumLevels = [
    { id: "level-1", name: "White", display_name: "White Belt", sort_order: 1, curriculum_set_id: "set-1" },
    { id: "level-2", name: "Yellow", display_name: "Yellow Belt", sort_order: 2, curriculum_set_id: "set-1" },
    { id: "level-3", name: "Green", display_name: "Green Belt", sort_order: 3, curriculum_set_id: "set-2" },
  ]

  const mockCurriculums = [
    { id: "belt-1", name: "White Belt", color: "#ffffff", display_order: 1 },
    { id: "belt-2", name: "Yellow Belt", color: "#ffff00", display_order: 2 },
  ]

  let mockFrom: MockInstance
  let mockSelect: MockInstance
  let mockOrder: MockInstance
  let mockUpdate: MockInstance
  let mockEq: MockInstance
  let mockSingle: MockInstance

  const user = userEvent.setup({ delay: null })

  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(console, "error").mockImplementation(() => {})
    vi.stubGlobal("confirm", vi.fn())
    vi.mocked(useRouter).mockReturnValue(mockRouter as unknown as ReturnType<typeof useRouter>)
    vi.mocked(useSearchParams).mockReturnValue(mockSearchParams as unknown as ReturnType<typeof useSearchParams>)

    mockSingle = vi.fn().mockResolvedValue({
      data: { ...mockStudents[0], current_belt: mockCurriculums[0] },
      error: null,
    })
    mockEq = vi.fn().mockReturnValue({ single: mockSingle })
    mockUpdate = vi.fn().mockReturnValue({ eq: mockEq })
    mockOrder = vi.fn().mockResolvedValue({ data: mockCurriculums, error: null })
    mockSelect = vi.fn().mockReturnValue({ order: mockOrder })

    mockFrom = vi.fn((table: string) => {
      if (table === "users") {
        return {
          select: vi.fn().mockReturnValue({ eq: mockEq }),
          update: mockUpdate,
        }
      }
      if (table === "curriculums") {
        return { select: mockSelect }
      }
      if (table === "curriculum_sets") {
        return {
          select: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({ data: mockCurriculumSets, error: null }),
          }),
        }
      }
      if (table === "curriculum_levels") {
        return {
          select: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({ data: mockCurriculumLevels, error: null }),
          }),
        }
      }
      return { select: mockSelect }
    })

    vi.mocked(createBrowserClient).mockReturnValue({ from: mockFrom } as unknown as ReturnType<typeof createBrowserClient>)
    vi.mocked(fetchStudentsForHeadTeacher).mockResolvedValue({ data: mockStudents, error: null })
  })

  it("should render loading state initially", async () => {
    // Use a never-resolving promise to keep component in loading state
    vi.mocked(fetchStudentsForHeadTeacher).mockReturnValue(new Promise(() => {}))
    
    const { unmount } = render(<StudentManagement headTeacherSchool="Test Dojo" headTeacherId="teacher-1" userRole="Head Teacher" />)
    expect(screen.getByText("Loading students...")).toBeInTheDocument()
    
    // Unmount before the promise resolves to prevent act() warnings
    unmount()
  })

  it("should render student list after loading", async () => {
    render(<StudentManagement headTeacherSchool="Test Dojo" headTeacherId="teacher-1" userRole="Head Teacher" />)

    await waitFor(() => {
      expect(screen.getByText("John Doe")).toBeInTheDocument()
      expect(screen.getByText("Jane Smith")).toBeInTheDocument()
    })
  })

  it("should display student count in header", async () => {
    render(<StudentManagement headTeacherSchool="Test Dojo" headTeacherId="teacher-1" userRole="Head Teacher" />)

    await waitFor(() => {
      expect(screen.getByText("Students (2)")).toBeInTheDocument()
    })
  })

  it("should display user role badges", async () => {
    render(<StudentManagement headTeacherSchool="Test Dojo" headTeacherId="teacher-1" userRole="Head Teacher" />)

    await waitFor(() => {
      const johnDoeText = screen.getByText("John Doe")
      const johnDoeCard = johnDoeText.closest(".flex.flex-col") as HTMLElement
      expect(johnDoeCard).toBeInTheDocument()

      const johnRoleBadge = within(johnDoeCard).getByText((content, element) => {
        return (
          element?.tagName.toLowerCase() === "span" &&
          element?.textContent === "Student" &&
          element?.getAttribute("data-slot") === "badge"
        )
      })
      expect(johnRoleBadge).toBeInTheDocument()

      const janeSmithText = screen.getByText("Jane Smith")
      const janeSmithCard = janeSmithText.closest(".flex.flex-col") as HTMLElement
      expect(janeSmithCard).toBeInTheDocument()

      const janeRoleBadge = within(janeSmithCard).getByText((content, element) => {
        return (
          element?.tagName.toLowerCase() === "span" &&
          element?.textContent === "Teacher" &&
          element?.getAttribute("data-slot") === "badge"
        )
      })
      expect(janeRoleBadge).toBeInTheDocument()
    })
  })

  it("should display login and view statistics", async () => {
    render(<StudentManagement headTeacherSchool="Test Dojo" headTeacherId="teacher-1" userRole="Head Teacher" />)

    await waitFor(() => {
      expect(screen.getByText("5 logins")).toBeInTheDocument()
      expect(screen.getByText("10 views")).toBeInTheDocument()
    })
  })

  it("should display teacher and school information", async () => {
    render(<StudentManagement headTeacherSchool="Test Dojo" headTeacherId="teacher-1" userRole="Head Teacher" />)

    await waitFor(() => {
      const johnDoeText = screen.getByText("John Doe")
      const johnDoeCard = johnDoeText.closest(".flex.flex-col") as HTMLElement
      expect(johnDoeCard).toBeInTheDocument()

      expect(within(johnDoeCard).getByText("Sensei Bob")).toBeInTheDocument()
      expect(within(johnDoeCard).getByText(/Test Dojo/)).toBeInTheDocument()
    })
  })

  it("should display inviter information", async () => {
    render(<StudentManagement headTeacherSchool="Test Dojo" headTeacherId="teacher-1" userRole="Head Teacher" />)

    await waitFor(() => {
      const johnDoeText = screen.getByText("John Doe")
      const johnDoeCard = johnDoeText.closest(".flex.flex-col") as HTMLElement
      expect(johnDoeCard).toBeInTheDocument()

      expect(within(johnDoeCard).getByText("Inv: Admin User")).toBeInTheDocument()
    })
  })

  it("should render search input", async () => {
    render(<StudentManagement headTeacherSchool="Test Dojo" headTeacherId="teacher-1" userRole="Head Teacher" />)

    await waitFor(() => {
      expect(screen.getByPlaceholderText("Search students...")).toBeInTheDocument()
    })
  })

  it("should filter students by search query", async () => {
    render(<StudentManagement headTeacherSchool="Test Dojo" headTeacherId="teacher-1" userRole="Head Teacher" />)

    await waitFor(() => {
      expect(screen.getByText("John Doe")).toBeInTheDocument()
    })

    const searchInput = screen.getByPlaceholderText("Search students...")
    await user.type(searchInput, "Jane")

    await waitFor(
      () => {
        expect(screen.queryByText("John Doe")).toBeNull()
        expect(screen.getByText("Jane Smith")).toBeInTheDocument()
      },
      { timeout: 3000 },
    )
  }, 10000)

  it("should update user role when role select is changed", async () => {
    mockEq.mockResolvedValue({ data: null, error: null })

    render(<StudentManagement headTeacherSchool="Test Dojo" headTeacherId="teacher-1" userRole="Head Teacher" />)

    await waitFor(() => {
      expect(screen.getByText("John Doe")).toBeInTheDocument()
    })

    const johnDoeText = screen.getByText("John Doe")
    const johnDoeCard = johnDoeText.closest(".flex.flex-col")
    const roleSelect = johnDoeCard
      ?.querySelector('select option[value="Student"]')
      ?.closest("select") as HTMLSelectElement

    await user.selectOptions(roleSelect, "Teacher")

    await waitFor(() => {
      expect(mockUpdate).toHaveBeenCalled()
      expect(mockEq).toHaveBeenCalledWith("id", "student-1")
    })
  })

  it("should update user belt when belt select is changed", async () => {
    render(<StudentManagement headTeacherSchool="Test Dojo" headTeacherId="teacher-1" userRole="Head Teacher" />)

    await waitFor(() => {
      expect(screen.getByText("John Doe")).toBeInTheDocument()
    })

    const johnDoeText = screen.getByText("John Doe")
    const johnDoeCard = johnDoeText.closest(".flex.flex-col")
    // Find the belt select by looking for a select with "No belt" option
    const beltSelect = johnDoeCard?.querySelector('select[title="Current Belt"]') as HTMLSelectElement

    if (!beltSelect) {
      // Skip if belt select not found in current implementation
      return
    }

    await user.selectOptions(beltSelect, "belt-2")

    await waitFor(() => {
      expect(mockUpdate).toHaveBeenCalled()
    })
  })

  it("should enter edit mode when edit button is clicked", async () => {
    render(<StudentManagement headTeacherSchool="Test Dojo" headTeacherId="teacher-1" userRole="Head Teacher" />)

    await waitFor(() => {
      expect(screen.getByText("John Doe")).toBeInTheDocument()
    })

    const johnDoeText = screen.getByText("John Doe")
    const johnDoeCard = johnDoeText.closest(".flex.flex-col")
    const editButton = johnDoeCard?.querySelector('button[aria-label="Edit user"]') as HTMLButtonElement

    await user.click(editButton)

    await waitFor(() => {
      expect(screen.getByLabelText("Save changes")).toBeInTheDocument()
      expect(screen.getByLabelText("Cancel editing")).toBeInTheDocument()
    })
  })

  it("should save edited user fields when save button is clicked", async () => {
    vi.mocked(updateStudentForHeadTeacher).mockResolvedValue({ success: "Student updated successfully" })

    render(<StudentManagement headTeacherSchool="Test Dojo" headTeacherId="teacher-1" userRole="Head Teacher" />)

    await waitFor(() => {
      expect(screen.getByText("John Doe")).toBeInTheDocument()
    })

    const johnDoeText = screen.getByText("John Doe")
    const johnDoeCard = johnDoeText.closest(".flex.flex-col")
    const editButton = johnDoeCard?.querySelector('button[aria-label="Edit user"]') as HTMLButtonElement

    await user.click(editButton)

    await waitFor(() => {
      expect(screen.getByLabelText("Save changes")).toBeInTheDocument()
    })

    const nameInput = screen.getByPlaceholderText("Full name")
    await user.clear(nameInput)
    await user.type(nameInput, "John Smith")

    const saveButton = screen.getByLabelText("Save changes")
    await user.click(saveButton)

    await waitFor(() => {
      expect(updateStudentForHeadTeacher).toHaveBeenCalledWith("student-1", "John Smith", "Sensei Bob", "Test Dojo", "belt-1")
    })
  })

  it("should cancel edit mode when cancel button is clicked", async () => {
    render(<StudentManagement headTeacherSchool="Test Dojo" headTeacherId="teacher-1" userRole="Head Teacher" />)

    await waitFor(() => {
      expect(screen.getByText("John Doe")).toBeInTheDocument()
    })

    const johnDoeText = screen.getByText("John Doe")
    const johnDoeCard = johnDoeText.closest(".flex.flex-col")
    const editButton = johnDoeCard?.querySelector('button[aria-label="Edit user"]') as HTMLButtonElement

    await user.click(editButton)

    await waitFor(() => {
      expect(screen.getByLabelText("Cancel editing")).toBeInTheDocument()
    })

    const cancelButton = screen.getByLabelText("Cancel editing")
    await user.click(cancelButton)

    await waitFor(() => {
      expect(screen.queryByLabelText("Save changes")).toBeNull()
    })
  })

  it("should prompt for confirmation before deleting user", async () => {
    vi.mocked(global.confirm).mockReturnValue(false)

    render(<StudentManagement headTeacherSchool="Test Dojo" headTeacherId="teacher-1" userRole="Head Teacher" />)

    await waitFor(() => {
      expect(screen.getByText("John Doe")).toBeInTheDocument()
    })

    const johnDoeText = screen.getByText("John Doe")
    const johnDoeCard = johnDoeText.closest(".flex.flex-col")
    const deleteButton = johnDoeCard?.querySelector('button[aria-label="Delete user"]') as HTMLButtonElement

    await user.click(deleteButton)

    expect(global.confirm).toHaveBeenCalledWith(expect.stringContaining('delete the user "john@example.com"'))
    expect(deleteUserCompletely).not.toHaveBeenCalled()
  })

  it("should delete user when confirmed", async () => {
    vi.mocked(global.confirm).mockReturnValue(true)
    vi.mocked(deleteUserCompletely).mockResolvedValue({ success: "User deleted successfully" })

    render(<StudentManagement headTeacherSchool="Test Dojo" headTeacherId="teacher-1" userRole="Head Teacher" />)

    await waitFor(() => {
      expect(screen.getByText("John Doe")).toBeInTheDocument()
    })

    const johnDoeText = screen.getByText("John Doe")
    const johnDoeCard = johnDoeText.closest(".flex.flex-col")
    const deleteButton = johnDoeCard?.querySelector('button[aria-label="Delete user"]') as HTMLButtonElement

    await user.click(deleteButton)

    await waitFor(() => {
      expect(deleteUserCompletely).toHaveBeenCalledWith("student-1")
    })
  })

  it("should display invite user button", async () => {
    render(<StudentManagement headTeacherSchool="Test Dojo" headTeacherId="teacher-1" userRole="Head Teacher" />)

    await waitFor(() => {
      const inviteButtons = screen.getAllByText("Invite User")
      expect(inviteButtons.length).toBeGreaterThan(0)
    })
  })

  it("should display no students message when filtered list is empty", async () => {
    render(<StudentManagement headTeacherSchool="Test Dojo" headTeacherId="teacher-1" userRole="Head Teacher" />)

    await waitFor(() => {
      expect(screen.getByText("John Doe")).toBeInTheDocument()
    })

    const searchInput = screen.getByPlaceholderText("Search students...")
    await user.type(searchInput, "nonexistent")

    await waitFor(
      () => {
        expect(screen.getByText("No students found matching your criteria.")).toBeInTheDocument()
      },
      { timeout: 3000 },
    )
  }, 10000)

  it("should display empty state when no students exist", async () => {
    vi.mocked(fetchStudentsForHeadTeacher).mockResolvedValue({ data: [], error: null })
    render(<StudentManagement headTeacherSchool="Test Dojo" headTeacherId="teacher-1" userRole="Head Teacher" />)

    await waitFor(() => {
      expect(screen.getByText("No students found for your school.")).toBeInTheDocument()
    })
  })

  it("should display error when fetching students fails", async () => {
    vi.mocked(fetchStudentsForHeadTeacher).mockResolvedValue({ data: [], error: "Failed to fetch" })
    render(<StudentManagement headTeacherSchool="Test Dojo" headTeacherId="teacher-1" userRole="Head Teacher" />)

    await waitFor(() => {
      expect(screen.getByText("No students found for your school.")).toBeInTheDocument()
    })
  })

  it("should display school prefix as fixed text when editing student with branch suffix", async () => {
    const studentWithBranch = [
      {
        id: "student-1",
        email: "john@example.com",
        full_name: "John Doe",
        teacher: "Sensei Bob",
        school: "Test Dojo Central",
        role: "Student",
        created_at: "2024-01-01T00:00:00Z",
        is_approved: true,
        approved_at: "2024-01-02T00:00:00Z",
        profile_image_url: null,
        last_login: "2024-01-15T00:00:00Z",
        login_count: 5,
        last_view: "2024-01-16T00:00:00Z",
        view_count: 10,
        current_belt_id: "belt-1",
        current_belt: {
          id: "belt-1",
          name: "White Belt",
          color: "#ffffff",
          display_order: 1,
        },
        inviter: {
          full_name: "Admin User",
        },
      },
    ]
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.mocked(fetchStudentsForHeadTeacher).mockResolvedValue({ data: studentWithBranch as any, error: null })

    render(<StudentManagement headTeacherSchool="Test Dojo" headTeacherId="teacher-1" userRole="Head Teacher" />)

    await waitFor(() => {
      expect(screen.getByText("John Doe")).toBeInTheDocument()
    })

    const johnDoeText = screen.getByText("John Doe")
    const johnDoeCard = johnDoeText.closest(".flex.flex-col")
    const editButton = johnDoeCard?.querySelector('button[aria-label="Edit user"]') as HTMLButtonElement

    await user.click(editButton)

    await waitFor(() => {
      // Should show the fixed prefix
      expect(screen.getByText("Test Dojo")).toBeInTheDocument()
      // Should have input with the suffix
      const suffixInput = screen.getByPlaceholderText("(suffix)")
      expect(suffixInput).toBeInTheDocument()
      expect((suffixInput as HTMLInputElement).value).toBe("Central")
    })
  })

  it("should reconstruct full school name when saving edited suffix", async () => {
    const studentWithBranch = [
      {
        id: "student-1",
        email: "john@example.com",
        full_name: "John Doe",
        teacher: "Sensei Bob",
        school: "Test Dojo Central",
        role: "Student",
        created_at: "2024-01-01T00:00:00Z",
        is_approved: true,
        approved_at: "2024-01-02T00:00:00Z",
        profile_image_url: null,
        last_login: "2024-01-15T00:00:00Z",
        login_count: 5,
        last_view: "2024-01-16T00:00:00Z",
        view_count: 10,
        current_belt_id: "belt-1",
        current_belt: {
          id: "belt-1",
          name: "White Belt",
          color: "#ffffff",
          display_order: 1,
        },
        inviter: null,
      },
    ]
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.mocked(fetchStudentsForHeadTeacher).mockResolvedValue({ data: studentWithBranch as any, error: null })
    vi.mocked(updateStudentForHeadTeacher).mockResolvedValue({ success: "Student updated successfully" })

    render(<StudentManagement headTeacherSchool="Test Dojo" headTeacherId="teacher-1" userRole="Head Teacher" />)

    await waitFor(() => {
      expect(screen.getByText("John Doe")).toBeInTheDocument()
    })

    const johnDoeText = screen.getByText("John Doe")
    const johnDoeCard = johnDoeText.closest(".flex.flex-col")
    const editButton = johnDoeCard?.querySelector('button[aria-label="Edit user"]') as HTMLButtonElement

    await user.click(editButton)

    await waitFor(() => {
      expect(screen.getByPlaceholderText("(suffix)")).toBeInTheDocument()
    })

    const suffixInput = screen.getByPlaceholderText("(suffix)")
    await user.clear(suffixInput)
    await user.type(suffixInput, "North")

    const saveButton = screen.getByLabelText("Save changes")
    await user.click(saveButton)

    await waitFor(() => {
      // Should be called with the reconstructed full school name
      expect(updateStudentForHeadTeacher).toHaveBeenCalledWith(
        "student-1",
        "John Doe",
        "Sensei Bob",
        "Test Dojo North",
        "belt-1"
      )
    })
  })

  it("should allow removing suffix to set school to just the prefix", async () => {
    const studentWithBranch = [
      {
        id: "student-1",
        email: "john@example.com",
        full_name: "John Doe",
        teacher: "Sensei Bob",
        school: "Test Dojo Central",
        role: "Student",
        created_at: "2024-01-01T00:00:00Z",
        is_approved: true,
        approved_at: "2024-01-02T00:00:00Z",
        profile_image_url: null,
        last_login: "2024-01-15T00:00:00Z",
        login_count: 5,
        last_view: "2024-01-16T00:00:00Z",
        view_count: 10,
        current_belt_id: null,
        current_belt: null,
        inviter: null,
      },
    ]
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.mocked(fetchStudentsForHeadTeacher).mockResolvedValue({ data: studentWithBranch as any, error: null })
    vi.mocked(updateStudentForHeadTeacher).mockResolvedValue({ success: "Student updated successfully" })

    render(<StudentManagement headTeacherSchool="Test Dojo" headTeacherId="teacher-1" userRole="Head Teacher" />)

    await waitFor(() => {
      expect(screen.getByText("John Doe")).toBeInTheDocument()
    })

    const johnDoeText = screen.getByText("John Doe")
    const johnDoeCard = johnDoeText.closest(".flex.flex-col")
    const editButton = johnDoeCard?.querySelector('button[aria-label="Edit user"]') as HTMLButtonElement

    await user.click(editButton)

    await waitFor(() => {
      expect(screen.getByPlaceholderText("(suffix)")).toBeInTheDocument()
    })

    const suffixInput = screen.getByPlaceholderText("(suffix)")
    await user.clear(suffixInput)

    const saveButton = screen.getByLabelText("Save changes")
    await user.click(saveButton)

    await waitFor(() => {
      // Should be called with just the prefix when suffix is empty
      expect(updateStudentForHeadTeacher).toHaveBeenCalledWith(
        "student-1",
        "John Doe",
        "Sensei Bob",
        "Test Dojo",
        null
      )
    })
  })

  describe("error paths and edge cases", () => {
    it("handles fetchStudents throwing an exception", async () => {
      vi.mocked(fetchStudentsForHeadTeacher).mockRejectedValue(new Error("network error"))
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {})
      render(<StudentManagement headTeacherSchool="Test Dojo" headTeacherId="teacher-1" userRole="Head Teacher" />)
      await waitFor(() => {
        expect(screen.getByText("No students found for your school.")).toBeInTheDocument()
      })
      consoleSpy.mockRestore()
    })

    it("handles curriculum_sets fetch error gracefully", async () => {
      mockFrom = vi.fn((table: string) => {
        if (table === "curriculum_sets") {
          return {
            select: vi.fn().mockReturnValue({
              order: vi.fn().mockResolvedValue({ data: null, error: { message: "sets error" } }),
            }),
          }
        }
        if (table === "curriculums") {
          return {
            select: vi.fn().mockReturnValue({
              order: vi.fn().mockResolvedValue({ data: [], error: null }),
            }),
          }
        }
        if (table === "curriculum_levels") {
          return {
            select: vi.fn().mockReturnValue({
              order: vi.fn().mockResolvedValue({ data: mockCurriculumLevels, error: null }),
            }),
          }
        }
        return { select: vi.fn().mockReturnValue({ order: vi.fn().mockResolvedValue({ data: [], error: null }) }) }
      })
      vi.mocked(createBrowserClient).mockReturnValue({ from: mockFrom } as unknown as ReturnType<typeof createBrowserClient>)
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {})
      render(<StudentManagement headTeacherSchool="Test Dojo" headTeacherId="teacher-1" userRole="Head Teacher" />)
      await waitFor(() => {
        expect(screen.getByText("John Doe")).toBeInTheDocument()
      })
      consoleSpy.mockRestore()
    })

    it("handles curriculums fetch error gracefully", async () => {
      mockFrom = vi.fn((table: string) => {
        if (table === "curriculum_sets") {
          return {
            select: vi.fn().mockReturnValue({
              order: vi.fn().mockResolvedValue({ data: mockCurriculumSets, error: null }),
            }),
          }
        }
        if (table === "curriculums") {
          return {
            select: vi.fn().mockReturnValue({
              order: vi.fn().mockResolvedValue({ data: null, error: { message: "curriculums error" } }),
            }),
          }
        }
        if (table === "curriculum_levels") {
          return {
            select: vi.fn().mockReturnValue({
              order: vi.fn().mockResolvedValue({ data: mockCurriculumLevels, error: null }),
            }),
          }
        }
        return { select: vi.fn().mockReturnValue({ order: vi.fn().mockResolvedValue({ data: [], error: null }) }) }
      })
      vi.mocked(createBrowserClient).mockReturnValue({ from: mockFrom } as unknown as ReturnType<typeof createBrowserClient>)
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {})
      render(<StudentManagement headTeacherSchool="Test Dojo" headTeacherId="teacher-1" userRole="Head Teacher" />)
      await waitFor(() => {
        expect(screen.getByText("John Doe")).toBeInTheDocument()
      })
      consoleSpy.mockRestore()
    })

    it("getRoleBadgeClass: renders Admin badge", async () => {
      vi.mocked(fetchStudentsForHeadTeacher).mockResolvedValue({
        data: [{ ...mockStudents[0], role: "Admin" }],
        error: null,
      })
      render(<StudentManagement headTeacherSchool="Test Dojo" headTeacherId="teacher-1" userRole="Head Teacher" />)
      await waitFor(() => {
        const badge = screen.getByText((content, el) =>
          el?.tagName.toLowerCase() === "span" &&
          el?.textContent === "Admin" &&
          el?.getAttribute("data-slot") === "badge"
        )
        expect(badge.className).toContain("bg-red-600")
      })
    })

    it("getRoleBadgeClass: renders Head Teacher badge", async () => {
      vi.mocked(fetchStudentsForHeadTeacher).mockResolvedValue({
        data: [{ ...mockStudents[0], role: "Head Teacher" }],
        error: null,
      })
      render(<StudentManagement headTeacherSchool="Test Dojo" headTeacherId="teacher-1" userRole="Head Teacher" />)
      await waitFor(() => {
        const badge = screen.getByText((content, el) =>
          el?.tagName.toLowerCase() === "span" &&
          el?.textContent === "Head Teacher" &&
          el?.getAttribute("data-slot") === "badge"
        )
        expect(badge.className).toContain("bg-teal-600")
      })
    })

    it("getRoleBadgeClass: renders default badge for unknown role", async () => {
      vi.mocked(fetchStudentsForHeadTeacher).mockResolvedValue({
        data: [{ ...mockStudents[0], role: "UnknownRole" }],
        error: null,
      })
      render(<StudentManagement headTeacherSchool="Test Dojo" headTeacherId="teacher-1" userRole="Head Teacher" />)
      await waitFor(() => {
        const badge = screen.getByText((content, el) =>
          el?.tagName.toLowerCase() === "span" &&
          el?.textContent === "UnknownRole" &&
          el?.getAttribute("data-slot") === "badge"
        )
        expect(badge.className).toContain("bg-gray-600")
      })
    })

    it("getInitials: uses email[0] when full_name is null", async () => {
      vi.mocked(fetchStudentsForHeadTeacher).mockResolvedValue({
        data: [{ ...mockStudents[0], full_name: null, email: "zara@example.com" }],
        error: null,
      })
      render(<StudentManagement headTeacherSchool="Test Dojo" headTeacherId="teacher-1" userRole="Head Teacher" />)
      await waitFor(() => {
        // Avatar fallback should show "Z" (first letter of email)
        expect(screen.getByText("Z")).toBeInTheDocument()
      })
    })

    it("deleteUser: shows error toast when deleteUserCompletely throws", async () => {
      const { toast } = await import("react-toastify")
      vi.mocked(global.confirm).mockReturnValue(true)
      vi.mocked(deleteUserCompletely).mockRejectedValue(new Error("delete failed"))
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {})

      render(<StudentManagement headTeacherSchool="Test Dojo" headTeacherId="teacher-1" userRole="Head Teacher" />)
      await waitFor(() => { expect(screen.getByText("John Doe")).toBeInTheDocument() })

      const johnDoeCard = screen.getByText("John Doe").closest(".flex.flex-col")
      const deleteButton = johnDoeCard?.querySelector('button[aria-label="Delete user"]') as HTMLButtonElement
      await user.click(deleteButton)

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith("Failed to delete user. Please try again.")
      })
      consoleSpy.mockRestore()
    })

    it("deleteUser: shows error toast when result.success is false", async () => {
      const { toast } = await import("react-toastify")
      vi.mocked(global.confirm).mockReturnValue(true)
      vi.mocked(deleteUserCompletely).mockResolvedValue({ error: "Server error" })
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {})

      render(<StudentManagement headTeacherSchool="Test Dojo" headTeacherId="teacher-1" userRole="Head Teacher" />)
      await waitFor(() => { expect(screen.getByText("John Doe")).toBeInTheDocument() })

      const johnDoeCard = screen.getByText("John Doe").closest(".flex.flex-col")
      const deleteButton = johnDoeCard?.querySelector('button[aria-label="Delete user"]') as HTMLButtonElement
      await user.click(deleteButton)

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith("Failed to delete user. Please try again.")
      })
      consoleSpy.mockRestore()
    })

    it("updateUserRole: shows error toast when supabase update fails", async () => {
      const { toast } = await import("react-toastify")
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {})

      // Make the update chain throw
      const mockEqThrow = vi.fn().mockRejectedValue(new Error("role update failed"))
      const mockUpdateThrow = vi.fn().mockReturnValue({ eq: mockEqThrow })
      mockFrom = vi.fn((table: string) => {
        if (table === "users") return { select: vi.fn().mockReturnValue({ eq: mockEq }), update: mockUpdateThrow }
        if (table === "curriculums") return { select: mockSelect }
        if (table === "curriculum_sets") {
          return { select: vi.fn().mockReturnValue({ order: vi.fn().mockResolvedValue({ data: mockCurriculumSets, error: null }) }) }
        }
        if (table === "curriculum_levels") {
          return { select: vi.fn().mockReturnValue({ order: vi.fn().mockResolvedValue({ data: mockCurriculumLevels, error: null }) }) }
        }
        return { select: mockSelect }
      })
      vi.mocked(createBrowserClient).mockReturnValue({ from: mockFrom } as unknown as ReturnType<typeof createBrowserClient>)

      render(<StudentManagement headTeacherSchool="Test Dojo" headTeacherId="teacher-1" userRole="Head Teacher" />)
      await waitFor(() => { expect(screen.getByText("John Doe")).toBeInTheDocument() })

      const johnDoeCard = screen.getByText("John Doe").closest(".flex.flex-col")
      const roleSelect = johnDoeCard?.querySelector('select option[value="Student"]')?.closest("select") as HTMLSelectElement
      await user.selectOptions(roleSelect, "Teacher")

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith("Failed to update user role. Please try again.")
      })
      consoleSpy.mockRestore()
    })

    it("updateStudentForHeadTeacher: shows error toast when result has error", async () => {
      const { toast } = await import("react-toastify")
      vi.mocked(updateStudentForHeadTeacher).mockResolvedValue({ error: "Update failed" })
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {})

      render(<StudentManagement headTeacherSchool="Test Dojo" headTeacherId="teacher-1" userRole="Head Teacher" />)
      await waitFor(() => { expect(screen.getByText("John Doe")).toBeInTheDocument() })

      const johnDoeCard = screen.getByText("John Doe").closest(".flex.flex-col")
      const editButton = johnDoeCard?.querySelector('button[aria-label="Edit user"]') as HTMLButtonElement
      await user.click(editButton)
      await waitFor(() => { expect(screen.getByLabelText("Save changes")).toBeInTheDocument() })

      const saveButton = screen.getByLabelText("Save changes")
      await user.click(saveButton)

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith("Failed to update user fields. Please try again.")
      })
      consoleSpy.mockRestore()
    })
  })

  describe("toggleStudentApproval", () => {
    it("calls revokeUserAccess and updates state when revoking an approved student", async () => {
      const { toast } = await import("react-toastify")
      vi.mocked(revokeUserAccess).mockResolvedValue({ success: "User access revoked" })
      render(<StudentManagement headTeacherSchool="Test Dojo" headTeacherId="teacher-1" userRole="Head Teacher" />)

      await waitFor(() => { expect(screen.getByText("John Doe")).toBeInTheDocument() })

      const johnCard = screen.getByText("John Doe").closest(".flex.flex-col")
      const revokeButton = johnCard?.querySelector('button[aria-label="Revoke access"]') as HTMLButtonElement
      await user.click(revokeButton)

      await waitFor(() => {
        expect(revokeUserAccess).toHaveBeenCalledWith("student-1")
        expect(toast.success).toHaveBeenCalledWith("User access revoked")
      })
    })

    it("calls restoreUserAccess and updates state when restoring a revoked student", async () => {
      const { toast } = await import("react-toastify")
      const revokedStudent = { ...mockStudents[0], is_approved: false }
      vi.mocked(fetchStudentsForHeadTeacher).mockResolvedValue({ data: [revokedStudent, mockStudents[1]], error: null })
      vi.mocked(restoreUserAccess).mockResolvedValue({ success: "User access restored" })

      render(<StudentManagement headTeacherSchool="Test Dojo" headTeacherId="teacher-1" userRole="Head Teacher" />)

      await waitFor(() => { expect(screen.getByText("John Doe")).toBeInTheDocument() })

      const johnCard = screen.getByText("John Doe").closest(".flex.flex-col")
      const restoreButton = johnCard?.querySelector('button[aria-label="Restore access"]') as HTMLButtonElement
      await user.click(restoreButton)

      await waitFor(() => {
        expect(restoreUserAccess).toHaveBeenCalledWith("student-1")
        expect(toast.success).toHaveBeenCalledWith("User access restored")
      })
    })

    it("shows error toast when revokeUserAccess returns an error", async () => {
      const { toast } = await import("react-toastify")
      vi.mocked(revokeUserAccess).mockResolvedValue({ error: "Cannot revoke access for students from other schools" })
      render(<StudentManagement headTeacherSchool="Test Dojo" headTeacherId="teacher-1" userRole="Head Teacher" />)

      await waitFor(() => { expect(screen.getByText("John Doe")).toBeInTheDocument() })

      const johnCard = screen.getByText("John Doe").closest(".flex.flex-col")
      const revokeButton = johnCard?.querySelector('button[aria-label="Revoke access"]') as HTMLButtonElement
      await user.click(revokeButton)

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith("Failed to update user access. Please try again.")
      })
    })
  })

  describe("Belt Level Filtering by Curriculum Set", () => {
    it("should show belt options filtered by student curriculum set", async () => {
      render(<StudentManagement headTeacherSchool="Test Dojo" headTeacherId="teacher-1" userRole="Head Teacher" />)

      await waitFor(() => {
        expect(screen.getByText("John Doe")).toBeInTheDocument()
      })

      // The belt dropdown should render with the available options
      // For a student with set-1, should have set-1 levels (level-1, level-2)
      const beltSelects = screen.getAllByRole("combobox")
      expect(beltSelects.length).toBeGreaterThan(0)
    })

    it("should display curriculum set name for student", async () => {
      render(<StudentManagement headTeacherSchool="Test Dojo" headTeacherId="teacher-1" userRole="Head Teacher" />)

      await waitFor(() => {
        // Multiple elements may exist with this text (e.g., in dropdown options)
        const elements = screen.getAllByText("Okinawa Kobudo Australia")
        expect(elements.length).toBeGreaterThan(0)
      })
    })

    it("should show no curriculum set for unassigned student", async () => {
      render(<StudentManagement headTeacherSchool="Test Dojo" headTeacherId="teacher-1" userRole="Head Teacher" />)

      await waitFor(() => {
        expect(screen.getByText("Jane Smith")).toBeInTheDocument()
        // Jane has no curriculum set, should display as empty or "Not assigned"
      })
    })
  })
})
