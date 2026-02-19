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
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex items-center justify-around px-2 py-3">
        {tabs.map((tab) => {
          const Icon = tab.icon
          const isCreate = tab.id === "create"
          const isActive = activeTab === tab.id

          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={cn(
                "relative flex flex-col items-center gap-1 px-3 py-2 transition-colors",
                isCreate
                  ? "relative -mt-6"
                  : isActive
                    ? "text-[#ef7418]"
                    : "text-muted-foreground hover:text-foreground",
              )}
            >
              {isCreate ? (
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#ef7418] text-white shadow-lg">
                  <Icon className="h-7 w-7" />
                </div>
              ) : (
                <>
                  <Icon className="h-5 w-5" />
                  <span className="text-[10px]">{tab.label}</span>
                </>
              )}
            </button>
          )
        })}
      </div>
    </nav>
  )
}
