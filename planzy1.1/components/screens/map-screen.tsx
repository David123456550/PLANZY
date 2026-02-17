"use client"

import { useState, useEffect } from "react"
import { MapPin, Calendar, Users, Navigation, Loader2 } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useAppStore } from "@/lib/store"
import { useTranslation } from "@/lib/i18n"
import type { Plan } from "@/lib/types"
import { format, differenceInDays } from "date-fns"
import { es, enUS } from "date-fns/locale"
import { useToast } from "@/hooks/use-toast"

interface MapScreenProps {
  onPlanSelect: (plan: Plan) => void
}

export function MapScreen({ onPlanSelect }: MapScreenProps) {
  const { plans, language, userLocation, setUserLocation } = useAppStore()
  const t = useTranslation(language)
  const { toast } = useToast()
  const [selectedMarker, setSelectedMarker] = useState<Plan | null>(null)
  const [isLocating, setIsLocating] = useState(false)
  const [locationError, setLocationError] = useState<string | null>(null)

  const dateLocale = language === "es" ? es : enUS

  // Filter plans within 7 days
  const upcomingPlans = plans.filter((plan) => {
    const daysUntil = differenceInDays(new Date(plan.date), new Date())
    return daysUntil >= 0 && daysUntil <= 7
  })

  useEffect(() => {
    if (!userLocation) {
      requestLocation()
    }
  }, [])

  const requestLocation = () => {
    if (!navigator.geolocation) {
      setLocationError("Geolocalización no soportada")
      return
    }

    setIsLocating(true)
    setLocationError(null)

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords
        setUserLocation({ lat: latitude, lng: longitude })
        setIsLocating(false)
        toast({
          title: t.locationEnabled,
          description: `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
        })
      },
      (error) => {
        setIsLocating(false)
        setLocationError(t.locationError)
        toast({
          title: t.locationError,
          description: error.message,
          variant: "destructive",
        })
      },
      { enableHighAccuracy: true, timeout: 10000 },
    )
  }

  const mapCenter = userLocation || { lat: 40.4168, lng: -3.7038 }

  const getMapUrl = () => {
    const { lat, lng } = mapCenter
    return `https://www.google.com/maps/embed/v1/view?key=AIzaSyBFw0Qbyq9zTFTd-tUY6Nj6S4BqKs6v8N8&center=${lat},${lng}&zoom=14&maptype=roadmap`
  }

  return (
    <div className="relative h-[calc(100vh-80px)]">
      <div className="absolute inset-0 bg-muted">
        {/* Map background with OpenStreetMap tile style */}
        <div
          className="h-full w-full relative"
          style={{
            background: `url('https://api.mapbox.com/styles/v1/mapbox/streets-v12/static/${mapCenter.lng},${mapCenter.lat},13,0/600x800?access_token=pk.placeholder') center/cover no-repeat`,
            backgroundColor: "#e5e3df",
          }}
        >
          {/* Fallback styled map */}
          <div className="absolute inset-0 bg-gradient-to-b from-[#c5e8c5]/30 to-[#f5f5dc]/30">
            {/* Grid lines to simulate map */}
            <div
              className="absolute inset-0 opacity-20"
              style={{
                backgroundImage: `
                  linear-gradient(to right, #999 1px, transparent 1px),
                  linear-gradient(to bottom, #999 1px, transparent 1px)
                `,
                backgroundSize: "50px 50px",
              }}
            />

            {userLocation && (
              <div className="absolute z-20 -translate-x-1/2 -translate-y-1/2" style={{ top: "50%", left: "50%" }}>
                <div className="relative">
                  <div className="h-4 w-4 rounded-full bg-blue-500 border-2 border-white shadow-lg animate-pulse" />
                  <div className="absolute -inset-2 rounded-full bg-blue-500/20 animate-ping" />
                </div>
              </div>
            )}

            {/* Plan markers */}
            {upcomingPlans.map((plan, index) => {
              // Position markers relative to center
              const offsetLat = (plan.location.lat - mapCenter.lat) * 500
              const offsetLng = (plan.location.lng - mapCenter.lng) * 500
              const top = 50 + offsetLat
              const left = 50 + offsetLng

              return (
                <button
                  key={plan.id}
                  className="absolute z-10 transition-transform hover:scale-110"
                  style={{
                    top: `${Math.max(15, Math.min(75, top))}%`,
                    left: `${Math.max(10, Math.min(90, left))}%`,
                  }}
                  onClick={() => setSelectedMarker(plan)}
                >
                  <div className="flex flex-col items-center">
                    <div className="rounded-full bg-[#ef7418] p-2 shadow-lg">
                      <MapPin className="h-5 w-5 text-white" />
                    </div>
                    <div className="mt-1 rounded-md bg-background px-2 py-0.5 text-xs font-medium shadow">
                      {plan.title.slice(0, 15)}...
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Header overlay */}
      <div className="absolute left-0 right-0 top-0 z-20 bg-background/80 px-4 py-3 backdrop-blur">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold">{t.mapTitle}</h1>
            <p className="text-sm text-muted-foreground">
              {upcomingPlans.length} {t.plansIn7Days}
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={requestLocation}
            disabled={isLocating}
            className={userLocation ? "border-[#1a95a4] text-[#1a95a4]" : ""}
          >
            {isLocating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Navigation className="h-4 w-4 mr-2" />}
            {isLocating ? t.locatingYou : userLocation ? t.locationEnabled : "Ubicación"}
          </Button>
        </div>
      </div>

      {/* Selected plan card */}
      {selectedMarker && (
        <Card className="absolute bottom-4 left-4 right-4 z-30 shadow-lg">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div
                className="h-16 w-16 flex-shrink-0 rounded-lg bg-cover bg-center"
                style={{ backgroundImage: `url(${selectedMarker.image})` }}
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold line-clamp-1">{selectedMarker.title}</h3>
                  <Badge style={{ backgroundColor: "#1a95a4" }}>
                    {differenceInDays(new Date(selectedMarker.date), new Date())} {t.days}
                  </Badge>
                </div>
                <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    <span>
                      {format(new Date(selectedMarker.date), "d MMM", {
                        locale: dateLocale,
                      })}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    <span>
                      {selectedMarker.currentParticipants}
                      {selectedMarker.maxParticipants && `/${selectedMarker.maxParticipants}`}
                    </span>
                  </div>
                </div>
                <div className="mt-2 flex gap-2">
                  <Button
                    size="sm"
                    className="flex-1 bg-[#ef7418] hover:bg-[#ef7418]/90 text-white"
                    onClick={() => {
                      onPlanSelect(selectedMarker)
                      setSelectedMarker(null)
                    }}
                  >
                    {t.viewDetails}
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setSelectedMarker(null)}>
                    {t.close}
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Plans list */}
      <div className="absolute bottom-0 left-0 right-0 z-20 max-h-[40%] overflow-auto rounded-t-2xl bg-background p-4 shadow-lg">
        <h2 className="mb-3 text-sm font-semibold">{t.nearbyPlans}</h2>
        <div className="space-y-3">
          {upcomingPlans.map((plan) => (
            <button
              key={plan.id}
              className="flex w-full items-center gap-3 rounded-lg p-2 text-left transition-colors hover:bg-muted"
              onClick={() => onPlanSelect(plan)}
            >
              <div
                className="h-12 w-12 flex-shrink-0 rounded-lg bg-cover bg-center"
                style={{ backgroundImage: `url(${plan.image})` }}
              />
              <div className="flex-1 min-w-0">
                <p className="font-medium line-clamp-1">{plan.title}</p>
                <p className="text-xs text-muted-foreground line-clamp-1">{plan.location.name}</p>
              </div>
              <Badge variant="outline" className="flex-shrink-0">
                {format(new Date(plan.date), "d MMM", { locale: dateLocale })}
              </Badge>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
