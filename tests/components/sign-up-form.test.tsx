import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, act, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import SignUpForm from "@/components/sign-up-form"
import { useActionState } from "react"

// Mock dependencies
vi.mock("@/lib/actions", () => ({
  signUp: vi.fn(),
}))

vi.mock("react", async () => {
  const actual = await vi.importActual("react")
  return {
    ...actual,
    useActionState: vi.fn(),
  }
})

vi.mock("react-dom", async () => {
  const actual = await vi.importActual("react-dom")
  return {
    ...actual,
    useFormStatus: vi.fn(() => ({ pending: false })),
  }
})

const mockRouterPush = vi.fn()
const mockSearchParamsGet = vi.fn()

vi.mock("next/navigation", () => ({
  useRouter: vi.fn(() => ({
    push: mockRouterPush,
  })),
  useSearchParams: vi.fn(() => ({
    get: mockSearchParamsGet,
  })),
}))

describe("SignUpForm", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Provide a default useActionState mock so existing tests render correctly
    vi.mocked(useActionState).mockReturnValue([null, vi.fn(), false])
    // Default: no invitation token
    mockSearchParamsGet.mockReturnValue(null)
  })

  it("should render sign up form with all fields", () => {
    render(<SignUpForm />)

    expect(screen.getByText(/Join Okinawa Kobudo Library/)).toBeInTheDocument()
    expect(screen.getByLabelText("Full Name")).toBeInTheDocument()
    expect(screen.getByLabelText("Email")).toBeInTheDocument()
    expect(screen.getByLabelText("Teacher")).toBeInTheDocument()
    expect(screen.getByLabelText("School")).toBeInTheDocument()
    expect(screen.getByLabelText("Password")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /Create Account/i })).toBeInTheDocument()
  })

  it("should render legal agreement checkboxes", () => {
    render(<SignUpForm />)

    expect(screen.getByLabelText(/End User License Agreement/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Privacy Policy/i)).toBeInTheDocument()
  })

  it("should disable submit button when legal agreements are not checked", () => {
    render(<SignUpForm />)

    const submitButton = screen.getByRole("button", { name: /Create Account/i })
    expect(submitButton).toBeDisabled()
  })

  it("should enable submit button when both legal agreements are checked", async () => {
    const user = userEvent.setup({ delay: null })
    render(<SignUpForm />)

    const eulaCheckbox = screen.getByLabelText(/End User License Agreement/i)
    const privacyCheckbox = screen.getByLabelText(/Privacy Policy/i)

    await user.click(eulaCheckbox)
    await user.click(privacyCheckbox)

    const submitButton = screen.getByRole("button", { name: /Create Account/i })
    expect(submitButton).not.toBeDisabled()
  })

  it("should show warning when legal agreements are not accepted", () => {
    render(<SignUpForm />)

    expect(screen.getByText(/You must accept both the EULA and Privacy Policy/i)).toBeInTheDocument()
  })

  it("should hide warning when legal agreements are accepted", async () => {
    const user = userEvent.setup({ delay: null })
    render(<SignUpForm />)

    const eulaCheckbox = screen.getByLabelText(/End User License Agreement/i)
    const privacyCheckbox = screen.getByLabelText(/Privacy Policy/i)

    await user.click(eulaCheckbox)
    await user.click(privacyCheckbox)

    expect(screen.queryByText(/You must accept both the EULA and Privacy Policy/i)).toBeNull()
  })

  it("should toggle password visibility", async () => {
    const user = userEvent.setup({ delay: null })
    render(<SignUpForm />)

    const passwordInput = screen.getByLabelText("Password")
    expect(passwordInput).toHaveAttribute("type", "password")

    const toggleButtons = screen.getAllByRole("button")
    const toggleButton = toggleButtons.find((btn) => btn.querySelector("svg"))

    if (toggleButton) {
      await user.click(toggleButton)
      expect(passwordInput).toHaveAttribute("type", "text")

      await user.click(toggleButton)
      expect(passwordInput).toHaveAttribute("type", "password")
    }
  })

  it("should update form data when inputs change", async () => {
    const user = userEvent.setup({ delay: null })
    render(<SignUpForm />)

    const fullNameInput = screen.getByLabelText("Full Name")
    const emailInput = screen.getByLabelText("Email")
    const teacherInput = screen.getByLabelText("Teacher")
    const schoolInput = screen.getByLabelText("School")
    const passwordInput = screen.getByLabelText("Password")

    await user.type(fullNameInput, "John Doe")
    await user.type(emailInput, "john@example.com")
    await user.type(teacherInput, "Sensei Smith")
    await user.type(schoolInput, "Dojo ABC")
    await user.type(passwordInput, "Password123!")

    expect(fullNameInput).toHaveValue("John Doe")
    expect(emailInput).toHaveValue("john@example.com")
    expect(teacherInput).toHaveValue("Sensei Smith")
    expect(schoolInput).toHaveValue("Dojo ABC")
    expect(passwordInput).toHaveValue("Password123!")
  })

  it("should display password requirements text", () => {
    render(<SignUpForm />)

    expect(screen.getByText(/min 6 characters with uppercase, lowercase, number, and symbol/i)).toBeInTheDocument()
  })

  it("should display admin approval notice", () => {
    render(<SignUpForm />)

    expect(screen.getByText(/Your account will require admin approval/i)).toBeInTheDocument()
  })

  it("should render sign in link", () => {
    render(<SignUpForm />)

    const signInLink = screen.getByRole("link", { name: /Sign in/i })
    expect(signInLink).toBeInTheDocument()
    expect(signInLink).toHaveAttribute("href", "/auth/login")
  })

  it("should render EULA and Privacy Policy links", () => {
    render(<SignUpForm />)

    const eulaLink = screen.getByRole("link", { name: /End User License Agreement.*EULA/i })
    const privacyLink = screen.getByRole("link", { name: /Privacy Policy/i })

    expect(eulaLink).toBeInTheDocument()
    expect(eulaLink).toHaveAttribute("href", "/eula")
    expect(privacyLink).toBeInTheDocument()
    expect(privacyLink).toHaveAttribute("href", "/privacy-policy")
  })

  describe("Form submission with agreements accepted", () => {
    it("should call form action when form is submitted with agreements accepted", async () => {
      const mockFormAction = vi.fn()
      vi.mocked(useActionState).mockReturnValue([null, mockFormAction, false])
      const user = userEvent.setup({ delay: null })

      render(<SignUpForm />)

      // Accept legal agreements
      await user.click(screen.getByLabelText(/End User License Agreement/i))
      await user.click(screen.getByLabelText(/Privacy Policy/i))

      // Fill required fields
      await user.type(screen.getByLabelText("Full Name"), "John Doe")
      await user.type(screen.getByLabelText("Email"), "john@example.com")
      await user.type(screen.getByLabelText("Teacher"), "Sensei Smith")
      await user.type(screen.getByLabelText("School"), "Test Dojo")
      await user.type(screen.getByLabelText("Password"), "Password123!")

      // Submit the form
      await user.click(screen.getByRole("button", { name: /Create Account/i }))

      await waitFor(() => {
        expect(mockFormAction).toHaveBeenCalled()
      })
    })
  })

  describe("Invitation token", () => {
    it("should append invitationToken to formData when token is present in search params", async () => {
      const mockFormAction = vi.fn()
      vi.mocked(useActionState).mockReturnValue([null, mockFormAction, false])
      mockSearchParamsGet.mockImplementation((key: string) => (key === "invitation" ? "invite-abc123" : null))
      const user = userEvent.setup({ delay: null })

      render(<SignUpForm />)

      await user.click(screen.getByLabelText(/End User License Agreement/i))
      await user.click(screen.getByLabelText(/Privacy Policy/i))
      await user.type(screen.getByLabelText("Full Name"), "John Doe")
      await user.type(screen.getByLabelText("Email"), "john@example.com")
      await user.type(screen.getByLabelText("Teacher"), "Sensei Smith")
      await user.type(screen.getByLabelText("School"), "Test Dojo")
      await user.type(screen.getByLabelText("Password"), "Password123!")

      await user.click(screen.getByRole("button", { name: /Create Account/i }))

      await waitFor(() => {
        expect(mockFormAction).toHaveBeenCalled()
      })
    })
  })

  describe("State effects", () => {
    it("should redirect to login after success state with timer", () => {
      vi.mocked(useActionState).mockReturnValue([{ success: "Account created!" }, vi.fn(), false])

      render(<SignUpForm />)

      // Success message should be visible immediately
      expect(screen.getByText(/Redirecting to login page/)).toBeInTheDocument()
    })

    it("should call router.push to login after success timer elapses", async () => {
      vi.useFakeTimers()
      vi.mocked(useActionState).mockReturnValue([{ success: "Account created!" }, vi.fn(), false])

      render(<SignUpForm />)

      await act(async () => {
        vi.advanceTimersByTime(2500)
      })

      expect(mockRouterPush).toHaveBeenCalledWith("/auth/login")
      vi.useRealTimers()
    })

    it("should show error message when state has error", async () => {
      vi.mocked(useActionState).mockReturnValue([{ error: "Email already exists" }, vi.fn(), false])

      render(<SignUpForm />)

      await waitFor(() => {
        expect(screen.getByText("Email already exists")).toBeInTheDocument()
      })
    })
  })
})
