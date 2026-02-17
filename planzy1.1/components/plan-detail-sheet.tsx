"use client"

import { useState } from "react"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
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
  MapPin,
  Calendar,
  Clock,
  Users,
  Euro,
  Heart,
  Building2,
  Check,
  X,
  CreditCard,
  Share2,
  MessageCircle,
  Pencil,
  Wallet,
  Navigation,
  AlertCircle,
  CalendarPlus,
} from "lucide-react"
import { useAppStore } from "@/lib/store"
import { useTranslation } from "@/lib/i18n"
import { PaymentSheet } from "./payment-sheet"
import { ShareSheet } from "./share-sheet"
import { ChatSheet } from "./chat-sheet"
import { UserProfileSheet } from "./user-profile-sheet"
import type { Plan, User } from "@/lib/types"
import { format } from "date-fns"
import { es, enUS } from "date-fns/locale"

interface PlanDetailSheetProps {
  plan: Plan | null
  onClose: () => void
  onEditPlan?: (plan: Plan) => void
}

export function PlanDetailSheet({ plan, onClose, onEditPlan }: PlanDetailSheetProps) {
  const { user, favorites, joinedPlans, toggleFavorite, joinPlan, leavePlan, language, chats, paidPlans } =
    useAppStore()
  const t = useTranslation(language)
  const [paymentOpen, setPaymentOpen] = useState(false)
  const [shareOpen, setShareOpen] = useState(false)
  const [chatOpen, setChatOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [profileOpen, setProfileOpen] = useState(false)
  const [showLeaveDialog, setShowLeaveDialog] = useState(false)
  const [showAgeDialog, setShowAgeDialog] = useState(false)
  const [showCalendarDialog, setShowCalendarDialog] = useState(false)
  const [pendingJoin, setPendingJoin] = useState(false)

  if (!plan) return null

  const isFavorite = favorites.includes(plan.id)
  const isJoined = joinedPlans.includes(plan.id)
  const isCreator = user?.id === plan.creator.id
  const isFull = plan.maxParticipants ? plan.currentParticipants >= plan.maxParticipants : false
  const dateLocale = language === "es" ? es : enUS
  const planChat = chats.find((c) => c.planId === plan.id)

  const requiresPayment =
    (plan.courtReservation && plan.courtReservation.price > 0) || (plan.pricePerPerson && plan.pricePerPerson > 0)

  const paidPlan = paidPlans.find((p) => p.planId === plan.id)
  const wasPaidFor = !!paidPlan

  const handleJoin = () => {
    if (plan.minAge && (!user?.age || user.age < plan.minAge)) {
      setShowAgeDialog(true)
      return
    }

    if (requiresPayment) {
      setPaymentOpen(true)
    } else {
      joinPlan(plan.id)
      setShowCalendarDialog(true)
    }
  }

  const handlePaymentSuccess = () => {
    setPaymentOpen(false)
    setShowCalendarDialog(true)
  }

  const handleLeave = () => {
    if (wasPaidFor) {
      setShowLeaveDialog(true)
    } else {
      leavePlan(plan.id)
    }
  }

  const handleConfirmLeave = () => {
    leavePlan(plan.id, true)
    setShowLeaveDialog(false)
    onClose()
  }

  const handleUserClick = (clickedUser: User) => {
    setSelectedUser(clickedUser)
    setProfileOpen(true)
  }

  const handleEditPlan = () => {
    if (onEditPlan) {
      onEditPlan(plan)
      onClose()
    }
  }

  const handleGetDirections = () => {
    const destination = encodeURIComponent(plan.location.address || plan.location.name)
    const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${destination}&destination_place_id=${plan.location.lat},${plan.location.lng}`
    window.open(mapsUrl, "_blank")
  }

  const handleAddToCalendar = () => {
    const planDate = new Date(plan.date)
    const [hours, minutes] = plan.time.split(":").map(Number)
    planDate.setHours(hours, minutes, 0, 0)

    const endDate = new Date(planDate)
    endDate.setHours(endDate.getHours() + 2) // Default 2 hour duration

    const formatDate = (date: Date) => {
      return date.toISOString().replace(/-|:|\.\d{3}/g, "")
    }

    const calendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(plan.title)}&dates=${formatDate(planDate)}/${formatDate(endDate)}&details=${encodeURIComponent(plan.description)}&location=${encodeURIComponent(plan.location.address || plan.location.name)}`

    window.open(calendarUrl, "_blank")
    setShowCalendarDialog(false)
  }

  return (
    <>
      <Sheet open={!!plan && !profileOpen} onOpenChange={() => onClose()}>
        <SheetContent side="bottom" className="h-[90vh] overflow-auto rounded-t-2xl p-0">
          <SheetHeader className="sr-only">
            <SheetTitle>{plan.title}</SheetTitle>
          </SheetHeader>

          {/* Image */}
          <div className="relative h-52">
            <div className="h-full w-full bg-cover bg-center" style={{ backgroundImage: `url(${plan.image})` }} />
            <Badge className="absolute left-5 top-5" style={{ backgroundColor: "#1a95a4" }}>
              {plan.category}
            </Badge>
            <div className="absolute right-5 top-5 flex gap-2">
              {isCreator && onEditPlan && (
                <Button variant="secondary" size="icon" onClick={handleEditPlan}>
                  <Pencil className="h-5 w-5" />
                </Button>
              )}
              <Button variant="secondary" size="icon" onClick={() => setShareOpen(true)}>
                <Share2 className="h-5 w-5" />
              </Button>
              <Button variant="secondary" size="icon" onClick={() => toggleFavorite(plan.id)}>
                <Heart className={`h-5 w-5 ${isFavorite ? "fill-[#ef7418] text-[#ef7418]" : ""}`} />
              </Button>
            </div>
          </div>

          <div className="px-5 py-5">
            {/* Title and creator */}
            <h2 className="text-2xl font-bold leading-tight">{plan.title}</h2>
            <button className="mt-3 flex items-center gap-2 text-left" onClick={() => handleUserClick(plan.creator)}>
              <Avatar className="h-7 w-7">
                <AvatarImage src={plan.creator.avatar || "/placeholder.svg"} />
                <AvatarFallback>{plan.creator.name[0]}</AvatarFallback>
              </Avatar>
              <span className="text-sm text-muted-foreground">
                {t.createdBy}{" "}
                <span className="font-medium text-[#1a95a4] hover:underline">@{plan.creator.username}</span>
              </span>
            </button>

            {/* Description */}
            <p className="mt-5 text-sm leading-relaxed text-muted-foreground">{plan.description}</p>

            <Separator className="my-6" />

            {/* Details */}
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <Calendar className="h-5 w-5 shrink-0 text-[#1a95a4]" />
                <div>
                  <p className="text-sm font-medium">
                    {format(new Date(plan.date), "EEEE, d 'de' MMMM", { locale: dateLocale })}
                  </p>
                  <p className="text-xs text-muted-foreground">{t.dateOfPlan}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <Clock className="h-5 w-5 shrink-0 text-[#1a95a4]" />
                <div>
                  <p className="text-sm font-medium">{plan.time}</p>
                  <p className="text-xs text-muted-foreground">{t.startTime}</p>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <MapPin className="h-5 w-5 shrink-0 text-[#1a95a4]" />
                  <div>
                    <p className="text-sm font-medium">{plan.location.name}</p>
                    <p className="text-xs text-muted-foreground">{plan.location.address}</p>
                  </div>
                </div>
                <Button variant="outline" size="sm" className="gap-2 bg-transparent" onClick={handleGetDirections}>
                  <Navigation className="h-4 w-4" />
                  {t.getDirections}
                </Button>
              </div>
              <div className="flex items-center gap-4">
                <Users className="h-5 w-5 shrink-0 text-[#1a95a4]" />
                <div>
                  <p className="text-sm font-medium">
                    {plan.currentParticipants}
                    {plan.maxParticipants && ` / ${plan.maxParticipants}`} {t.participants}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {plan.maxParticipants
                      ? `${plan.maxParticipants - plan.currentParticipants} ${t.spotsAvailable}`
                      : t.noLimit}
                  </p>
                </div>
              </div>
              {plan.minAge && (
                <div className="flex items-center gap-4">
                  <AlertCircle className="h-5 w-5 shrink-0 text-[#ef7418]" />
                  <div>
                    <p className="text-sm font-medium">
                      {t.minimumAge}: {plan.minAge} {language === "es" ? "años" : "years"}
                    </p>
                  </div>
                </div>
              )}
              {plan.pricePerPerson !== undefined && (
                <div className="flex items-center gap-4">
                  <Euro className="h-5 w-5 shrink-0 text-[#ef7418]" />
                  <div>
                    <p className="text-sm font-medium">
                      {plan.pricePerPerson === 0 ? t.free : `${plan.pricePerPerson}€ ${t.perPerson}`}
                    </p>
                    <p className="text-xs text-muted-foreground">{t.price}</p>
                  </div>
                </div>
              )}
              {plan.courtReservation && (
                <div className="flex items-center gap-4">
                  <Building2 className="h-5 w-5 shrink-0 text-[#ef7418]" />
                  <div>
                    <p className="text-sm font-medium">{plan.courtReservation.courtName}</p>
                    <p className="text-xs text-muted-foreground">
                      {plan.courtReservation.reservationTime} • {plan.courtReservation.price}€
                    </p>
                  </div>
                </div>
              )}
            </div>

            <Separator className="my-6" />

            {/* Participants */}
            <div>
              <h3 className="mb-4 text-base font-semibold">{language === "es" ? "Participantes" : "Participants"}</h3>
              <div className="flex flex-wrap gap-3">
                {plan.participants.map((participant) => (
                  <button
                    key={participant.id}
                    onClick={() => handleUserClick(participant)}
                    className="flex items-center gap-2 rounded-full bg-muted px-4 py-2 transition-colors hover:bg-muted/80"
                  >
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={participant.avatar || "/placeholder.svg"} />
                      <AvatarFallback>{participant.name[0]}</AvatarFallback>
                    </Avatar>
                    <span className="text-sm">{participant.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {(isJoined || isCreator) && (
              <>
                <Separator className="my-6" />
                <Button variant="outline" className="w-full gap-2 bg-transparent" onClick={() => setChatOpen(true)}>
                  <MessageCircle className="h-4 w-4" />
                  {t.openChat}
                </Button>
              </>
            )}

            {/* Actions */}
            <div className="mt-8 flex gap-3">
              {isCreator ? (
                <Button className="flex-1 bg-muted text-foreground" disabled>
                  {t.yourPlan}
                </Button>
              ) : isJoined ? (
                <Button className="flex-1 bg-transparent" variant="outline" onClick={handleLeave}>
                  <X className="mr-2 h-4 w-4" />
                  {wasPaidFor ? t.leaveWithRefund : t.leave}
                </Button>
              ) : (
                <Button
                  className="flex-1 bg-[#ef7418] hover:bg-[#ef7418]/90 text-white"
                  disabled={isFull}
                  onClick={handleJoin}
                >
                  {requiresPayment ? <CreditCard className="mr-2 h-4 w-4" /> : <Check className="mr-2 h-4 w-4" />}
                  {isFull
                    ? t.full
                    : requiresPayment
                      ? `${t.join} - ${((plan.courtReservation?.price || 0) / (plan.maxParticipants || 4) || plan.pricePerPerson || 0).toFixed(2)}€`
                      : t.join}
                </Button>
              )}
              <Button variant="outline" size="icon" onClick={() => toggleFavorite(plan.id)}>
                <Heart className={`h-5 w-5 ${isFavorite ? "fill-[#ef7418] text-[#ef7418]" : ""}`} />
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      <PaymentSheet plan={plan} open={paymentOpen} onOpenChange={setPaymentOpen} onSuccess={handlePaymentSuccess} />
      <ShareSheet plan={plan} open={shareOpen} onOpenChange={setShareOpen} />
      <ChatSheet chat={planChat || null} open={chatOpen} onOpenChange={setChatOpen} />
      <UserProfileSheet user={selectedUser} open={profileOpen} onOpenChange={setProfileOpen} />

      {/* Leave with refund dialog */}
      <AlertDialog open={showLeaveDialog} onOpenChange={setShowLeaveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t.leave}?</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>{t.refundConfirm}</p>
              {paidPlan && (
                <div className="flex items-center gap-2 mt-3 p-3 bg-green-50 rounded-lg text-green-700">
                  <Wallet className="h-5 w-5" />
                  <span className="font-medium">
                    +{paidPlan.amount.toFixed(2)}€ {t.refundToWallet}
                  </span>
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t.cancel}</AlertDialogCancel>
            <AlertDialogAction className="bg-[#ef7418] hover:bg-[#ef7418]/90" onClick={handleConfirmLeave}>
              {t.leave}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Age requirement dialog */}
      <AlertDialog open={showAgeDialog} onOpenChange={setShowAgeDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t.minAgeRequired}</AlertDialogTitle>
            <AlertDialogDescription>
              {t.minAgeRequiredDesc.replace("{age}", plan.minAge?.toString() || "18")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t.cancel}</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showCalendarDialog} onOpenChange={setShowCalendarDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <CalendarPlus className="h-5 w-5 text-[#1a95a4]" />
              {t.addToCalendar}
            </AlertDialogTitle>
            <AlertDialogDescription>{t.addToCalendarDesc}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t.no}</AlertDialogCancel>
            <AlertDialogAction className="bg-[#ef7418] hover:bg-[#ef7418]/90" onClick={handleAddToCalendar}>
              {t.yes}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
