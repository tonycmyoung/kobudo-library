import { describe, it, expect, vi } from "vitest"
import { createBrowserClient } from "@supabase/ssr"
import { createClient, supabase } from "@/lib/supabase/client"

// Override the global setup.ts mock so the real module exports (supabase singleton) are available.
vi.mock("@/lib/supabase/client", async (importOriginal) => {
  return await importOriginal()
})

// Control the underlying Supabase SSR client factory.
vi.mock("@supabase/ssr", () => ({
  createBrowserClient: vi.fn(() => ({
    auth: { getUser: vi.fn(), getSession: vi.fn() },
    from: vi.fn(),
    storage: { from: vi.fn() },
    rpc: vi.fn(),
  })),
}))

describe("lib/supabase/client.ts", () => {
  describe("createClient()", () => {
    it("calls createBrowserClient with env vars", () => {
      vi.mocked(createBrowserClient).mockClear()
      createClient()
      expect(vi.mocked(createBrowserClient)).toHaveBeenCalledWith(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      )
    })

    it("returns a client with auth and from defined", () => {
      const client = createClient()
      expect(client).toBeDefined()
      expect(client.auth).toBeDefined()
      expect(client.from).toBeDefined()
    })
  })

  describe("supabase singleton", () => {
    it("supabase.auth returns the client auth property", () => {
      expect(supabase.auth).toBeDefined()
    })

    it("supabase.from returns the client from method", () => {
      expect(typeof supabase.from).toBe("function")
    })

    it("supabase.storage returns the client storage property", () => {
      expect(supabase.storage).toBeDefined()
    })

    it("supabase.rpc returns the client rpc method", () => {
      expect(typeof supabase.rpc).toBe("function")
    })

    it("accesses all four getters without throwing", () => {
      expect(() => {
        const _a = supabase.auth
        const _f = supabase.from
        const _s = supabase.storage
        const _r = supabase.rpc
      }).not.toThrow()
    })
  })
})
