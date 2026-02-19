"use client"

import { useState } from "react"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { MessageCircle, ArrowLeft, Plus, CalendarCheck, MapPin, MoreVertical, Flag, Ban, Check } from "lucide-react"
import { useAppStore } from "@/lib/store"
import { useTranslation } from "@/lib/i18n"
import { PrivateChatSheet } from "./private-chat-sheet"
import { VerifiedBadge } from "./verified-badge"
import type { User, Plan } from "@/lib/types"
import { format } from "date-fns"
import { es, enUS } from "date-fns/locale"
import { useToast } from "@/hooks/use-toast"

interface UserProfileSheetProps {
  user: User | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onPlanSelect?: (plan: Plan) => void
}

export function UserProfileSheet({ user: profileUser, open, onOpenChange, onPlanSelect }: UserProfileSheetProps) {
  const {
    plans,
    language,
    user: currentUser,
    startPrivateChat,
    blockUser,
    unblockUser,
    reportUser,
    blockedUsers,
  } = useAppStore()
  const t = useTranslation(language)
  const { toast } = useToast()
  const [chatOpen, setChatOpen] = useState(false)
  const [activeChat, setActiveChat] = useState<ReturnType<typeof startPrivateChat> | null>(null)
  const dateLocale = language === "es" ? es : enUS
  const [reportOpen, setReportOpen] = useState(false)
  const [reportReason, setReportReason] = useState("")
  const [blockDialogOpen, setBlockDialogOpen] = useState(false)

  if (!profileUser) return null

  const isOwnProfile = currentUser?.id === profileUser.id
  const isBlocked = blockedUsers.includes(profileUser.id)
  const userCreatedPlans = plans.filter((p) => p.creator.id === profileUser.id)
  const userJoinedPlans = plans.filter((p) => p.participants.some((u) => u.id === profileUser.id))

  const handleStartChat = () => {
    const chat = startPrivateChat(profileUser)
    setActiveChat(chat)
    setChatOpen(true)
  }

  const handleBlock = () => {
    if (isBlocked) {
      unblockUser(profileUser.id)
      toast({
        title: t.userUnblocked,
        description: `${profileUser.name} ${language === "es" ? "ha sido desbloqueado" : "has been unblocked"}`,
      })
    } else {
      blockUser(profileUser.id)
      toast({
        title: t.userBlocked,
        description: `${profileUser.name} ${language === "es" ? "ha sido bloqueado" : "has been blocked"}`,
      })
    }
    setBlockDialogOpen(false)
  }

  const handleReport = () => {
    if (!reportReason.trim()) return
    reportUser(profileUser.id, reportReason)
    toast({
      title: t.userReported,
      description: language === "es" ? "Tu denuncia ha sido enviada" : "Your report has been submitted",
    })
    setReportOpen(false)
    setReportReason("")
  }

  return (
    <>
      <Sheet open={open && !chatOpen} onOpenChange={onOpenChange}>
        <SheetContent side="right" className="w-full overflow-auto p-0 sm:max-w-md">
          <SheetHeader className="sr-only">
            <SheetTitle>{profileUser.name}</SheetTitle>
          </SheetHeader>

          {/* Header */}
          <div className="sticky top-0 z-10 flex items-center gap-3 border-b bg-background px-5 py-4">
            <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <span className="flex-1 text-lg font-semibold">{t.profile}</span>
            {!isOwnProfile && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <MoreVertical className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setReportOpen(true)}>
                    <Flag className="mr-2 h-4 w-4" />
                    {t.reportUser}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => setBlockDialogOpen(true)}
                    className={isBlocked ? "text-green-600" : "text-destructive"}
                  >
                    <Ban className="mr-2 h-4 w-4" />
                    {isBlocked ? t.unblockUser : t.blockUser}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>

          {/* Profile Info */}
          <div className="px-5 py-6">
            <div className="flex items-start gap-4">
              <Avatar className="h-20 w-20 border-2 border-[#1a95a4]">
                <AvatarImage src={profileUser.avatar || "/placeholder.svg"} />
                <AvatarFallback className="text-xl bg-[#1a95a4]/10 text-[#1a95a4]">
                  {profileUser.name[0]}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h2 className="text-xl font-bold">{profileUser.name}</h2>
                <p className="text-sm text-muted-foreground">@{profileUser.username}</p>
                {profileUser.location && (
                  <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                    <MapPin className="h-3 w-3" />
                    {profileUser.location.city}
                  </div>
                )}
                {profileUser.isVerified && (
                  <div className="mt-2 flex items-center gap-1">
                    <VerifiedBadge />
                    <span className="text-xs text-[#1a95a4]">{t.verified}</span>
                  </div>
                )}
              </div>
            </div>

            {profileUser.description && (
              <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{profileUser.description}</p>
            )}

            {/* Interests */}
            {profileUser.interests.length > 0 && (
              <div className="mt-5">
                <div className="flex flex-wrap gap-2">
                  {profileUser.interests.map((interest) => (
                    <Badge key={interest} variant="secondary" className="bg-[#1a95a4]/10 text-[#1a95a4]">
                      {interest}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Stats */}
            <div className="mt-6 grid grid-cols-2 gap-4">
              <Card>
                <CardContent className="flex flex-col items-center py-4">
                  <Plus className="mb-1 h-5 w-5 text-[#1a95a4]" />
                  <span className="text-2xl font-bold">{userCreatedPlans.length}</span>
                  <span className="text-xs text-muted-foreground">{t.plansCreated}</span>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="flex flex-col items-center py-4">
                  <CalendarCheck className="mb-1 h-5 w-5 text-[#1a95a4]" />
                  <span className="text-2xl font-bold">{userJoinedPlans.length}</span>
                  <span className="text-xs text-muted-foreground">{t.plansJoined}</span>
                </CardContent>
              </Card>
            </div>

            {/* Message Button */}
            {!isOwnProfile && !isBlocked && (
              <Button
                className="mt-6 w-full gap-2 bg-[#ef7418] hover:bg-[#ef7418]/90 text-white"
                onClick={handleStartChat}
              >
                <MessageCircle className="h-4 w-4" />
                {t.sendMessage}
              </Button>
            )}

            {isBlocked && (
              <div className="mt-6 rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-center">
                <Ban className="mx-auto h-8 w-8 text-destructive mb-2" />
                <p className="text-sm text-destructive">
                  {language === "es" ? "Has bloqueado a este usuario" : "You have blocked this user"}
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-3 bg-transparent"
                  onClick={() => setBlockDialogOpen(true)}
                >
                  {t.unblockUser}
                </Button>
              </div>
            )}
          </div>

          {/* Plans Tabs */}
          {!isBlocked && (
            <Tabs defaultValue="created" className="flex-1">
              <TabsList className="mx-5 grid w-auto grid-cols-2">
                <TabsTrigger value="created">{t.plansCreated}</TabsTrigger>
                <TabsTrigger value="joined">{t.plansJoined}</TabsTrigger>
              </TabsList>

              <TabsContent value="created" className="px-5 py-5">
                {userCreatedPlans.length > 0 ? (
                  <div className="space-y-3">
                    {userCreatedPlans.map((plan) => (
                      <button
                        key={plan.id}
                        className="flex w-full items-center gap-3 rounded-xl border bg-card p-3 text-left transition-colors hover:bg-muted/50"
                        onClick={() => {
                          onOpenChange(false)
                          onPlanSelect?.(plan)
                        }}
                      >
                        <div
                          className="h-14 w-14 shrink-0 rounded-lg bg-cover bg-center"
                          style={{ backgroundImage: `url(${plan.image})` }}
                        />
                        <div className="flex-1 overflow-hidden">
                          <h3 className="font-medium truncate">{plan.title}</h3>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(plan.date), "d MMM", { locale: dateLocale })} • {plan.time}
                          </p>
                        </div>
                        <Badge variant="secondary" className="shrink-0">
                          {plan.category}
                        </Badge>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="py-12 text-center">
                    <Plus className="mx-auto mb-3 h-10 w-10 text-muted-foreground/40" />
                    <p className="text-sm text-muted-foreground">{t.noPlansCreated}</p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="joined" className="px-5 py-5">
                {userJoinedPlans.length > 0 ? (
                  <div className="space-y-3">
                    {userJoinedPlans.map((plan) => (
                      <button
                        key={plan.id}
                        className="flex w-full items-center gap-3 rounded-xl border bg-card p-3 text-left transition-colors hover:bg-muted/50"
                        onClick={() => {
                          onOpenChange(false)
                          onPlanSelect?.(plan)
                        }}
                      >
                        <div
                          className="h-14 w-14 shrink-0 rounded-lg bg-cover bg-center"
                          style={{ backgroundImage: `url(${plan.image})` }}
                        />
                        <div className="flex-1 overflow-hidden">
                          <h3 className="font-medium truncate">{plan.title}</h3>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(plan.date), "d MMM", { locale: dateLocale })} • {plan.time}
                          </p>
                        </div>
                        <Badge variant="secondary" className="shrink-0">
                          {plan.category}
                        </Badge>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="py-12 text-center">
                    <CalendarCheck className="mx-auto mb-3 h-10 w-10 text-muted-foreground/40" />
                    <p className="text-sm text-muted-foreground">{t.noPlansJoined}</p>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          )}
        </SheetContent>
      </Sheet>

      <PrivateChatSheet chat={activeChat} open={chatOpen} onOpenChange={setChatOpen} />

      {/* Report Dialog */}
      <AlertDialog open={reportOpen} onOpenChange={setReportOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t.reportUser}</AlertDialogTitle>
            <AlertDialogDescription>
              {language === "es"
                ? `Describe el motivo por el que deseas denunciar a ${profileUser.name}`
                : `Describe why you want to report ${profileUser.name}`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <Label>{t.reportReason}</Label>
            <Textarea
              placeholder={t.reportReasonPlaceholder}
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
              className="mt-2"
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>{t.cancel}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleReport}
              disabled={!reportReason.trim()}
            >
              {t.submitReport}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Block Dialog */}
      <AlertDialog open={blockDialogOpen} onOpenChange={setBlockDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{isBlocked ? t.unblockUser : t.blockUser}</AlertDialogTitle>
            <AlertDialogDescription>
              {isBlocked
                ? language === "es"
                  ? `¿Desbloquear a ${profileUser.name}?`
                  : `Unblock ${profileUser.name}?`
                : language === "es"
                  ? `¿Bloquear a ${profileUser.name}? No podrás ver sus planes ni enviarle mensajes.`
                  : `Block ${profileUser.name}? You won't be able to see their plans or message them.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t.cancel}</AlertDialogCancel>
            <AlertDialogAction
              className={isBlocked ? "bg-green-600 hover:bg-green-700" : "bg-destructive hover:bg-destructive/90"}
              onClick={handleBlock}
            >
              {isBlocked ? (
                <>
                  <Check className="mr-2 h-4 w-4" />
                  {t.unblockUser}
                </>
              ) : (
                <>
                  <Ban className="mr-2 h-4 w-4" />
                  {t.blockUser}
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
