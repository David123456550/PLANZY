"use client"

import { Home, Search, Plus, User, MapPin } from "lucide-react"
import { cn } from "@/lib/utils"
import { useAppStore } from "@/lib/store"

interface BottomNavProps {
  activeTab: string
  onTabChange: (tab: string) => void
}

export function BottomNav({ activeTab, onTabChange }: BottomNavProps) {
  const { language } = useAppStore()

  const tabs = [
    { id: "feed", icon: Home, label: language === "es" ? "Inicio" : "Home" },
    { id: "search", icon: Search, label: language === "es" ? "Buscar" : "Search" },
    { id: "create", icon: Plus, label: language === "es" ? "Crear" : "Create" },
    { id: "map", icon: MapPin, label: language === "es" ? "Mapa" : "Map" },
    { id: "profile", icon: User, label: language === "es" ? "Perfil" : "Profile" },
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background/95 pb-[env(safe-area-inset-bottom,0px)] backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex max-w-5xl items-center justify-around px-2 py-2 sm:px-4 sm:py-3 md:py-4">
        {tabs.map((tab) => {
          const Icon = tab.icon
          const isCreate = tab.id === "create"
          const isActive = activeTab === tab.id

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onTabChange(tab.id)}
              className={cn(
                "relative flex min-h-[44px] min-w-[44px] flex-col items-center justify-center gap-0.5 rounded-lg px-2 py-1 transition-colors touch-manipulation sm:gap-1 sm:px-3 sm:py-2",
                isCreate
                  ? "relative -mt-5 sm:-mt-6"
                  : isActive
                    ? "text-[#ef7418]"
                    : "text-muted-foreground hover:text-foreground",
              )}
            >
              {isCreate ? (
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#ef7418] text-white shadow-lg sm:h-14 sm:w-14">
                  <Icon className="h-6 w-6 sm:h-7 sm:w-7" />
                </div>
              ) : (
                <>
                  <Icon className="h-5 w-5 sm:h-6 sm:w-6" />
                  <span className="max-w-[4.5rem] truncate text-center text-[10px] leading-tight sm:max-w-none sm:text-xs">
                    {tab.label}
                  </span>
                </>
              )}
            </button>
          )
        })}
      </div>
    </nav>
  )
}
