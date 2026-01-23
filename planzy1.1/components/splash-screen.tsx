"use client"

import { useEffect, useState } from "react"
import { PlanzyLogo } from "./planzy-logo"

export function SplashScreen() {
  const [animate, setAnimate] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setAnimate(true), 100)
    return () => clearTimeout(timer)
  }, [])

  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-background">
      <div className={`transition-all duration-700 ${animate ? "scale-100 opacity-100" : "scale-75 opacity-0"}`}>
        <PlanzyLogo size="xl" />
      </div>
      <p
        className={`mt-8 text-lg text-muted-foreground transition-all duration-700 delay-500 ${animate ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"}`}
      >
        Si no tienes plan, usa Planzy
      </p>
    </div>
  )
}
