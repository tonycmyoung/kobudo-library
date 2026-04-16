import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import FilterModeToggle from "@/components/filter-mode-toggle"

describe("FilterModeToggle", () => {
  const defaultProps = {
    filterMode: "AND" as const,
    onFilterModeChange: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("should render AND and OR buttons", () => {
    render(<FilterModeToggle {...defaultProps} />)

    expect(screen.getByRole("button", { name: "AND" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "OR" })).toBeInTheDocument()
  })

  it("should call onFilterModeChange with AND when AND button is clicked", async () => {
    const user = userEvent.setup({ delay: null })
    const onFilterModeChange = vi.fn()
    render(<FilterModeToggle {...defaultProps} filterMode="OR" onFilterModeChange={onFilterModeChange} />)

    await user.click(screen.getByRole("button", { name: "AND" }))

    expect(onFilterModeChange).toHaveBeenCalledWith("AND")
  })

  it("should call onFilterModeChange with OR when OR button is clicked", async () => {
    const user = userEvent.setup({ delay: null })
    const onFilterModeChange = vi.fn()
    render(<FilterModeToggle {...defaultProps} filterMode="AND" onFilterModeChange={onFilterModeChange} />)

    await user.click(screen.getByRole("button", { name: "OR" }))

    expect(onFilterModeChange).toHaveBeenCalledWith("OR")
  })

  it("should not show description text when showDescription is false (default)", () => {
    render(<FilterModeToggle {...defaultProps} />)

    expect(screen.queryByText(/Videos must have ALL/i)).toBeNull()
  })

  it("should show AND description text when showDescription is true and filterMode is AND", () => {
    render(<FilterModeToggle {...defaultProps} filterMode="AND" showDescription={true} />)

    expect(screen.getByText(/Videos must have ALL selected categories\/curriculums/i)).toBeInTheDocument()
  })

  it("should show OR description text when showDescription is true and filterMode is OR", () => {
    render(<FilterModeToggle {...defaultProps} filterMode="OR" showDescription={true} />)

    expect(screen.getByText(/Videos can have ANY selected categories\/curriculums/i)).toBeInTheDocument()
  })
})
