"use server"

import { createClient } from "@supabase/supabase-js"
import { unstable_cache, revalidateTag } from "next/cache"
import { requireAdmin } from "../auth"
import { serverTrace } from "../trace-logger"

export const getPerformers = unstable_cache(
  async (): Promise<Array<{ id: string; name: string; bio: string | null }>> => {
    try {
      const serviceSupabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
      const { data, error } = await serviceSupabase.from("performers").select("id, name, bio").order("name")
      if (error) {
        console.error("Error fetching performers:", error)
        return []
      }
      return data || []
    } catch (error) {
      console.error("Error in getPerformers:", error)
      return []
    }
  },
  ["performers"],
  { tags: ["performers"] },
)

export async function addPerformer(
  nameOrFormData: string | FormData,
  _formData?: FormData,
): Promise<{ success?: string; error?: string }> {
  let name: string

  // Handle both direct string call and FormData call
  if (typeof nameOrFormData === "string") {
    name = nameOrFormData
  } else {
    name = nameOrFormData.get("name") as string
  }

  if (!name) {
    return { error: "Name is required" }
  }

  await requireAdmin()
  try {
    const serviceSupabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

    const { error } = await serviceSupabase.from("performers").insert({
      name,
    })

    if (error) {
      console.error("Error adding performer:", error)
      return { error: "Failed to add performer" }
    }

    revalidateTag("performers", "max")
    return { success: "Performer added successfully" }
  } catch (error) {
    console.error("Error in addPerformer:", error)
    return { error: "Failed to add performer" }
  }
}

export async function updatePerformer(
  performerId: string,
  name: string,
  bio: string,
): Promise<{ success?: string; error?: string }> {
  serverTrace.debug("updatePerformer: start", { category: "performers", payload: { performerId, name } })
  try {
    await requireAdmin()
  } catch (authError) {
    serverTrace.error("updatePerformer: requireAdmin failed", { category: "performers", payload: { error: String(authError) } })
    throw authError
  }
  serverTrace.debug("updatePerformer: requireAdmin passed", { category: "performers" })
  try {
    const serviceSupabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

    const { error } = await serviceSupabase.from("performers").update({ name, bio }).eq("id", performerId)

    if (error) {
      serverTrace.error("updatePerformer: db error", { category: "performers", payload: { error } })
      console.error("Error updating performer:", error)
      return { error: "Failed to update performer" }
    }

    revalidateTag("performers", "max")
    serverTrace.debug("updatePerformer: success", { category: "performers", payload: { performerId } })
    return { success: "Performer updated successfully" }
  } catch (error) {
    serverTrace.error("updatePerformer: exception", { category: "performers", payload: { error: String(error) } })
    console.error("Error in updatePerformer:", error)
    return { error: "Failed to update performer" }
  }
}

export async function deletePerformer(performerId: string): Promise<{ success?: string; error?: string }> {
  await requireAdmin()
  try {
    const serviceSupabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

    const { error } = await serviceSupabase.from("performers").delete().eq("id", performerId)

    if (error) {
      console.error("Error deleting performer:", error)
      return { error: "Failed to delete performer" }
    }

    revalidateTag("performers", "max")
    return { success: "Performer deleted successfully" }
  } catch (error) {
    console.error("Error in deletePerformer:", error)
    return { error: "Failed to delete performer" }
  }
}
