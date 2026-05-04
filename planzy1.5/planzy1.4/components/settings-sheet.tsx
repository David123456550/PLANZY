"use client"

import { useState } from "react"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import {
  User,
  Mail,
  Phone,
  Sun,
  Moon,
  LogOut,
  Globe,
  ShieldCheck,
  CreditCard,
  ChevronRight,
  Bot,
  Check,
  Crown,
  AlertTriangle,
} from "lucide-react"
import { useAppStore } from "@/lib/store"
import { useTheme } from "next-themes"
import { useToast } from "@/hooks/use-toast"
import { useTranslation, type Language } from "@/lib/i18n"
import { VerificationSheet } from "./verification-sheet"
import { PaymentMethodsSheet } from "./payment-methods-sheet"
import { AssistantSheet } from "./assistant-sheet"
import { PremiumSheet } from "./premium-sheet"
import { isPlanzyAdminEmail } from "@/lib/admin-config"
import { wipeEntireApplicationDatabase } from "@/lib/actions"

interface SettingsSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SettingsSheet({ open, onOpenChange }: SettingsSheetProps) {
  const { user, updateUser, setAuthenticated, setUser, language, setLanguage, preferredPaymentMethod, premiumPlan, initialize } =
    useAppStore()
  const { theme, setTheme } = useTheme()
  const { toast } = useToast()
  const t = useTranslation(language)
  const [username, setUsername] = useState(user?.username || "")
  const [email, setEmail] = useState(user?.email || "")
  const [phone, setPhone] = useState(user?.phone || "")
  const [verificationOpen, setVerificationOpen] = useState(false)
  const [paymentMethodsOpen, setPaymentMethodsOpen] = useState(false)
  const [assistantOpen, setAssistantOpen] = useState(false)
  const [premiumOpen, setPremiumOpen] = useState(false)
  const [showSaveSuccess, setShowSaveSuccess] = useState(false)
  const [adminWipePassword, setAdminWipePassword] = useState("")
  const [adminWipePhrase, setAdminWipePhrase] = useState("")
  const [adminWiping, setAdminWiping] = useState(false)

  const handleSave = () => {
    updateUser({ username, email, phone })
    setShowSaveSuccess(true)
    setTimeout(() => {
      setShowSaveSuccess(false)
    }, 1500)
  }

  const handleLogout = () => {
    setUser(null)
    setAuthenticated(false)
    onOpenChange(false)
  }

  const handleAdminFullWipe = async () => {
    if (!user || !isPlanzyAdminEmail(user.email)) return
    setAdminWiping(true)
    try {
      await wipeEntireApplicationDatabase(adminWipePassword, adminWipePhrase)
      setAdminWipePassword("")
      setAdminWipePhrase("")
      toast({
        title: language === "es" ? "Base de datos vaciada" : "Database wiped",
        description:
          language === "es"
            ? "Se han eliminado usuarios, planes, chats y el resto de colecciones."
            : "Users, plans, chats, and other collections were removed.",
      })
      setAuthenticated(false)
      await setUser(null)
      useAppStore.setState({
        plans: [],
        joinedPlans: [],
        favorites: [],
        chats: [],
        privateChats: [],
        tournaments: [],
        notifications: [],
        isAuthenticated: false,
      })
      await initialize()
      onOpenChange(false)
    } catch (e: unknown) {
      toast({
        variant: "destructive",
        title: language === "es" ? "Error" : "Error",
        description: e instanceof Error ? e.message : "Error",
      })
    } finally {
      setAdminWiping(false)
    }
  }

  const handleLanguageChange = (value: Language) => {
    setLanguage(value)
    toast({
      title: language === "es" ? "Idioma cambiado" : "Language changed",
      description: value === "es" ? "Español seleccionado" : "English selected",
    })
  }

  const getPremiumInfo = () => {
    switch (premiumPlan) {
      case "pro":
        return { name: "Pro", color: "bg-[#ef7418]", textColor: "text-white" }
      case "club":
        return { name: "Club", color: "bg-[#1a95a4]", textColor: "text-white" }
      default:
        return { name: language === "es" ? "Gratis" : "Free", color: "bg-muted", textColor: "text-foreground" }
    }
  }

  const premiumInfo = getPremiumInfo()

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="right" className="flex h-full w-full flex-col overflow-hidden p-0">
          <SheetHeader className="px-6 pt-6 pb-4 shrink-0 border-b">
            <SheetTitle>{t.settings}</SheetTitle>
          </SheetHeader>

          {showSaveSuccess && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
              <div className="flex flex-col items-center gap-3 animate-in zoom-in-50 duration-300">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                  <Check className="h-8 w-8 text-green-600" />
                </div>
                <p className="font-semibold text-green-600">{t.changesSaved}</p>
              </div>
            </div>
          )}

          <ScrollArea className="flex-1 overflow-auto">
            <div className="px-6 py-4 pb-8">
              <div className="space-y-6 pb-6">
                <div className="space-y-4">
                  <h3 className="font-semibold">{t.premium}</h3>
                  <button
                    onClick={() => setPremiumOpen(true)}
                    className="flex w-full items-center justify-between rounded-lg border p-4 transition-colors hover:bg-muted"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`flex h-10 w-10 items-center justify-center rounded-full ${premiumPlan !== "free" ? "bg-[#ef7418]/10" : "bg-muted"}`}
                      >
                        <Crown
                          className={`h-5 w-5 ${premiumPlan !== "free" ? "text-[#ef7418]" : "text-muted-foreground"}`}
                        />
                      </div>
                      <div className="text-left">
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{t.currentPlan}</p>
                          <Badge className={`${premiumInfo.color} ${premiumInfo.textColor}`}>{premiumInfo.name}</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {premiumPlan === "free"
                            ? language === "es"
                              ? "Actualiza para más beneficios"
                              : "Upgrade for more benefits"
                            : language === "es"
                              ? "Gestiona tu suscripción"
                              : "Manage your subscription"}
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                  </button>
                </div>

                <Separator />

                {/* Account settings */}
                <div className="space-y-4">
                  <h3 className="font-semibold">{t.account}</h3>
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <Label htmlFor="username" className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        {t.username}
                      </Label>
                      <Input
                        id="username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="@usuario"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email" className="flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        {t.email}
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="tu@email.com"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone" className="flex items-center gap-2">
                        <Phone className="h-4 w-4" />
                        {t.phone}
                      </Label>
                      <Input
                        id="phone"
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+34 600 000 000"
                      />
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h3 className="font-semibold">{t.verification}</h3>
                  <button
                    onClick={() => setVerificationOpen(true)}
                    className="flex w-full items-center justify-between rounded-lg border p-4 transition-colors hover:bg-muted"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`flex h-10 w-10 items-center justify-center rounded-full ${user?.isVerified ? "bg-green-100" : "bg-muted"}`}
                      >
                        <ShieldCheck
                          className={`h-5 w-5 ${user?.isVerified ? "text-green-600" : "text-muted-foreground"}`}
                        />
                      </div>
                      <div className="text-left">
                        <p className="font-medium">{t.verifyWithSelfie}</p>
                        <p className="text-xs text-muted-foreground">
                          {user?.isVerified ? t.verificationComplete : t.verifyDescription}
                        </p>
                      </div>
                    </div>
                    {user?.isVerified ? (
                      <span className="flex items-center gap-1 text-xs font-medium text-green-600">
                        <ShieldCheck className="h-4 w-4" />
                        {t.verified}
                      </span>
                    ) : (
                      <ChevronRight className="h-5 w-5 text-muted-foreground" />
                    )}
                  </button>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h3 className="font-semibold">{t.paymentMethods}</h3>
                  <button
                    onClick={() => setPaymentMethodsOpen(true)}
                    className="flex w-full items-center justify-between rounded-lg border p-4 transition-colors hover:bg-muted"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                        <CreditCard className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div className="text-left">
                        <p className="font-medium">
                          {preferredPaymentMethod === "card"
                            ? t.cardPayment
                            : preferredPaymentMethod === "cash"
                              ? t.cashPayment
                              : t.selectPaymentMethod}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {language === "es" ? "Tarjeta o efectivo" : "Card or cash"}
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                  </button>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h3 className="font-semibold">{t.assistant}</h3>
                  <button
                    onClick={() => setAssistantOpen(true)}
                    className="flex w-full items-center justify-between rounded-lg border p-4 transition-colors hover:bg-muted"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#1a95a4]/10">
                        <Bot className="h-5 w-5 text-[#1a95a4]" />
                      </div>
                      <div className="text-left">
                        <p className="font-medium">{t.aiAssistant}</p>
                        <p className="text-xs text-muted-foreground">{t.assistantDesc}</p>
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                  </button>
                </div>

                <Separator />

                {/* Appearance and Language */}
                <div className="space-y-4">
                  <h3 className="font-semibold">{t.customization}</h3>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="dark-mode" className="flex items-center gap-2">
                      {theme === "dark" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
                      <div>
                        <p className="font-medium">{t.darkMode}</p>
                        <p className="text-xs text-muted-foreground">{t.changeAppearance}</p>
                      </div>
                    </Label>
                    <Switch
                      id="dark-mode"
                      checked={theme === "dark"}
                      onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label className="flex items-center gap-2">
                      <Globe className="h-4 w-4" />
                      <div>
                        <p className="font-medium">{t.language}</p>
                        <p className="text-xs text-muted-foreground">{t.selectLanguage}</p>
                      </div>
                    </Label>
                    <Select value={language} onValueChange={handleLanguageChange}>
                      <SelectTrigger className="w-[140px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="es">
                          <span className="flex items-center gap-2">
                            <span>ES</span> Español
                          </span>
                        </SelectItem>
                        <SelectItem value="en">
                          <span className="flex items-center gap-2">
                            <span>EN</span> English
                          </span>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Separator />

                {user && isPlanzyAdminEmail(user.email) && (
                  <>
                    <div className="space-y-4 rounded-lg border border-destructive/40 bg-destructive/5 p-4">
                      <h3 className="flex items-center gap-2 font-semibold text-destructive">
                        <AlertTriangle className="h-4 w-4 shrink-0" />
                        {language === "es" ? "Administración — borrado total" : "Admin — full wipe"}
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        {language === "es"
                          ? "Elimina usuarios, planes, chats, torneos, monedero y notificaciones. Escribe BORRAR TODO o DELETE ALL y tu contraseña de esta cuenta."
                          : "Removes users, plans, chats, tournaments, wallet data, and notifications. Type BORRAR TODO or DELETE ALL and this account’s password."}
                      </p>
                      <div className="space-y-2">
                        <Label className="text-xs">{language === "es" ? "Contraseña" : "Password"}</Label>
                        <Input
                          type="password"
                          autoComplete="current-password"
                          value={adminWipePassword}
                          onChange={(e) => setAdminWipePassword(e.target.value)}
                          placeholder="••••••••"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs">BORRAR TODO / DELETE ALL</Label>
                        <Input
                          value={adminWipePhrase}
                          onChange={(e) => setAdminWipePhrase(e.target.value)}
                          placeholder="BORRAR TODO"
                          autoComplete="off"
                        />
                      </div>
                      <Button
                        type="button"
                        variant="destructive"
                        className="w-full"
                        disabled={adminWiping || !adminWipePassword.trim() || !adminWipePhrase.trim()}
                        onClick={handleAdminFullWipe}
                      >
                        {adminWiping
                          ? language === "es"
                            ? "Borrando…"
                            : "Wiping…"
                          : language === "es"
                            ? "Borrar toda la base de datos"
                            : "Wipe entire database"}
                      </Button>
                    </div>
                    <Separator />
                  </>
                )}

                {/* Actions */}
                <div className="space-y-3">
                  <Button className="w-full bg-[#ef7418] hover:bg-[#ef7418]/90 text-white" onClick={handleSave}>
                    {t.saveChanges}
                  </Button>
                  <Button variant="outline" className="w-full bg-transparent" onClick={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    {t.logout}
                  </Button>
                </div>
              </div>
            </div>
            <ScrollBar orientation="vertical" />
          </ScrollArea>
        </SheetContent>
      </Sheet>

      <VerificationSheet open={verificationOpen} onOpenChange={setVerificationOpen} />
      <PaymentMethodsSheet open={paymentMethodsOpen} onOpenChange={setPaymentMethodsOpen} />
      <AssistantSheet open={assistantOpen} onOpenChange={setAssistantOpen} />
      <PremiumSheet open={premiumOpen} onOpenChange={setPremiumOpen} />
    </>
  )
}
