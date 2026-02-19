"use client"

import { useState } from "react"
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
  const { setUser, setAuthenticated, chats, privateChats, joinedPlans } = useAppStore()

  const userChats = chats.filter((chat) => joinedPlans.includes(chat.planId || ""))
  const totalGroupUnread = userChats.reduce((acc, chat) => acc + chat.unreadCount, 0)
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
    <div className="flex min-h-screen flex-col bg-background">
      <main key={animationKey} className="flex-1 pb-24 animate-fade-in">
        {renderScreen()}
      </main>
      <BottomNav activeTab={activeTab} onTabChange={handleTabChange} />

      <button
        onClick={() => setShowChats(true)}
        className="fixed bottom-24 right-4 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-[#1a95a4] text-white shadow-lg hover:bg-[#1a95a4]/90 transition-colors"
      >
        <MessageCircle className="h-6 w-6" />
        {totalUnread > 0 && (
          <Badge className="absolute -right-1 -top-1 h-5 min-w-5 rounded-full bg-[#ef7418] p-0 text-[10px] flex items-center justify-center">
            {totalUnread > 99 ? "99+" : totalUnread}
          </Badge>
        )}
      </button>

      <PlanDetailSheet plan={selectedPlan} onClose={() => setSelectedPlan(null)} onEditPlan={handleEditPlan} />
      <NotificationsSheet open={showNotifications} onOpenChange={setShowNotifications} />
      <SettingsSheet open={showSettings} onOpenChange={setShowSettings} />
      <AssistantSheet open={showAssistant} onOpenChange={setShowAssistant} />
      <ChatsListSheet open={showChats} onOpenChange={setShowChats} />
    </div>
  )
}
