import { createClient, getServerUser } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import AdminHeader from "@/components/admin-header"
import { buildAdminHeaderUser } from "@/lib/utils/admin-header-user"

export default async function AdminLayout({ children }: { readonly children: React.ReactNode }) {
  const user = await getServerUser()

  if (!user) {
    redirect("/auth/login")
  }

  const supabase = await createClient()
  const { data: userProfile } = await supabase
    .from("users")
    .select("is_approved, full_name, email, profile_image_url, role")
    .eq("id", user.id)
    .single()

  if (!userProfile?.is_approved || userProfile.role !== "Admin") {
    redirect("/")
  }

  const adminUser = buildAdminHeaderUser(user, userProfile)

  return (
    <div className="min-h-screen bg-gray-900">
      <AdminHeader user={adminUser} />
      <div className="container mx-auto px-4 py-8">{children}</div>
    </div>
  )
}
