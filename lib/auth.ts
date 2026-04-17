import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

/**
 * Asserts the current request is made by an Admin.
 * Throws "Unauthorized" if not — safe to call at the top of any admin server action.
 * Defense-in-depth: middleware already blocks non-admins, but this prevents any
 * middleware misconfiguration from exposing server actions directly.
 */
export async function requireAdmin(): Promise<void> {
  const user = await getCurrentUser()
  if (user?.role !== "Admin") {
    throw new Error("Unauthorized")
  }
}

export async function getCurrentUser() {
  try {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
            } catch {
              // The `setAll` method was called from a Server Component.
            }
          },
        },
      },
    )

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return null
    }

    // Get user profile data
    const { data: profile, error: profileError } = await supabase.from("users").select("*").eq("id", user.id).single()

    if (profileError) {
      console.error("Error fetching user profile:", profileError)
      return null
    }

    return {
      ...user,
      ...profile,
    }
  } catch (error) {
    console.error("Error in getCurrentUser:", error)
    return null
  }
}
