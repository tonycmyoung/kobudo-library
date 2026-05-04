import { Suspense } from "react"
import PendingApprovalClient from "@/components/pending-approval-client"

export default function PendingApprovalPage() {
  const adminEmail = process.env.ADMIN_EMAIL || ""
  return (
    <Suspense>
      <PendingApprovalClient adminEmail={adminEmail} />
    </Suspense>
  )
}
