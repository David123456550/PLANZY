"use client"

import { useState } from "react"
import { Settings, Bot, Camera, Edit2, Heart, CalendarCheck, Plus, MapPin, Crown, Wallet } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAppStore } from "@/lib/store"
import { useTranslation } from "@/lib/i18n"
import { PlanCard } from "@/components/plan-card"
import { EditProfileSheet } from "@/components/edit-profile-sheet"
import { PremiumSheet } from "@/components/premium-sheet"
import { WalletSheet } from "@/components/wallet-sheet"
import { PremiumBadge } from "@/components/premium-badge"
import type { Plan } from "@/lib/types"

interface ProfileScreenProps {
  onPlanSelect: (plan: Plan) => void
  onSettingsClick: () => void
  onAssistantClick: () => void
}

export function ProfileScreen({ onPlanSelect, onSettingsClick, onAssistantClick }: ProfileScreenProps) {
  const { user, plans, favorites, joinedPlans, language, premiumPlan, walletBalance } = useAppStore()
  const t = useTranslation(language)
  const [showEditProfile, setShowEditProfile] = useState(false)
  const [showPremium, setShowPremium] = useState(false)
  const [showWallet, setShowWallet] = useState(false)

  if (!user) return null

  const createdPlans = plans.filter((p) => p.creator.id === user.id)
  const favoritePlans = plans.filter((p) => favorites.includes(p.id))
  const myJoinedPlans = plans.filter((p) => joinedPlans.includes(p.id))

  const getPremiumDisplayName = () => {
    switch (premiumPlan) {
      case "pro":
        return "PRO"
      case "club":
        return "CLUB"
      default:
        return t.premium
    }
  }

  return (
    <div className="flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center justify-between px-5 py-4">
          <h1 className="text-lg font-semibold">{t.myProfile}</h1>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={onAssistantClick}>
              <Bot className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" onClick={onSettingsClick}>
              <Settings className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Profile info */}
      <div className="px-5 py-6">
        <div className="flex items-start gap-4">
          <div className="relative">
            <Avatar className="h-20 w-20 border-2 border-[#1a95a4]">
              <AvatarImage src={user.avatar || "/placeholder.svg"} />
              <AvatarFallback className="text-xl bg-[#1a95a4]/10 text-[#1a95a4]">{user.name[0]}</AvatarFallback>
            </Avatar>
            <button className="absolute -bottom-1 -right-1 rounded-full bg-[#ef7418] p-1.5 text-white shadow">
              <Camera className="h-3.5 w-3.5" />
            </button>
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold">{user.name}</h2>
              <PremiumBadge />
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setShowEditProfile(true)}>
                <Edit2 className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">@{user.username}</p>
            {user.location && (
              <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                <MapPin className="h-3 w-3" />
                {user.location.city}
              </div>
            )}
            {user.description && <p className="mt-2 text-sm leading-relaxed">{user.description}</p>}
          </div>
        </div>

        <div className="mt-4 flex gap-3">
          <Button variant="outline" className="flex-1 gap-2 bg-transparent" onClick={() => setShowPremium(true)}>
            <Crown className={`h-4 w-4 ${premiumPlan !== "free" ? "text-[#ef7418]" : "text-muted-foreground"}`} />
            {getPremiumDisplayName()}
          </Button>
          <Button variant="outline" className="flex-1 gap-2 bg-transparent" onClick={() => setShowWallet(true)}>
            <Wallet className="h-4 w-4 text-[#1a95a4]" />
            {walletBalance.toFixed(2)}€
          </Button>
        </div>

        {/* Interests */}
        {user.interests.length > 0 && (
          <div className="mt-5">
            <div className="flex flex-wrap gap-2">
              {user.interests.map((interest) => (
                <Badge key={interest} variant="secondary" className="bg-[#1a95a4]/10 text-[#1a95a4]">
                  {interest}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="mt-6 grid grid-cols-3 gap-4">
          <Card>
            <CardContent className="flex flex-col items-center py-4">
              <Plus className="mb-1 h-5 w-5 text-[#1a95a4]" />
              <span className="text-2xl font-bold">{createdPlans.length}</span>
              <span className="text-xs text-muted-foreground">{language === "es" ? "Creados" : "Created"}</span>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex flex-col items-center py-4">
              <CalendarCheck className="mb-1 h-5 w-5 text-[#1a95a4]" />
              <span className="text-2xl font-bold">{myJoinedPlans.length}</span>
              <span className="text-xs text-muted-foreground">{language === "es" ? "Apuntado" : "Joined"}</span>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex flex-col items-center py-4">
              <Heart className="mb-1 h-5 w-5 text-[#ef7418]" />
              <span className="text-2xl font-bold">{favoritePlans.length}</span>
              <span className="text-xs text-muted-foreground">{language === "es" ? "Favoritos" : "Favorites"}</span>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="created" className="flex-1">
        <TabsList className="mx-5 grid w-auto grid-cols-3">
          <TabsTrigger value="created">{language === "es" ? "Creados" : "Created"}</TabsTrigger>
          <TabsTrigger value="joined">{language === "es" ? "Apuntado" : "Joined"}</TabsTrigger>
          <TabsTrigger value="favorites">{language === "es" ? "Favoritos" : "Favorites"}</TabsTrigger>
        </TabsList>
        <TabsContent value="created" className="px-5 py-5">
          {createdPlans.length > 0 ? (
            <div className="space-y-4">
              {createdPlans.map((plan) => (
                <PlanCard key={plan.id} plan={plan} onClick={() => onPlanSelect(plan)} />
              ))}
            </div>
          ) : (
            <div className="py-12 text-center">
              <Plus className="mx-auto mb-4 h-12 w-12 text-muted-foreground/50" />
              <p className="text-muted-foreground">
                {language === "es" ? "No has creado ningún plan todavía" : "You haven't created any plans yet"}
              </p>
            </div>
          )}
        </TabsContent>
        <TabsContent value="joined" className="px-5 py-5">
          {myJoinedPlans.length > 0 ? (
            <div className="space-y-4">
              {myJoinedPlans.map((plan) => (
                <PlanCard key={plan.id} plan={plan} onClick={() => onPlanSelect(plan)} />
              ))}
            </div>
          ) : (
            <div className="py-12 text-center">
              <CalendarCheck className="mx-auto mb-4 h-12 w-12 text-muted-foreground/50" />
              <p className="text-muted-foreground">
                {language === "es" ? "No te has apuntado a ningún plan" : "You haven't joined any plans"}
              </p>
            </div>
          )}
        </TabsContent>
        <TabsContent value="favorites" className="px-5 py-5">
          {favoritePlans.length > 0 ? (
            <div className="space-y-4">
              {favoritePlans.map((plan) => (
                <PlanCard key={plan.id} plan={plan} onClick={() => onPlanSelect(plan)} />
              ))}
            </div>
          ) : (
            <div className="py-12 text-center">
              <Heart className="mx-auto mb-4 h-12 w-12 text-muted-foreground/50" />
              <p className="text-muted-foreground">
                {language === "es" ? "No tienes planes en favoritos" : "You have no favorite plans"}
              </p>
            </div>
          )}
        </TabsContent>
      </Tabs>

      <EditProfileSheet open={showEditProfile} onOpenChange={setShowEditProfile} />
      <PremiumSheet open={showPremium} onOpenChange={setShowPremium} />
      <WalletSheet open={showWallet} onOpenChange={setShowWallet} />
    </div>
  )
}
