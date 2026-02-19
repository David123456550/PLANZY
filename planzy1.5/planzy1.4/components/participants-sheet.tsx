"use client"

import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { ArrowLeft, MapPin } from "lucide-react"
import { useAppStore } from "@/lib/store"
import { useTranslation } from "@/lib/i18n"
import { VerifiedBadge } from "./verified-badge"
import type { User } from "@/lib/types"

interface ParticipantsSheetProps {
  participants: User[]
  planTitle: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ParticipantsSheet({ participants, planTitle, open, onOpenChange }: ParticipantsSheetProps) {
  const { language } = useAppStore()
  const t = useTranslation(language)

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full p-0 sm:max-w-md">
        <SheetHeader className="border-b px-5 py-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex-1">
              <SheetTitle className="text-left text-base">{t.participantsList}</SheetTitle>
              <p className="text-xs text-muted-foreground">{planTitle}</p>
            </div>
          </div>
        </SheetHeader>

        <ScrollArea className="h-[calc(100vh-80px)]">
          <div className="p-5 space-y-3">
            {participants.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <p className="text-sm">{language === "es" ? "No hay participantes aún" : "No participants yet"}</p>
              </div>
            ) : (
              participants.map((participant) => (
                <div key={participant.id} className="flex items-center gap-3 rounded-xl border p-4">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={participant.avatar || "/placeholder.svg"} />
                    <AvatarFallback>{participant.name[0]}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center gap-1.5">
                      <p className="font-medium">{participant.name}</p>
                      {participant.isVerified && <VerifiedBadge />}
                    </div>
                    <p className="text-sm text-muted-foreground">@{participant.username}</p>
                    {participant.location?.city && (
                      <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                        <MapPin className="h-3 w-3" />
                        {participant.location.city}
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  )
}
