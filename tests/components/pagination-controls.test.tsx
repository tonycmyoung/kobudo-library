import { describe, it, expect, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import React from "react"
import PaginationControls from "@/components/pagination-controls"

// Radix Select triggers jsdom "Not implemented: navigation" errors via focus/portal
// management. Swap in a native <select> to keep tests focused on PaginationControls logic.
vi.mock("@/components/ui/select", () => ({
  Select: ({ value, onValueChange, children }: { value?: string; onValueChange?: (v: string) => void; children: React.ReactNode }) =>
    React.createElement("select", { value, onChange: (e: React.ChangeEvent<HTMLSelectElement>) => onValueChange?.(e.target.value) }, children),
  SelectTrigger: ({ children }: { children: React.ReactNode }) => React.createElement(React.Fragment, null, children),
  SelectValue: () => null,
  SelectContent: ({ children }: { children: React.ReactNode }) => React.createElement(React.Fragment, null, children),
  SelectItem: ({ value, children }: { value: string; children: React.ReactNode }) =>
    React.createElement("option", { value }, children),
}))

describe("PaginationControls", () => {
  const user = userEvent.setup({ delay: null })
  const noop = vi.fn()

  describe("items per page selector", () => {
    it("renders the items-per-page select with current value", () => {
      render(
        <PaginationControls
          totalPages={1}
          itemsPerPage={24}
          onItemsPerPageChange={noop}
          currentPage={1}
          onPageChange={noop}
        />
      )
      expect(screen.getByText("Show")).toBeInTheDocument()
      expect(screen.getByText("per page")).toBeInTheDocument()
    })
  })

  describe("navigation hidden when totalPages <= 1", () => {
    it("does not render First/Previous/Next/Last when only 1 page", () => {
      render(
        <PaginationControls
          totalPages={1}
          itemsPerPage={12}
          onItemsPerPageChange={noop}
          currentPage={1}
          onPageChange={noop}
        />
      )
      expect(screen.queryByText("First")).toBeNull()
      expect(screen.queryByText("Previous")).toBeNull()
      expect(screen.queryByText("Next")).toBeNull()
      expect(screen.queryByText("Last")).toBeNull()
    })
  })

  describe("navigation shown when totalPages > 1", () => {
    it("renders First/Previous/Next/Last buttons", () => {
      render(
        <PaginationControls
          totalPages={5}
          itemsPerPage={12}
          onItemsPerPageChange={noop}
          currentPage={3}
          onPageChange={noop}
        />
      )
      expect(screen.getByText("First")).toBeInTheDocument()
      expect(screen.getByText("Previous")).toBeInTheDocument()
      expect(screen.getByText("Next")).toBeInTheDocument()
      expect(screen.getByText("Last")).toBeInTheDocument()
    })

    it("First and Previous are disabled on page 1", () => {
      render(
        <PaginationControls
          totalPages={5}
          itemsPerPage={12}
          onItemsPerPageChange={noop}
          currentPage={1}
          onPageChange={noop}
        />
      )
      expect(screen.getByText("First").closest("button")).toBeDisabled()
      expect(screen.getByText("Previous").closest("button")).toBeDisabled()
    })

    it("Next and Last are disabled on the last page", () => {
      render(
        <PaginationControls
          totalPages={5}
          itemsPerPage={12}
          onItemsPerPageChange={noop}
          currentPage={5}
          onPageChange={noop}
        />
      )
      expect(screen.getByText("Next").closest("button")).toBeDisabled()
      expect(screen.getByText("Last").closest("button")).toBeDisabled()
    })

    it("calls onPageChange(1) when First is clicked", async () => {
      const onPageChange = vi.fn()
      render(
        <PaginationControls
          totalPages={5}
          itemsPerPage={12}
          onItemsPerPageChange={noop}
          currentPage={3}
          onPageChange={onPageChange}
        />
      )
      await user.click(screen.getByText("First"))
      expect(onPageChange).toHaveBeenCalledWith(1)
    })

    it("calls onPageChange(currentPage - 1) when Previous is clicked", async () => {
      const onPageChange = vi.fn()
      render(
        <PaginationControls
          totalPages={5}
          itemsPerPage={12}
          onItemsPerPageChange={noop}
          currentPage={3}
          onPageChange={onPageChange}
        />
      )
      await user.click(screen.getByText("Previous"))
      expect(onPageChange).toHaveBeenCalledWith(2)
    })

    it("calls onPageChange(currentPage + 1) when Next is clicked", async () => {
      const onPageChange = vi.fn()
      render(
        <PaginationControls
          totalPages={5}
          itemsPerPage={12}
          onItemsPerPageChange={noop}
          currentPage={3}
          onPageChange={onPageChange}
        />
      )
      await user.click(screen.getByText("Next"))
      expect(onPageChange).toHaveBeenCalledWith(4)
    })

    it("calls onPageChange(totalPages) when Last is clicked", async () => {
      const onPageChange = vi.fn()
      render(
        <PaginationControls
          totalPages={5}
          itemsPerPage={12}
          onItemsPerPageChange={noop}
          currentPage={3}
          onPageChange={onPageChange}
        />
      )
      await user.click(screen.getByText("Last"))
      expect(onPageChange).toHaveBeenCalledWith(5)
    })
  })

  describe("PageNumbers", () => {
    it("renders all pages when totalPages <= maxVisible (5)", () => {
      render(
        <PaginationControls
          totalPages={4}
          itemsPerPage={12}
          onItemsPerPageChange={noop}
          currentPage={2}
          onPageChange={noop}
        />
      )
      // Pages 1-4 should all appear as numbered buttons
      expect(screen.getAllByRole("button").some((b) => b.textContent === "1")).toBe(true)
      expect(screen.getAllByRole("button").some((b) => b.textContent === "4")).toBe(true)
    })

    it("shows start ellipsis when currentPage is far from start (startPage > 2)", () => {
      render(
        <PaginationControls
          totalPages={20}
          itemsPerPage={12}
          onItemsPerPageChange={noop}
          currentPage={10}
          onPageChange={noop}
        />
      )
      // Page 1 button + start ellipsis should appear
      expect(screen.getAllByRole("button").some((b) => b.textContent === "1")).toBe(true)
      const ellipses = screen.getAllByText("...")
      expect(ellipses.length).toBeGreaterThanOrEqual(1)
    })

    it("shows end ellipsis when currentPage is far from end (endPage < totalPages - 1)", () => {
      render(
        <PaginationControls
          totalPages={20}
          itemsPerPage={12}
          onItemsPerPageChange={noop}
          currentPage={1}
          onPageChange={noop}
        />
      )
      // Last page button + end ellipsis should appear
      expect(screen.getAllByRole("button").some((b) => b.textContent === "20")).toBe(true)
      expect(screen.getByText("...")).toBeInTheDocument()
    })

    it("shows page button adjacent to last without ellipsis when endPage === totalPages - 1", () => {
      // When endPage = totalPages - 1, we show the last page button but NOT the ellipsis
      render(
        <PaginationControls
          totalPages={6}
          itemsPerPage={12}
          onItemsPerPageChange={noop}
          currentPage={1}
          onPageChange={noop}
        />
      )
      // Page 6 (last) should appear; no end ellipsis since endPage(5) === totalPages(6) - 1
      expect(screen.getAllByRole("button").some((b) => b.textContent === "6")).toBe(true)
    })

    it("shows page 1 button (no ellipsis) when startPage === 2", () => {
      // startPage=2 means page 1 is shown without ellipsis before it
      render(
        <PaginationControls
          totalPages={10}
          itemsPerPage={12}
          onItemsPerPageChange={noop}
          currentPage={3}
          onPageChange={noop}
        />
      )
      expect(screen.getAllByRole("button").some((b) => b.textContent === "1")).toBe(true)
    })

    it("calls onPageChange(1) when the page-1 button inside PageNumbers is clicked (line 125)", async () => {
      // startPage > 1 when currentPage is far enough from start; page 1 is prepended as a
      // standalone button inside PageNumbers (distinct from the First nav button).
      const onPageChange = vi.fn()
      render(
        <PaginationControls
          totalPages={20}
          itemsPerPage={12}
          onItemsPerPageChange={noop}
          currentPage={10}
          onPageChange={onPageChange}
        />
      )
      // There are two buttons labelled "1": the "First" nav button and the page-1 button
      // inside PageNumbers. Find the one whose textContent is exactly "1".
      const pageOneButtons = screen.getAllByRole("button").filter((b) => b.textContent === "1")
      // Click the last one (the PageNumbers button; First nav button has label "First")
      await user.click(pageOneButtons[pageOneButtons.length - 1])
      expect(onPageChange).toHaveBeenCalledWith(1)
    })

    it("calls onPageChange(totalPages) when the last-page button inside PageNumbers is clicked (line 169)", async () => {
      // endPage < totalPages when currentPage is far enough from end; last page is appended
      // as a standalone button inside PageNumbers (distinct from the Last nav button).
      const onPageChange = vi.fn()
      render(
        <PaginationControls
          totalPages={20}
          itemsPerPage={12}
          onItemsPerPageChange={noop}
          currentPage={10}
          onPageChange={onPageChange}
        />
      )
      // Find buttons whose textContent is exactly "20"
      const lastPageButtons = screen.getAllByRole("button").filter((b) => b.textContent === "20")
      await user.click(lastPageButtons[lastPageButtons.length - 1])
      expect(onPageChange).toHaveBeenCalledWith(20)
    })

    it("calls onPageChange with page number when a page button is clicked", async () => {
      const onPageChange = vi.fn()
      render(
        <PaginationControls
          totalPages={5}
          itemsPerPage={12}
          onItemsPerPageChange={noop}
          currentPage={1}
          onPageChange={onPageChange}
        />
      )
      const pageThreeButton = screen.getAllByRole("button").find((b) => b.textContent === "3")
      expect(pageThreeButton).toBeDefined()
      await user.click(pageThreeButton!)
      expect(onPageChange).toHaveBeenCalledWith(3)
    })

    it("highlights the current page button", () => {
      render(
        <PaginationControls
          totalPages={5}
          itemsPerPage={12}
          onItemsPerPageChange={noop}
          currentPage={3}
          onPageChange={noop}
        />
      )
      const pageThreeButton = screen.getAllByRole("button").find((b) => b.textContent === "3")
      expect(pageThreeButton?.className).toContain("bg-blue-600")
    })
  })
})
