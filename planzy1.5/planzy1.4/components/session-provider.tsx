"use client"

import { SessionProvider } from "next-auth/react"

export function PlanzySessionProvider({ children }: { children: React.ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>
}
