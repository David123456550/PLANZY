"use client"

import { useSession } from "next-auth/react"
import { useEffect } from "react"
import { useAppStore } from "@/lib/store"

export function AuthSync() {
  const { data: session, status } = useSession()
  const { setUser, setAuthenticated, isAuthenticated } = useAppStore()

  useEffect(() => {
    if (status === "authenticated" && session?.user) {
      const planzyUser = (session as any).planzyUser
      if (planzyUser && !isAuthenticated) {
        setUser(planzyUser)
        setAuthenticated(true)
      }
    }
  }, [session, status, setUser, setAuthenticated, isAuthenticated])

  return null
}
