// @vitest-environment node
// Server-side trace tests run in Node (window === undefined), so isServer = true.
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"

vi.mock("@/lib/trace-logger", () => ({
  serverTrace: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}))

describe("lib/trace.ts — server-side (window undefined)", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.resetModules()
  })

  afterEach(() => {
    vi.resetModules()
  })

  it("calls serverTrace.debug on server", async () => {
    const { trace } = await import("@/lib/trace")
    const { serverTrace } = await import("@/lib/trace-logger")
    trace.debug("server debug")
    await new Promise((r) => setTimeout(r, 0))
    expect(serverTrace.debug).toHaveBeenCalledWith("server debug", {})
  })

  it("calls serverTrace.info on server", async () => {
    const { trace } = await import("@/lib/trace")
    const { serverTrace } = await import("@/lib/trace-logger")
    trace.info("server info")
    await new Promise((r) => setTimeout(r, 0))
    expect(serverTrace.info).toHaveBeenCalledWith("server info", {})
  })

  it("calls serverTrace.warn on server", async () => {
    const { trace } = await import("@/lib/trace")
    const { serverTrace } = await import("@/lib/trace-logger")
    trace.warn("server warn")
    await new Promise((r) => setTimeout(r, 0))
    expect(serverTrace.warn).toHaveBeenCalledWith("server warn", {})
  })

  it("calls serverTrace.error on server", async () => {
    const { trace } = await import("@/lib/trace")
    const { serverTrace } = await import("@/lib/trace-logger")
    trace.error("server error")
    await new Promise((r) => setTimeout(r, 0))
    expect(serverTrace.error).toHaveBeenCalledWith("server error", {})
  })
})
