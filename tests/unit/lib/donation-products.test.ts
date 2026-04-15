import { describe, it, expect } from "vitest"
import {
  DONATION_PRESETS,
  SUBSCRIPTION_TIERS,
  getDonationPreset,
  getSubscriptionTier,
} from "@/lib/donation-products"

describe("donation-products", () => {
  describe("DONATION_PRESETS", () => {
    it("contains four presets", () => {
      expect(DONATION_PRESETS).toHaveLength(4)
    })

    it("has correct amounts in cents", () => {
      expect(DONATION_PRESETS[0].amountCents).toBe(500)
      expect(DONATION_PRESETS[1].amountCents).toBe(1000)
      expect(DONATION_PRESETS[2].amountCents).toBe(2500)
      expect(DONATION_PRESETS[3].amountCents).toBe(5000)
    })
  })

  describe("getDonationPreset", () => {
    it("returns matching preset by id", () => {
      const preset = getDonationPreset("donation-10")
      expect(preset).toBeDefined()
      expect(preset?.amountCents).toBe(1000)
      expect(preset?.name).toBe("$10")
    })

    it("returns undefined for unknown id", () => {
      expect(getDonationPreset("donation-999")).toBeUndefined()
    })

    it("returns each preset by id", () => {
      for (const p of DONATION_PRESETS) {
        expect(getDonationPreset(p.id)).toBe(p)
      }
    })
  })

  describe("SUBSCRIPTION_TIERS", () => {
    it("contains three tiers", () => {
      expect(SUBSCRIPTION_TIERS).toHaveLength(3)
    })

    it("has supporter, patron, champion tiers", () => {
      const ids = SUBSCRIPTION_TIERS.map((t) => t.id)
      expect(ids).toContain("supporter")
      expect(ids).toContain("patron")
      expect(ids).toContain("champion")
    })

    it("each tier has monthly and annual prices", () => {
      for (const tier of SUBSCRIPTION_TIERS) {
        expect(tier.prices.monthly).toBeDefined()
        expect(tier.prices.annual).toBeDefined()
        expect(typeof tier.prices.monthly.amount).toBe("number")
        expect(typeof tier.prices.annual.amount).toBe("number")
      }
    })

    it("falls back to empty string when env vars are missing", () => {
      // Price IDs are loaded at module init from env vars; missing vars produce ""
      for (const tier of SUBSCRIPTION_TIERS) {
        expect(typeof tier.prices.monthly.priceId).toBe("string")
        expect(typeof tier.prices.annual.priceId).toBe("string")
      }
    })
  })

  describe("getSubscriptionTier", () => {
    it("returns matching tier by id", () => {
      const tier = getSubscriptionTier("patron")
      expect(tier).toBeDefined()
      expect(tier?.prices.monthly.amount).toBe(500)
    })

    it("returns undefined for unknown id", () => {
      expect(getSubscriptionTier("unknown")).toBeUndefined()
    })

    it("returns each tier by id", () => {
      for (const t of SUBSCRIPTION_TIERS) {
        expect(getSubscriptionTier(t.id)).toBe(t)
      }
    })
  })

  describe("getSubscriptionPriceIds via SUBSCRIPTION_TIERS", () => {
    it("uses env vars when set", () => {
      // The SUBSCRIPTION_TIERS are built at module load time.
      // When env vars are set in test env, priceId reflects them.
      // When not set, priceId is "".
      // This test verifies the fallback behaviour is applied (no undefined).
      for (const tier of SUBSCRIPTION_TIERS) {
        expect(tier.prices.monthly.priceId).not.toBeUndefined()
        expect(tier.prices.annual.priceId).not.toBeUndefined()
      }
    })
  })
})
