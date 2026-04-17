// Configure React to support act() in tests - MUST be before any React imports
globalThis.IS_REACT_ACT_ENVIRONMENT = true

import "@testing-library/jest-dom"
import { afterEach, beforeEach, vi } from "vitest"
import { cleanup } from "@testing-library/react"

// Spy on console.error so individual tests can assert on expected errors with
// expect(console.error).toHaveBeenCalledWith(...). Does NOT suppress output —
// real errors remain visible. Tests that intentionally trigger errors and want
// clean output should mock console.error locally within that test.
beforeEach(() => {
  vi.spyOn(console, "error")
})

// Cleanup after each test — restoreAllMocks cleans up the global console.error spy above
// as well as any additional spies created within individual tests.
// useRealTimers ensures fake timers from one test file cannot leak into another when
// worker threads are reused across files (vitest maxWorkers > 1).
afterEach(() => {
  cleanup()
  localStorage.clear()
  vi.restoreAllMocks()
  vi.useRealTimers()
})

// Mock Next.js modules
// eslint-disable-next-line @typescript-eslint/no-require-imports
vi.mock("next/navigation", () => require("./mocks/next-navigation"))
// Prevent jsdom navigation errors when tests click <Link> elements.
// Per-file vi.mock("next/link", ...) calls override this where needed.
vi.mock("next/link", async () => {
  const { default: MockLink } = await import("./mocks/next-link")
  return { default: MockLink }
})

// Mock Supabase - will be customized per test
vi.mock("@/lib/supabase/client", () => ({
  createClient: vi.fn(),
}))

const testEnv = {
  NEXT_PUBLIC_SUPABASE_URL: "https://test.supabase.co",
  NEXT_PUBLIC_SUPABASE_ANON_KEY: "test-anon-key",
  SUPABASE_URL: "https://test.supabase.co",
  SUPABASE_ANON_KEY: "test-anon-key",
  SUPABASE_SERVICE_ROLE_KEY: "test-service-role-key",
}

// Only set if not already defined
Object.entries(testEnv).forEach(([key, value]) => {
  if (!process.env[key]) {
    process.env[key] = value
  }
})
