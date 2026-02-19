"use client"

import { useState } from "react"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Card, CardContent } from "@/components/ui/card"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { CreditCard, Building2, Check, Loader2, Lock, Wallet } from "lucide-react"
import { useAppStore } from "@/lib/store"
import { useTranslation } from "@/lib/i18n"
import { useToast } from "@/hooks/use-toast"
import type { Plan } from "@/lib/types"

interface PaymentSheetProps {
  plan: Plan | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function PaymentSheet({ plan, open, onOpenChange, onSuccess }: PaymentSheetProps) {
  const { language, joinPlan, addPaidPlan, walletBalance, addToWallet } = useAppStore()
  const t = useTranslation(language)
  const { toast } = useToast()

  const [paymentMethod, setPaymentMethod] = useState<"card" | "wallet">("card")
  const [cardNumber, setCardNumber] = useState("")
  const [expiryDate, setExpiryDate] = useState("")
  const [cvv, setCvv] = useState("")
  const [cardholderName, setCardholderName] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)

  if (!plan) return null

  const courtPrice = plan.courtReservation?.price || 0
  const pricePerPerson = plan.pricePerPerson || 0
  const total = courtPrice > 0 ? courtPrice / (plan.maxParticipants || 4) : pricePerPerson

  const canPayWithWallet = walletBalance >= total

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, "").replace(/[^0-9]/gi, "")
    const matches = v.match(/\d{4,16}/g)
    const match = (matches && matches[0]) || ""
    const parts = []
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4))
    }
    return parts.length ? parts.join(" ") : value
  }

  const formatExpiryDate = (value: string) => {
    const v = value.replace(/\s+/g, "").replace(/[^0-9]/gi, "")
    if (v.length >= 2) {
      return v.substring(0, 2) + "/" + v.substring(2, 4)
    }
    return v
  }

  const handlePayment = () => {
    if (paymentMethod === "wallet") {
      if (!canPayWithWallet) {
        toast({
          title: "Error",
          description: t.insufficientBalance,
          variant: "destructive",
        })
        return
      }
    } else {
      if (!cardNumber || !expiryDate || !cvv || !cardholderName) {
        toast({
          title: "Error",
          description: "Por favor completa todos los campos",
          variant: "destructive",
        })
        return
      }
    }

    setIsProcessing(true)

    setTimeout(() => {
      setIsProcessing(false)
      joinPlan(plan.id)
      addPaidPlan(plan.id, total)

      if (plan.creator) {
        addToWallet(total, `${t.creatorEarnings}: ${plan.title}`, plan.id, "income")
      }

      if (paymentMethod === "wallet") {
        // Wallet deduction is handled by the store
      }

      toast({
        title: t.paymentSuccess,
        description: t.paymentSuccessMessage,
      })
      onOpenChange(false)
      onSuccess()
      setCardNumber("")
      setExpiryDate("")
      setCvv("")
      setCardholderName("")
    }, 2000)
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[85vh] rounded-t-2xl overflow-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5 text-[#1a95a4]" />
            {t.reserveCourt}
          </SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Order summary */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div
                  className="h-16 w-16 flex-shrink-0 rounded-lg bg-cover bg-center"
                  style={{ backgroundImage: `url(${plan.image})` }}
                />
                <div className="flex-1">
                  <h3 className="font-semibold">{plan.title}</h3>
                  {plan.courtReservation && (
                    <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                      <Building2 className="h-4 w-4" />
                      <span>{plan.courtReservation.courtName}</span>
                    </div>
                  )}
                  <p className="mt-1 text-xs text-muted-foreground">{plan.courtReservation?.reservationTime}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Price breakdown */}
          <div className="space-y-2">
            {plan.courtReservation && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{t.courtReservation}</span>
                <span>{plan.courtReservation.price}€</span>
              </div>
            )}
            {plan.courtReservation && plan.maxParticipants && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Dividido entre {plan.maxParticipants} personas</span>
                <span>÷ {plan.maxParticipants}</span>
              </div>
            )}
            <Separator />
            <div className="flex justify-between font-semibold text-lg">
              <span>{t.totalToPay}</span>
              <span className="text-[#ef7418]">{total.toFixed(2)}€</span>
            </div>
          </div>

          <Separator />

          {/* Payment method - Add wallet option */}
          <div className="space-y-4">
            <Label className="text-base font-semibold">{t.paymentMethod}</Label>
            <RadioGroup value={paymentMethod} onValueChange={(v) => setPaymentMethod(v as "card" | "wallet")}>
              {/* Wallet payment option */}
              <div
                className={`flex items-center space-x-3 rounded-lg border p-4 ${!canPayWithWallet ? "opacity-50" : ""}`}
              >
                <RadioGroupItem value="wallet" id="wallet" disabled={!canPayWithWallet} />
                <Label htmlFor="wallet" className="flex items-center gap-2 cursor-pointer flex-1">
                  <Wallet className="h-5 w-5 text-[#1a95a4]" />
                  <div className="flex-1">
                    <p>{t.walletPayment}</p>
                    <p className="text-xs text-muted-foreground">
                      {t.walletBalance}: {walletBalance.toFixed(2)}€
                    </p>
                  </div>
                </Label>
                {canPayWithWallet && (
                  <span className="text-xs text-green-600 font-medium">
                    {language === "es" ? "Disponible" : "Available"}
                  </span>
                )}
              </div>

              {/* Card payment option */}
              <div className="flex items-center space-x-3 rounded-lg border p-4">
                <RadioGroupItem value="card" id="card" />
                <Label htmlFor="card" className="flex items-center gap-2 cursor-pointer flex-1">
                  <CreditCard className="h-5 w-5" />
                  {t.creditCard}
                </Label>
                <div className="flex gap-1">
                  <div className="h-6 w-10 rounded bg-gradient-to-r from-blue-600 to-blue-800" />
                  <div className="h-6 w-10 rounded bg-gradient-to-r from-red-500 via-yellow-500 to-red-600" />
                </div>
              </div>
            </RadioGroup>
          </div>

          {/* Card details - only show if card selected */}
          {paymentMethod === "card" && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="cardNumber">{t.cardNumber}</Label>
                <Input
                  id="cardNumber"
                  placeholder="1234 5678 9012 3456"
                  value={cardNumber}
                  onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                  maxLength={19}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="expiry">{t.expiryDate}</Label>
                  <Input
                    id="expiry"
                    placeholder="MM/YY"
                    value={expiryDate}
                    onChange={(e) => setExpiryDate(formatExpiryDate(e.target.value))}
                    maxLength={5}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cvv">{t.cvv}</Label>
                  <Input
                    id="cvv"
                    placeholder="123"
                    value={cvv}
                    onChange={(e) => setCvv(e.target.value.replace(/\D/g, "").slice(0, 4))}
                    maxLength={4}
                    type="password"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="cardholderName">{t.cardholderName}</Label>
                <Input
                  id="cardholderName"
                  placeholder="NOMBRE APELLIDOS"
                  value={cardholderName}
                  onChange={(e) => setCardholderName(e.target.value.toUpperCase())}
                />
              </div>
            </div>
          )}

          {/* Pay button */}
          <Button
            className="w-full bg-[#ef7418] hover:bg-[#ef7418]/90 text-white h-12 text-base"
            onClick={handlePayment}
            disabled={isProcessing || (paymentMethod === "wallet" && !canPayWithWallet)}
          >
            {isProcessing ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                {t.processing}
              </>
            ) : (
              <>
                {paymentMethod === "wallet" ? <Wallet className="mr-2 h-5 w-5" /> : <Check className="mr-2 h-5 w-5" />}
                {t.payNow} - {total.toFixed(2)}€
              </>
            )}
          </Button>

          <p className="text-center text-xs text-muted-foreground flex items-center justify-center gap-1">
            <Lock className="h-3 w-3" />
            Pago seguro con encriptación SSL
          </p>
        </div>
      </SheetContent>
    </Sheet>
  )
}
