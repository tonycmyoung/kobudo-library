"use client"

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { render, screen, act, fireEvent } from "@testing-library/react"
import { LoadingProvider, useLoading } from "@/components/loading-provider"
import { usePathname } from "next/navigation"

vi.mock("next/navigation", () => ({
  usePathname: vi.fn(),
}))

function ContextReader() {
  const { isLoading, setLoading } = useLoading()
  return (
    <>
      <span data-testid="loading-state">{isLoading ? "loading" : "idle"}</span>
      <button onClick={() => setLoading(false)}>Stop Loading</button>
      <button onClick={() => setLoading(true)}>Start Loading</button>
    </>
  )
}

describe("LoadingProvider", () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.mocked(usePathname).mockReturnValue("/")
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.useRealTimers()
  })

  it("should render children", () => {
    render(
      <LoadingProvider>
        <div>Test Content</div>
      </LoadingProvider>,
    )

    expect(screen.getByText("Test Content")).toBeInTheDocument()
  })

  it("should provide loading context", () => {
    function TestComponent() {
      const { isLoading } = useLoading()
      return <div>Loading: {isLoading ? "true" : "false"}</div>
    }

    render(
      <LoadingProvider>
        <TestComponent />
      </LoadingProvider>,
    )

    expect(screen.getByText("Loading: false")).toBeInTheDocument()
  })

  it("should throw error when useLoading is used outside provider", () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {})

    expect(() => {
      function TestComponent() {
        useLoading()
        return null
      }
      render(<TestComponent />)
    }).toThrow("useLoading must be used within a LoadingProvider")

    consoleSpy.mockRestore()
  })

  describe("setLoading via context", () => {
    it("should allow setting loading state to true via context", () => {
      render(
        <LoadingProvider>
          <ContextReader />
        </LoadingProvider>,
      )

      expect(screen.getByTestId("loading-state")).toHaveTextContent("idle")

      act(() => {
        fireEvent.click(screen.getByText("Start Loading"))
      })

      expect(screen.getByTestId("loading-state")).toHaveTextContent("loading")
    })

    it("should allow setting loading state to false via context", () => {
      render(
        <LoadingProvider>
          <ContextReader />
        </LoadingProvider>,
      )

      act(() => {
        fireEvent.click(screen.getByText("Start Loading"))
      })
      expect(screen.getByTestId("loading-state")).toHaveTextContent("loading")

      act(() => {
        fireEvent.click(screen.getByText("Stop Loading"))
      })

      expect(screen.getByTestId("loading-state")).toHaveTextContent("idle")
    })

    it("should not show spinner when loading is set via context (no click path)", () => {
      render(
        <LoadingProvider>
          <ContextReader />
        </LoadingProvider>,
      )

      act(() => {
        fireEvent.click(screen.getByText("Start Loading"))
      })

      // Spinner only triggered by the click handler's 200ms timer, not by setLoading directly
      expect(screen.queryByText("Loading...")).toBeNull()
    })
  })

  describe("Click trigger conditions", () => {
    it("should trigger loading for an internal same-origin link", () => {
      render(
        <LoadingProvider>
          <ContextReader />
          <a href="/internal-page">Internal</a>
        </LoadingProvider>,
      )

      const link = screen.getByText("Internal")
      link.addEventListener("click", (e) => e.preventDefault(), { once: true })
      act(() => {
        fireEvent.click(link)
      })

      expect(screen.getByTestId("loading-state")).toHaveTextContent("loading")
    })

    it("should not trigger loading for mailto links", () => {
      render(
        <LoadingProvider>
          <ContextReader />
          <a href="mailto:test@example.com">Email</a>
        </LoadingProvider>,
      )

      act(() => {
        fireEvent.click(screen.getByText("Email"))
      })

      expect(screen.getByTestId("loading-state")).toHaveTextContent("idle")
    })

    it("should not trigger loading for tel links", () => {
      render(
        <LoadingProvider>
          <ContextReader />
          <a href="tel:+61400000000">Call</a>
        </LoadingProvider>,
      )

      act(() => {
        fireEvent.click(screen.getByText("Call"))
      })

      expect(screen.getByTestId("loading-state")).toHaveTextContent("idle")
    })

    it("should not trigger loading for hash links", () => {
      render(
        <LoadingProvider>
          <ContextReader />
          <a href="#section">Jump</a>
        </LoadingProvider>,
      )

      act(() => {
        fireEvent.click(screen.getByText("Jump"))
      })

      expect(screen.getByTestId("loading-state")).toHaveTextContent("idle")
    })

    it("should not trigger loading for target=_blank links", () => {
      render(
        <LoadingProvider>
          <ContextReader />
          <a href="/page" target="_blank" rel="noreferrer">Open</a>
        </LoadingProvider>,
      )

      const link = screen.getByText("Open")
      link.addEventListener("click", (e) => e.preventDefault(), { once: true })
      act(() => {
        fireEvent.click(link)
      })

      expect(screen.getByTestId("loading-state")).toHaveTextContent("idle")
    })

    it("should not trigger loading when clicking inside a form input", () => {
      render(
        <LoadingProvider>
          <ContextReader />
          <input type="text" placeholder="Search" />
        </LoadingProvider>,
      )

      act(() => {
        fireEvent.click(screen.getByPlaceholderText("Search"))
      })

      expect(screen.getByTestId("loading-state")).toHaveTextContent("idle")
    })

    it("should not trigger loading for elements marked with data-no-loading", () => {
      render(
        <LoadingProvider>
          <ContextReader />
          <div data-no-loading>
            <button>No Load Button</button>
          </div>
        </LoadingProvider>,
      )

      act(() => {
        fireEvent.click(screen.getByText("No Load Button"))
      })

      expect(screen.getByTestId("loading-state")).toHaveTextContent("idle")
    })

    it("should trigger loading for elements marked with data-navigate", () => {
      render(
        <LoadingProvider>
          <ContextReader />
          <button data-navigate>Nav Button</button>
        </LoadingProvider>,
      )

      act(() => {
        fireEvent.click(screen.getByText("Nav Button"))
      })

      expect(screen.getByTestId("loading-state")).toHaveTextContent("loading")
    })
  })

  describe("isInternalNavigation with malformed URL (catch branch)", () => {
    it("should not trigger loading when link href cannot be parsed as a URL", () => {
      // jsdom resolves relative hrefs to absolute URLs on real <a> elements,
      // so we use a span with an onclick that dispatches a click on a synthetic
      // element whose href property is an unparseable string.
      render(
        <LoadingProvider>
          <ContextReader />
        </LoadingProvider>,
      )

      // Create a detached anchor whose .href property is a non-URL string so
      // that new URL(href) throws, exercising the catch-return-false branch.
      const fakeAnchor = document.createElement("a")
      Object.defineProperty(fakeAnchor, "href", { value: "not-a-valid-url:::bad", configurable: true })
      Object.defineProperty(fakeAnchor, "getAttribute", { value: () => null, configurable: true })
      Object.defineProperty(fakeAnchor, "target", { value: "", configurable: true })
      document.body.appendChild(fakeAnchor)

      act(() => {
        fakeAnchor.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }))
      })

      expect(screen.getByTestId("loading-state")).toHaveTextContent("idle")

      document.body.removeChild(fakeAnchor)
    })
  })

  describe("showSpinnerIfLoading and clearLoadingState timers", () => {
    it("should show spinner overlay after 200ms when loading is still active", () => {
      render(
        <LoadingProvider>
          <ContextReader />
          <a href="/page-a">Go</a>
        </LoadingProvider>,
      )

      // Flush the 0ms mount-reset timer (from the pathname useEffect) before clicking,
      // so it doesn't fire mid-test and override the loading state set by the click.
      act(() => {
        vi.advanceTimersByTime(0)
      })

      const link = screen.getByText("Go")
      link.addEventListener("click", (e) => e.preventDefault(), { once: true })
      act(() => {
        fireEvent.click(link)
      })

      expect(screen.queryByText("Loading...")).toBeNull()

      act(() => {
        vi.advanceTimersByTime(200)
      })

      expect(screen.getByText("Loading...")).toBeInTheDocument()
    })

    it("should auto-clear loading state after 10 seconds fallback", () => {
      render(
        <LoadingProvider>
          <ContextReader />
          <a href="/page-b">Go</a>
        </LoadingProvider>,
      )

      const link = screen.getByText("Go")
      link.addEventListener("click", (e) => e.preventDefault(), { once: true })
      act(() => {
        fireEvent.click(link)
      })

      expect(screen.getByTestId("loading-state")).toHaveTextContent("loading")

      act(() => {
        vi.advanceTimersByTime(10000)
      })

      expect(screen.getByTestId("loading-state")).toHaveTextContent("idle")
    })
  })

  describe("Pathname change resets loading", () => {
    it("should clear loading state when pathname changes", () => {
      vi.mocked(usePathname).mockReturnValue("/old")

      const { rerender } = render(
        <LoadingProvider>
          <ContextReader />
          <a href="/new">Navigate</a>
        </LoadingProvider>,
      )

      const link = screen.getByText("Navigate")
      link.addEventListener("click", (e) => e.preventDefault(), { once: true })
      act(() => {
        fireEvent.click(link)
      })
      expect(screen.getByTestId("loading-state")).toHaveTextContent("loading")

      // Simulate navigation completing — pathname changes
      vi.mocked(usePathname).mockReturnValue("/new")
      rerender(
        <LoadingProvider>
          <ContextReader />
          <a href="/new">Navigate</a>
        </LoadingProvider>,
      )

      // The useEffect defers the reset via setTimeout(fn, 0)
      act(() => {
        vi.advanceTimersByTime(0)
      })

      expect(screen.getByTestId("loading-state")).toHaveTextContent("idle")
    })
  })
})
