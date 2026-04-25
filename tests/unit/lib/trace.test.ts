import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"

// trace.ts captures `isServer = globalThis.window === undefined` at module load time.
// We use vi.resetModules() + dynamic import to re-evaluate for each environment.

vi.mock("@/lib/trace-logger", () => ({
  serverTrace: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}))

global.fetch = vi.fn()

describe("lib/trace.ts", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(global.fetch).mockResolvedValue({ ok: true } as Response)
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.resetModules()
  })

  describe("client-side (window defined)", () => {
    it("trace.debug posts to /api/trace", async () => {
      // jsdom has window — isServer = false
      const { trace } = await import("@/lib/trace")
      trace.debug("test debug")
      await new Promise((r) => setTimeout(r, 0))
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/trace",
        expect.objectContaining({ method: "POST" })
      )
      const body = JSON.parse((vi.mocked(global.fetch).mock.calls[0][1] as RequestInit).body as string)
      expect(body.level).toBe("debug")
      expect(body.message).toBe("test debug")
      expect(body.isClient).toBe(true)
    })

    it("trace.info posts with info level and payload", async () => {
      const { trace } = await import("@/lib/trace")
      trace.info("test info", { payload: { key: "val" } })
      await new Promise((r) => setTimeout(r, 0))
      const body = JSON.parse((vi.mocked(global.fetch).mock.calls[0][1] as RequestInit).body as string)
      expect(body.level).toBe("info")
      expect(body.options.payload).toEqual({ key: "val" })
    })

    it("trace.warn posts with warn level", async () => {
      const { trace } = await import("@/lib/trace")
      trace.warn("test warn")
      await new Promise((r) => setTimeout(r, 0))
      const body = JSON.parse((vi.mocked(global.fetch).mock.calls[0][1] as RequestInit).body as string)
      expect(body.level).toBe("warn")
    })

    it("trace.error posts with error level", async () => {
      const { trace } = await import("@/lib/trace")
      trace.error("test error")
      await new Promise((r) => setTimeout(r, 0))
      const body = JSON.parse((vi.mocked(global.fetch).mock.calls[0][1] as RequestInit).body as string)
      expect(body.level).toBe("error")
    })

    it("silently ignores fetch rejection", async () => {
      vi.mocked(global.fetch).mockRejectedValue(new Error("network error"))
      const { trace } = await import("@/lib/trace")
      expect(() => trace.debug("silent fail")).not.toThrow()
      await new Promise((r) => setTimeout(r, 0))
    })

    it("includes sourceFile and sourceLine in post body", async () => {
      const { trace } = await import("@/lib/trace")
      trace.debug("location test")
      await new Promise((r) => setTimeout(r, 0))
      const body = JSON.parse((vi.mocked(global.fetch).mock.calls[0][1] as RequestInit).body as string)
      expect(body).toHaveProperty("sourceFile")
      expect(body).toHaveProperty("sourceLine")
    })

    it("logs to console in development mode", async () => {
      vi.stubEnv("NODE_ENV", "development")
      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {})
      const { trace } = await import("@/lib/trace")
      trace.info("dev log")
      await new Promise((r) => setTimeout(r, 0))
      expect(consoleSpy).toHaveBeenCalled()
      vi.unstubAllEnvs()
    })

    it("does not log to console outside development mode", async () => {
      vi.stubEnv("NODE_ENV", "production")
      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {})
      const { trace } = await import("@/lib/trace")
      trace.info("prod log")
      // clientTrace has no await before the console decision — check is synchronous
      expect(consoleSpy).not.toHaveBeenCalled()
      vi.unstubAllEnvs()
    })
  })

})
