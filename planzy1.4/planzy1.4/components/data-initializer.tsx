"use client"

import { useEffect } from "react"
import { useAppStore } from "@/lib/store"

export function DataInitializer() {
    const { initialize } = useAppStore()

    useEffect(() => {
        initialize()
    }, [initialize])

    return null
}
