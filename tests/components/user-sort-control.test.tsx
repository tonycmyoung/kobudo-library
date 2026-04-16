import { describe, it, expect, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import React from "react"
import UserSortControl from "@/components/user-sort-control"

// Radix Select triggers jsdom navigation errors. Swap in a native <select> so
// onValueChange can be exercised through standard userEvent.selectOptions.
vi.mock("@/components/ui/select", () => ({
  Select: ({ value, onValueChange, children }: { value?: string; onValueChange?: (v: string) => void; children: React.ReactNode }) =>
    React.createElement("select", { value, onChange: (e: React.ChangeEvent<HTMLSelectElement>) => onValueChange?.(e.target.value) }, children),
  SelectTrigger: ({ children }: { children: React.ReactNode }) => React.createElement(React.Fragment, null, children),
  SelectValue: () => null,
  SelectContent: ({ children }: { children: React.ReactNode }) => React.createElement(React.Fragment, null, children),
  SelectItem: ({ value, children }: { value: string; children: React.ReactNode }) =>
    React.createElement("option", { value }, children),
}))

describe("UserSortControl", () => {
  it("should render sort label and controls", () => {
    const onSortChange = vi.fn()
    render(<UserSortControl sortBy="full_name" sortOrder="asc" onSortChange={onSortChange} />)

    expect(screen.getByText("Sort by:")).toBeInTheDocument()
    expect(screen.getByRole("combobox")).toBeInTheDocument()
  })

  it("should display current sort option", () => {
    const onSortChange = vi.fn()
    render(<UserSortControl sortBy="full_name" sortOrder="asc" onSortChange={onSortChange} />)

    expect(screen.getByRole("combobox")).toHaveTextContent("Name")
  })

  // The dropdown interaction doesn't work in test environment and triggers uncaught exceptions

  it("should toggle sort order when arrow button is clicked", async () => {
    const user = userEvent.setup({ delay: null })
    const onSortChange = vi.fn()
    render(<UserSortControl sortBy="full_name" sortOrder="asc" onSortChange={onSortChange} />)

    const toggleButton = screen.getByRole("button", { name: /sort descending/i })
    await user.click(toggleButton)

    expect(onSortChange).toHaveBeenCalledWith("full_name", "desc")
  })

  it("should call onSortChange with new sort key and existing order when sort-by selection changes", async () => {
    const user = userEvent.setup({ delay: null })
    const onSortChange = vi.fn()
    render(<UserSortControl sortBy="full_name" sortOrder="asc" onSortChange={onSortChange} />)

    const select = screen.getByRole("combobox")
    await user.selectOptions(select, "created_at")

    expect(onSortChange).toHaveBeenCalledWith("created_at", "asc")
  })

  it("should show correct tooltip based on sort order", () => {
    const onSortChange = vi.fn()
    const { rerender } = render(<UserSortControl sortBy="full_name" sortOrder="asc" onSortChange={onSortChange} />)

    expect(screen.getByTitle("Sort descending")).toBeInTheDocument()

    rerender(<UserSortControl sortBy="full_name" sortOrder="desc" onSortChange={onSortChange} />)
    expect(screen.getByTitle("Sort ascending")).toBeInTheDocument()
  })
})
