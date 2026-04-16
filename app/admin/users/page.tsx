import UserManagement from "@/components/user-management"

export default function AdminUsersPage() {
  return (
    <>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">User Management</h1>
        <p className="text-gray-300">Manage user accounts and permissions</p>
      </div>
      <UserManagement />
    </>
  )
}
