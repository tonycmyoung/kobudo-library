import { describe, it, expect, vi, beforeEach } from "vitest"

vi.mock("stripe", () => {
  class MockStripe {
    customers = { list: vi.fn() }
    subscriptions = { list: vi.fn() }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    constructor(key: string) {}
  }
  return { default: MockStripe }
})

describe("lib/stripe.ts", () => {
  beforeEach(() => {
    vi.resetModules()
    delete process.env.STRIPE_SECRET_KEY
  })

  describe("getStripe()", () => {
    it("throws when STRIPE_SECRET_KEY is not set", async () => {
      const { getStripe } = await import("@/lib/stripe")
      expect(() => getStripe()).toThrow("STRIPE_SECRET_KEY environment variable is not set")
    })

    it("creates and returns a Stripe instance when key is set", async () => {
      process.env.STRIPE_SECRET_KEY = "sk_test_fake"
      const { getStripe } = await import("@/lib/stripe")
      const instance = getStripe()
      expect(instance).toBeDefined()
    })

    it("reuses the same instance on subsequent calls (singleton)", async () => {
      process.env.STRIPE_SECRET_KEY = "sk_test_fake"
      const { getStripe } = await import("@/lib/stripe")
      const a = getStripe()
      const b = getStripe()
      expect(a).toBe(b)
    })
  })

  describe("stripe proxy", () => {
    it("proxies property access through getStripe()", async () => {
      process.env.STRIPE_SECRET_KEY = "sk_test_fake"
      const { stripe } = await import("@/lib/stripe")
      // Accessing a property should delegate to the Stripe instance
      expect(stripe.customers).toBeDefined()
    })

    it("throws when proxy is accessed without STRIPE_SECRET_KEY", async () => {
      const { stripe } = await import("@/lib/stripe")
      expect(() => stripe.customers).toThrow("STRIPE_SECRET_KEY environment variable is not set")
    })
  })
})
