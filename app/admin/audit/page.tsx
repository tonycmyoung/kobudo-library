import AuditLogDashboard from "@/components/audit-log-dashboard"

export default function AdminAuditPage() {
  return (
    <>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Audit Log</h1>
        <p className="text-gray-300">Track user signups, approvals, and deletions</p>
      </div>
      <AuditLogDashboard />
    </>
  )
}
