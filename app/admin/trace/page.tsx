import TraceDashboard from "@/components/trace-dashboard"
import { serverTrace } from "@/lib/trace-logger"

export default function AdminTracePage() {
  // Server-side trace test - logs when this page is loaded
  serverTrace.info("Trace admin page loaded", { category: "admin", payload: { source: "server-side" } })

  return (
    <>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Trace Logs</h1>
        <p className="text-gray-300">Application-wide diagnostic logs for debugging and troubleshooting</p>
      </div>
      <TraceDashboard />
    </>
  )
}
