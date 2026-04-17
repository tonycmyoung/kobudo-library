import DebugDashboard from "@/components/debug-dashboard"

export default function AdminDebugPage() {
  return (
    <>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Debug Dashboard</h1>
        <p className="text-gray-300">Authentication logs and debugging information</p>
      </div>
      <DebugDashboard />
    </>
  )
}
