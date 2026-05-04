"use client"

import { useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { signOutServerAction } from "@/lib/actions"

export default function SignOutPage() {
  const router = useRouter()
  const hasRun = useRef(false)

  useEffect(() => {
    if (hasRun.current) return
    hasRun.current = true

    signOutServerAction().then(() => router.push("/"))
  }, [router])

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100 flex items-center justify-center p-4">
      <div className="bg-black/90 backdrop-blur-sm rounded-lg p-8 max-w-md w-full text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500 mx-auto mb-4"></div>
        <p className="text-white">Signing out...</p>
      </div>
    </div>
  )
}
