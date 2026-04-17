"use server"

import { createClient } from "@supabase/supabase-js"
import { unstable_cache, revalidateTag } from "next/cache"
import { requireAdmin } from "../auth"

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
): Promise<{ success?: string; error?: string }> {
  await requireAdmin()
  try {
    const serviceSupabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

    const { error } = await serviceSupabase.from("performers").update({ name }).eq("id", performerId)

    if (error) {
      console.error("Error updating performer:", error)
      return { error: "Failed to update performer" }
    }

    revalidateTag("performers", "max")
    return { success: "Performer updated successfully" }
  } catch (error) {
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
