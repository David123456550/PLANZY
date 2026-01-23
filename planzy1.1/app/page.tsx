"use client"

import { useEffect, useState } from "react"
import { useAppStore } from "@/lib/store"
import { SplashScreen } from "@/components/splash-screen"
import { AuthScreen } from "@/components/auth-screen"
import { MainApp } from "@/components/main-app"
import { currentUser } from "@/lib/mock-data"

export default function Home() {
  const [showSplash, setShowSplash] = useState(true)
  const { isAuthenticated, setAuthenticated, setUser } = useAppStore()

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false)
    }, 2500)
    return () => clearTimeout(timer)
  }, [])

  const handleLogin = () => {
    setUser(currentUser)
    setAuthenticated(true)
  }

  if (showSplash) {
    return <SplashScreen />
  }

  if (!isAuthenticated) {
    return <AuthScreen onLogin={handleLogin} />
  }

  return <MainApp />
}
