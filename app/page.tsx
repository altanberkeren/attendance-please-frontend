"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"
import Image from "next/image"
import { useAuth } from "@/hooks/use-auth"
import { consumePendingAuthRedirect } from "@/lib/auth/pending-redirect"

export default function RootPage() {
  const router = useRouter()
  const { isAuthenticated, isReady } = useAuth()

  useEffect(() => {
    if (!isReady) {
      return
    }

    if (isAuthenticated) {
      router.replace(consumePendingAuthRedirect() ?? "/overview")
      return
    }

    router.replace("/login")
  }, [isAuthenticated, isReady, router])

  return (
    <div className="min-h-screen grid place-items-center p-6">
      <div className="text-center space-y-3">
        <div className="flex justify-center">
          <Image
            src="/ius-logo-medium.png"
            alt="IUS Logo"
            width={40}
            height={40}
            className="rounded"
          />
        </div>
        <div className="inline-flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Preparing sign-in...
        </div>
      </div>
    </div>
  )
}
