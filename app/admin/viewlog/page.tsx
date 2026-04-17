import ViewLogDashboard from "@/components/view-log-dashboard"

export default function AdminViewLogPage() {
  return (
    <>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Video View Log</h1>
        <p className="text-gray-300">Track all video views across the library</p>
      </div>
      <ViewLogDashboard />
    </>
  )
}
