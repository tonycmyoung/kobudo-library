import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import SearchInput from "@/components/search-input"

describe("SearchInput", () => {
  const defaultProps = {
    value: "",
    onChange: vi.fn(),
    onClear: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("should render the search input with placeholder", () => {
    render(<SearchInput {...defaultProps} />)

    expect(screen.getByPlaceholderText("Search videos...")).toBeInTheDocument()
  })

  it("should use custom placeholder when provided", () => {
    render(<SearchInput {...defaultProps} placeholder="Find something..." />)

    expect(screen.getByPlaceholderText("Find something...")).toBeInTheDocument()
  })

  it("should call onChange when input value changes", async () => {
    const user = userEvent.setup({ delay: null })
    const onChange = vi.fn()
    render(<SearchInput {...defaultProps} onChange={onChange} />)

    const input = screen.getByPlaceholderText("Search videos...")
    await user.type(input, "bo")

    expect(onChange).toHaveBeenCalled()
  })

  it("should not render the clear button when value is empty", () => {
    render(<SearchInput {...defaultProps} value="" />)

    const clearButton = screen.queryByRole("button")
    expect(clearButton).toBeNull()
  })

  it("should render the clear button when value is set", () => {
    render(<SearchInput {...defaultProps} value="nunchaku" />)

    expect(screen.getByRole("button")).toBeInTheDocument()
  })

  it("should call onClear when the clear button is clicked", async () => {
    const user = userEvent.setup({ delay: null })
    const onClear = vi.fn()
    render(<SearchInput {...defaultProps} value="nunchaku" onClear={onClear} />)

    const clearButton = screen.getByRole("button")
    await user.click(clearButton)

    expect(onClear).toHaveBeenCalledTimes(1)
  })
})
