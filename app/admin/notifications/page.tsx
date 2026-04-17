import AdminNotificationManagement from "@/components/admin-notification-management"

export default function AdminNotificationsPage() {
  return (
    <>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Notification Management</h1>
        <p className="text-gray-300">Send messages to users and manage all notifications</p>
      </div>
      <AdminNotificationManagement />
    </>
  )
}
