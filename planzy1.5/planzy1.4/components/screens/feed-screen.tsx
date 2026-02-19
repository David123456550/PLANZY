"use client"

import { useState } from "react"
import { Bell, Settings, User, LogOut, Wallet } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { PlanzyLogo } from "@/components/planzy-logo"
import { PlanCard } from "@/components/plan-card"
import { CategoryFilter } from "@/components/category-filter"
import { WalletSheet } from "@/components/wallet-sheet"
import { useAppStore } from "@/lib/store"
import { useTranslation } from "@/lib/i18n"
import type { Plan } from "@/lib/types"

interface FeedScreenProps {
  onPlanSelect: (plan: Plan) => void
  onNotificationsClick: () => void
  onProfileClick?: () => void
  onSettingsClick?: () => void
  onLogout?: () => void
}

export function FeedScreen({
  onPlanSelect,
  onNotificationsClick,
  onProfileClick,
  onSettingsClick,
  onLogout,
}: FeedScreenProps) {
  const { plans, notifications, user, language, walletBalance } = useAppStore()
  const t = useTranslation(language)
  const [selectedCategory, setSelectedCategory] = useState("all")
  const unreadCount = notifications.filter((n) => !n.read).length
  const [walletOpen, setWalletOpen] = useState(false)

  const filteredPlans =
    selectedCategory === "all"
      ? plans
      : plans.filter((p) => p.category.toLowerCase() === selectedCategory.toLowerCase())

  return (
    <div className="flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center justify-between px-5 py-4">
          <PlanzyLogo size="sm" />
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              className="gap-1.5 text-[#1a95a4] font-semibold"
              onClick={() => setWalletOpen(true)}
            >
              <Wallet className="h-4 w-4" />
              {walletBalance.toFixed(2)}€
            </Button>
            <Button variant="ghost" size="icon" className="relative" onClick={onNotificationsClick}>
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <Badge className="absolute -right-1 -top-1 h-5 w-5 rounded-full bg-[#ef7418] p-0 text-xs">
                  {unreadCount}
                </Badge>
              )}
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full p-0">
                  <Avatar className="h-9 w-9 border-2 border-[#ef7418]">
                    <AvatarImage src={user?.avatar || "/placeholder.svg"} alt={user?.name} />
                    <AvatarFallback className="bg-[#1a95a4] text-white text-sm">
                      {user?.name?.charAt(0) || "U"}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="flex items-center gap-3 p-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={user?.avatar || "/placeholder.svg"} alt={user?.name} />
                    <AvatarFallback className="bg-[#1a95a4] text-white">{user?.name?.charAt(0) || "U"}</AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col">
                    <span className="font-medium text-sm">{user?.name}</span>
                    <span className="text-xs text-muted-foreground">@{user?.username}</span>
                  </div>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={onProfileClick} className="cursor-pointer">
                  <User className="mr-2 h-4 w-4" />
                  {t.myProfile}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onSettingsClick} className="cursor-pointer">
                  <Settings className="mr-2 h-4 w-4" />
                  {t.settings}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={onLogout} className="cursor-pointer text-red-600">
                  <LogOut className="mr-2 h-4 w-4" />
                  {t.logout}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Welcome message */}
      <div className="px-5 py-5">
        <h1 className="text-xl font-bold">
          {language === "es" ? "Hola" : "Hi"}, {user?.name.split(" ")[0]} 👋
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {language === "es"
            ? `Descubre planes cerca de ti en ${user?.location?.city || "tu zona"}`
            : `Discover plans near you in ${user?.location?.city || "your area"}`}
        </p>
      </div>

      {/* Category filter */}
      <CategoryFilter selected={selectedCategory} onSelect={setSelectedCategory} />

      {/* Plans list */}
      <div className="px-5 py-5">
        <h2 className="mb-5 text-lg font-semibold" style={{ color: "#1a95a4" }}>
          {language === "es" ? "Planes en tu zona" : "Plans in your area"}
        </h2>
        <div className="space-y-5">
          {filteredPlans.map((plan) => (
            <PlanCard key={plan.id} plan={plan} onClick={() => onPlanSelect(plan)} />
          ))}
        </div>
      </div>

      <WalletSheet open={walletOpen} onOpenChange={setWalletOpen} />
    </div>
  )
}
