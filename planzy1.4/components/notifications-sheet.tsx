"use client"

import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Bell, MapPin, Calendar, AlertCircle, MessageCircle } from "lucide-react"
import { useAppStore } from "@/lib/store"
import { formatDistanceToNow } from "date-fns"
import { es } from "date-fns/locale"

interface NotificationsSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function NotificationsSheet({ open, onOpenChange }: NotificationsSheetProps) {
  const { notifications, notificationSettings, markNotificationRead, updateNotificationSettings } = useAppStore()

  const getIcon = (type: string) => {
    switch (type) {
      case "new_plan":
        return <MapPin className="h-5 w-5 text-[#1a95a4]" />
      case "upcoming":
        return <Calendar className="h-5 w-5 text-[#ef7418]" />
      case "plan_change":
        return <AlertCircle className="h-5 w-5 text-amber-500" />
      case "message":
        return <MessageCircle className="h-5 w-5 text-blue-500" />
      default:
        return <Bell className="h-5 w-5" />
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Notificaciones</SheetTitle>
        </SheetHeader>

        <div className="mt-4 space-y-4">
          {notifications.map((notif) => (
            <button
              key={notif.id}
              className={`flex w-full items-start gap-3 rounded-lg p-3 text-left transition-colors ${
                notif.read ? "bg-muted/50" : "bg-muted"
              }`}
              onClick={() => markNotificationRead(notif.id)}
            >
              <div className="mt-0.5">{getIcon(notif.type)}</div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm ${!notif.read && "font-medium"}`}>{notif.title}</p>
                <p className="text-xs text-muted-foreground line-clamp-2">{notif.message}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(notif.createdAt), {
                    addSuffix: true,
                    locale: es,
                  })}
                </p>
              </div>
              {!notif.read && <div className="h-2 w-2 flex-shrink-0 rounded-full bg-[#ef7418]" />}
            </button>
          ))}
        </div>

        <Separator className="my-6" />

        {/* Notification settings */}
        <div>
          <h3 className="mb-4 font-semibold">Preferencias de notificaciones</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="new-plans" className="flex-1">
                <p className="font-medium">Nuevos planes en tu zona</p>
                <p className="text-xs text-muted-foreground">Según tus intereses</p>
              </Label>
              <Switch
                id="new-plans"
                checked={notificationSettings.newPlansInArea}
                onCheckedChange={(checked) => updateNotificationSettings({ newPlansInArea: checked })}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="upcoming" className="flex-1">
                <p className="font-medium">Planes próximos</p>
                <p className="text-xs text-muted-foreground">Recordatorios de planes apuntados</p>
              </Label>
              <Switch
                id="upcoming"
                checked={notificationSettings.upcomingPlans}
                onCheckedChange={(checked) => updateNotificationSettings({ upcomingPlans: checked })}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="changes" className="flex-1">
                <p className="font-medium">Cambios en planes</p>
                <p className="text-xs text-muted-foreground">Modificaciones en planes activos</p>
              </Label>
              <Switch
                id="changes"
                checked={notificationSettings.planChanges}
                onCheckedChange={(checked) => updateNotificationSettings({ planChanges: checked })}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="messages" className="flex-1">
                <p className="font-medium">Mensajes de grupo</p>
                <p className="text-xs text-muted-foreground">Chat de los planes</p>
              </Label>
              <Switch
                id="messages"
                checked={notificationSettings.groupMessages}
                onCheckedChange={(checked) => updateNotificationSettings({ groupMessages: checked })}
              />
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
