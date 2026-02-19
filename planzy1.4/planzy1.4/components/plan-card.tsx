"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { MapPin, Calendar, Users, Euro } from "lucide-react"
import { useAppStore } from "@/lib/store"
import type { Plan } from "@/lib/types"
import { format } from "date-fns"
import { es, enUS } from "date-fns/locale"

interface PlanCardProps {
  plan: Plan
  onClick: () => void
}

export function PlanCard({ plan, onClick }: PlanCardProps) {
  const { language } = useAppStore()
  const dateLocale = language === "es" ? es : enUS

  return (
    <Card className="cursor-pointer overflow-hidden transition-all hover:shadow-lg" onClick={onClick}>
      <div className="relative h-44">
        <div className="h-full w-full bg-cover bg-center" style={{ backgroundImage: `url(${plan.image})` }} />
        <Badge className="absolute left-4 top-4" style={{ backgroundColor: "#1a95a4" }}>
          {plan.category}
        </Badge>
        {plan.pricePerPerson !== undefined && plan.pricePerPerson > 0 && (
          <Badge variant="secondary" className="absolute right-4 top-4 flex items-center gap-1">
            <Euro className="h-3 w-3" />
            {plan.pricePerPerson}/{language === "es" ? "persona" : "person"}
          </Badge>
        )}
      </div>
      <CardContent className="p-5">
        <h3 className="mb-2 text-base font-semibold line-clamp-1">{plan.title}</h3>
        <p className="mb-4 text-sm leading-relaxed text-muted-foreground line-clamp-2">{plan.description}</p>
        <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5" />
            <span>
              {format(new Date(plan.date), "d MMM", { locale: dateLocale })} • {plan.time}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5" />
            <span className="truncate max-w-[120px]">{plan.location.name}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Users className="h-3.5 w-3.5" />
            <span>
              {plan.currentParticipants}
              {plan.maxParticipants && `/${plan.maxParticipants}`}
            </span>
          </div>
        </div>
        <div className="mt-4 flex items-center gap-3 border-t pt-4">
          <Avatar className="h-7 w-7">
            <AvatarImage src={plan.creator.avatar || "/placeholder.svg"} />
            <AvatarFallback>{plan.creator.name[0]}</AvatarFallback>
          </Avatar>
          <span className="text-xs text-muted-foreground">
            {language === "es" ? "Creado por" : "Created by"}{" "}
            <span className="font-medium text-foreground">{plan.creator.name}</span>
          </span>
        </div>
      </CardContent>
    </Card>
  )
}
