import type React from "react"
import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import MobileFilterDialog from "@/components/mobile-filter-dialog"

// Mock Dialog components from shadcn/ui
// Always render all content - we're testing component logic, not Dialog behavior
vi.mock("@/components/ui/dialog", () => ({
  Dialog: ({ children }: { children: React.ReactNode }) => <div data-testid="dialog">{children}</div>,
  DialogContent: ({ children }: { children: React.ReactNode }) => <div data-testid="dialog-content">{children}</div>,
  DialogHeader: ({ children }: { children: React.ReactNode }) => <div data-testid="dialog-header">{children}</div>,
  DialogTitle: ({ children }: { children: React.ReactNode }) => <h2 data-testid="dialog-title">{children}</h2>,
  DialogDescription: () => null,
  DialogTrigger: ({ children }: { children: React.ReactNode }) => <div data-testid="dialog-trigger">{children}</div>,
}))

// Mock Button component
vi.mock("@/components/ui/button", () => ({
  Button: ({ children, onClick, disabled, className }: { children: React.ReactNode; onClick?: () => void; disabled?: boolean; className?: string }) => (
    <button onClick={onClick} disabled={disabled} className={className} data-testid="button">
      {children}
    </button>
  ),
}))

// Mock lucide-react icons
vi.mock("lucide-react", () => ({
  Filter: () => <span data-testid="filter-icon">Filter</span>,
  ChevronDown: () => <span data-testid="chevron-down">ChevronDown</span>,
  ChevronUp: () => <span data-testid="chevron-up">ChevronUp</span>,
}))

// Mock CategoryFilter component
vi.mock("@/components/category-filter", () => ({
  default: ({ categories, curriculums, onCategoryToggle, onCurriculumToggle }: {
    categories?: { id: string; name: string }[];
    curriculums?: { id: string; name: string }[];
    onCategoryToggle: (id: string) => void;
    onCurriculumToggle: (id: string) => void;
  }) => (
    <div data-testid="category-filter">
      <div data-testid="categories-section">
        {categories?.map((cat) => (
          <button key={cat.id} onClick={() => onCategoryToggle(cat.id)} data-testid={`category-${cat.id}`}>
            {cat.name}
          </button>
        ))}
      </div>
      <div data-testid="curriculums-section">
        {curriculums?.map((curr) => (
          <button key={curr.id} onClick={() => onCurriculumToggle(curr.id)} data-testid={`curriculum-${curr.id}`}>
            {curr.name}
          </button>
        ))}
      </div>
    </div>
  ),
}))

describe("MobileFilterDialog", () => {
  const mockCategories = [
    { id: "cat-1", name: "Bo", color: "#ff0000", description: "Staff weapon" },
    { id: "cat-2", name: "Sai", color: "#00ff00", description: "Trident weapon" },
  ]

  const mockCurriculums = [
    { id: "curr-1", name: "10.Kyu", color: "#ffffff", display_order: 1, description: "White belt" },
    { id: "curr-2", name: "9.Kyu", color: "#ffff00", display_order: 2, description: "Yellow belt" },
  ]

  const mockPerformers = [
    { id: "perf-1", name: "John Doe" },
    { id: "perf-2", name: "Jane Smith" },
  ]

  const defaultProps = {
    showMobileFilters: true,
    setShowMobileFilters: vi.fn(),
    categories: mockCategories,
    recordedValues: ["2023", "2024"],
    performers: mockPerformers,
    selectedCategories: [],
    onCategoryToggle: vi.fn(),
    videoCount: 10,
    curriculums: mockCurriculums,
    selectedCurriculums: [],
    onCurriculumToggle: vi.fn(),
    filterMode: "OR" as const,
    onFilterModeChange: vi.fn(),
    onApplyFilters: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe("Rendering", () => {
    it("should render the filter button trigger", () => {
      render(<MobileFilterDialog {...defaultProps} showMobileFilters={false} />)

      expect(screen.getByTestId("dialog-trigger")).toBeInTheDocument()
      expect(screen.getByTestId("filter-icon")).toBeInTheDocument()
    })

    it("should show dialog content when open", () => {
      render(<MobileFilterDialog {...defaultProps} />)

      expect(screen.getByTestId("dialog")).toBeInTheDocument()
      expect(screen.getByTestId("dialog-content")).toBeInTheDocument()
      expect(screen.getByTestId("dialog-title")).toHaveTextContent("Filter Videos")
    })



    it("should display filter count in button when filters are selected", () => {
      render(
        <MobileFilterDialog
          {...defaultProps}
          showMobileFilters={false}
          selectedCategories={["cat-1"]}
          selectedCurriculums={["curr-1"]}
        />,
      )

      // Query within dialog-trigger to get the trigger button specifically
      const dialogTrigger = screen.getByTestId("dialog-trigger")
      const triggerButton = within(dialogTrigger).getByRole("button")
      expect(triggerButton).toHaveTextContent("2")
    })

    it("should not display filter count when no filters are selected", () => {
      render(<MobileFilterDialog {...defaultProps} showMobileFilters={false} />)

      // Query within dialog-trigger to avoid matching "Apply Filters" button
      const dialogTrigger = screen.getByTestId("dialog-trigger")
      const triggerButton = within(dialogTrigger).getByRole("button")
      expect(triggerButton).toBeInTheDocument()
      expect(triggerButton.textContent).not.toMatch(/\d/)
    })
  })

  describe("Filter Mode Toggle", () => {
    it("should show filter mode toggle when multiple filters are selected", () => {
      render(
        <MobileFilterDialog
          {...defaultProps}
          selectedCategories={["cat-1"]}
          selectedCurriculums={["curr-1"]}
        />,
      )

      // Filter mode toggle appears when 2+ filters selected
      expect(screen.getByText(/Filter mode/i)).toBeInTheDocument()
    })

    it("should call onFilterModeChange when toggling filter mode", async () => {
      const user = userEvent.setup({ delay: null })
      render(
        <MobileFilterDialog
          {...defaultProps}
          selectedCategories={["cat-1"]}
          selectedCurriculums={["curr-1"]}
        />,
      )

      const andButton = screen.getByText("AND")
      await user.click(andButton)

      expect(defaultProps.onFilterModeChange).toHaveBeenCalledWith("AND")
    })
  })

  describe("Apply Filters", () => {
    it("should call setShowMobileFilters when Apply Filters button is clicked", async () => {
      const user = userEvent.setup({ delay: null })
      render(<MobileFilterDialog {...defaultProps} />)

      const applyButton = screen.getByText("Apply Filters")
      await user.click(applyButton)

      expect(defaultProps.setShowMobileFilters).toHaveBeenCalledWith(false)
    })

    it("should call onApplyFilters when Apply Filters button is clicked", async () => {
      const user = userEvent.setup({ delay: null })
      render(<MobileFilterDialog {...defaultProps} />)

      const applyButton = screen.getByText("Apply Filters")
      await user.click(applyButton)

      expect(defaultProps.onApplyFilters).toHaveBeenCalled()
    })
  })

  describe("Category Selection", () => {
    it("should render CategoryFilter component with categories", () => {
      render(<MobileFilterDialog {...defaultProps} />)

      expect(screen.getByTestId("category-filter")).toBeInTheDocument()
      expect(screen.getByText("Bo")).toBeInTheDocument()
      expect(screen.getByText("Sai")).toBeInTheDocument()
    })

    it("should call onCategoryToggle when category is clicked", async () => {
      const user = userEvent.setup({ delay: null })
      render(<MobileFilterDialog {...defaultProps} />)

      const categoryButton = screen.getByTestId("category-cat-1")
      await user.click(categoryButton)

      expect(defaultProps.onCategoryToggle).toHaveBeenCalledWith("cat-1")
    })
  })

  describe("Curriculum Selection", () => {
    it("should render CategoryFilter component with curriculums", () => {
      render(<MobileFilterDialog {...defaultProps} />)

      expect(screen.getByTestId("curriculums-section")).toBeInTheDocument()
      expect(screen.getByText("10.Kyu")).toBeInTheDocument()
      expect(screen.getByText("9.Kyu")).toBeInTheDocument()
    })

    it("should call onCurriculumToggle when curriculum is clicked", async () => {
      const user = userEvent.setup({ delay: null })
      render(<MobileFilterDialog {...defaultProps} />)

      const curriculumButton = screen.getByTestId("curriculum-curr-1")
      await user.click(curriculumButton)

      expect(defaultProps.onCurriculumToggle).toHaveBeenCalledWith("curr-1")
    })
  })
})
