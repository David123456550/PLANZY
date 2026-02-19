"use client"

import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { CreditCard, Banknote, Check } from "lucide-react"
import { useAppStore, type PaymentMethod } from "@/lib/store"
import { useTranslation } from "@/lib/i18n"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"

interface PaymentMethodsSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function PaymentMethodsSheet({ open, onOpenChange }: PaymentMethodsSheetProps) {
  const { preferredPaymentMethod, setPreferredPaymentMethod, language } = useAppStore()
  const t = useTranslation(language)
  const { toast } = useToast()

  const handleSelectMethod = (method: PaymentMethod) => {
    setPreferredPaymentMethod(method)
    toast({
      title: language === "es" ? "Método de pago actualizado" : "Payment method updated",
      description: method === "card" ? t.cardPayment : t.cashPayment,
    })
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-3xl">
        <SheetHeader className="text-center">
          <SheetTitle>{t.paymentMethods}</SheetTitle>
          <SheetDescription>{t.selectPaymentMethod}</SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-3">
          <button
            onClick={() => handleSelectMethod("card")}
            className={cn(
              "flex w-full items-center gap-4 rounded-xl border-2 p-4 transition-colors",
              preferredPaymentMethod === "card"
                ? "border-[#ef7418] bg-[#ef7418]/5"
                : "border-muted hover:border-[#ef7418]/50",
            )}
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
              <CreditCard className="h-6 w-6 text-blue-600" />
            </div>
            <div className="flex-1 text-left">
              <p className="font-medium">{t.cardPayment}</p>
              <p className="text-sm text-muted-foreground">
                {language === "es" ? "Visa, Mastercard, American Express" : "Visa, Mastercard, American Express"}
              </p>
            </div>
            {preferredPaymentMethod === "card" && <Check className="h-5 w-5 text-[#ef7418]" />}
          </button>

          <button
            onClick={() => handleSelectMethod("cash")}
            className={cn(
              "flex w-full items-center gap-4 rounded-xl border-2 p-4 transition-colors",
              preferredPaymentMethod === "cash"
                ? "border-[#ef7418] bg-[#ef7418]/5"
                : "border-muted hover:border-[#ef7418]/50",
            )}
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
              <Banknote className="h-6 w-6 text-green-600" />
            </div>
            <div className="flex-1 text-left">
              <p className="font-medium">{t.cashPayment}</p>
              <p className="text-sm text-muted-foreground">
                {language === "es" ? "Paga en persona al organizador" : "Pay in person to the organizer"}
              </p>
            </div>
            {preferredPaymentMethod === "cash" && <Check className="h-5 w-5 text-[#ef7418]" />}
          </button>
        </div>

        <div className="mt-6">
          <Button className="w-full bg-transparent" variant="outline" onClick={() => onOpenChange(false)}>
            {t.close}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
