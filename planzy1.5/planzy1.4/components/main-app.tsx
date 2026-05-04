"use client"

import { useEffect, useState } from "react"
import { BottomNav } from "./bottom-nav"
import { FeedScreen } from "./screens/feed-screen"
import { SearchScreen } from "./screens/search-screen"
import { CreatePlanScreen } from "./screens/create-plan-screen"
import { ProfileScreen } from "./screens/profile-screen"
import { MapScreen } from "./screens/map-screen"
import { PlanDetailSheet } from "./plan-detail-sheet"
import { NotificationsSheet } from "./notifications-sheet"
import { SettingsSheet } from "./settings-sheet"
import { AssistantSheet } from "./assistant-sheet"
import { ChatsListSheet } from "./chats-list-sheet"
import { useAppStore } from "@/lib/store"
import type { Plan } from "@/lib/types"
import { MessageCircle } from "lucide-react"
import { Badge } from "@/components/ui/badge"

export function MainApp() {
  const [activeTab, setActiveTab] = useState("feed")
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null)
  const [showNotifications, setShowNotifications] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [showAssistant, setShowAssistant] = useState(false)
  const [showChats, setShowChats] = useState(false)
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null)
  const [animationKey, setAnimationKey] = useState(0)
  const { setUser, setAuthenticated, chats, privateChats, refreshChats } = useAppStore()

  useEffect(() => {
    void refreshChats()
    const interval = setInterval(() => {
      void refreshChats()
    }, 4000)
    return () => clearInterval(interval)
  }, [refreshChats])

  const totalGroupUnread = chats.reduce((acc, chat) => acc + chat.unreadCount, 0)
  const totalPrivateUnread = privateChats.reduce((acc, chat) => acc + chat.unreadCount, 0)
  const totalUnread = totalGroupUnread + totalPrivateUnread

  const handleTabChange = (tab: string) => {
    setActiveTab(tab)
    setAnimationKey((prev) => prev + 1)
    if (tab !== "create") {
      setEditingPlan(null)
    }
  }

  const handleLogout = () => {
    setAuthenticated(false)
    setUser(null)
  }

  const handleEditPlan = (plan: Plan) => {
    setEditingPlan(plan)
    setActiveTab("create")
    setAnimationKey((prev) => prev + 1)
  }

  const renderScreen = () => {
    switch (activeTab) {
      case "feed":
        return (
          <FeedScreen
            onPlanSelect={setSelectedPlan}
            onNotificationsClick={() => setShowNotifications(true)}
            onProfileClick={() => setActiveTab("profile")}
            onSettingsClick={() => setShowSettings(true)}
            onLogout={handleLogout}
          />
        )
      case "search":
        return <SearchScreen onPlanSelect={setSelectedPlan} />
      case "create":
        return (
          <CreatePlanScreen
            onBack={() => {
              setActiveTab("feed")
              setAnimationKey((prev) => prev + 1)
              setEditingPlan(null)
            }}
            editPlan={editingPlan}
          />
        )
      case "map":
        return <MapScreen onPlanSelect={setSelectedPlan} />
      case "profile":
        return (
          <ProfileScreen
            onPlanSelect={setSelectedPlan}
            onSettingsClick={() => setShowSettings(true)}
            onAssistantClick={() => setShowAssistant(true)}
          />
        )
      default:
        return null
    }
  }

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <div className="mx-auto flex min-h-dvh w-full max-w-5xl flex-1 flex-col border-x border-transparent lg:border-border/50 lg:shadow-sm">
        <main
          key={animationKey}
          className="flex-1 pb-28 pt-[env(safe-area-inset-top,0px)] motion-safe:animate-fade-in sm:pb-32"
        >
          {renderScreen()}
        </main>
      </div>

      <BottomNav activeTab={activeTab} onTabChange={handleTabChange} />

      <div className="pointer-events-none fixed inset-x-0 bottom-0 top-0 z-50 flex justify-center">
        <div className="relative h-full w-full max-w-5xl">
          <button
            type="button"
            onClick={() => setShowChats(true)}
            className="pointer-events-auto absolute bottom-24 right-3 flex h-14 w-14 min-h-[3.5rem] min-w-[3.5rem] items-center justify-center rounded-full bg-[#1a95a4] text-white shadow-lg transition-colors hover:bg-[#1a95a4]/90 sm:bottom-28 sm:right-5 md:bottom-32 touch-manipulation"
            style={{ marginBottom: "env(safe-area-inset-bottom, 0px)" }}
          >
            <MessageCircle className="h-6 w-6" />
            {totalUnread > 0 && (
              <Badge className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#ef7418] p-0 text-[10px]">
                {totalUnread > 99 ? "99+" : totalUnread}
              </Badge>
            )}
          </button>
        </div>
      </div>

      <PlanDetailSheet plan={selectedPlan} onClose={() => setSelectedPlan(null)} onEditPlan={handleEditPlan} />
      <NotificationsSheet open={showNotifications} onOpenChange={setShowNotifications} />
      <SettingsSheet open={showSettings} onOpenChange={setShowSettings} />
      <AssistantSheet open={showAssistant} onOpenChange={setShowAssistant} />
      <ChatsListSheet open={showChats} onOpenChange={setShowChats} />
    </div>
  )
}
