"use client"

import React from "react"

import { useState } from "react"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import {
  Crown,
  Check,
  CreditCard,
  Wallet,
  Sparkles,
  Users,
  CalendarPlus,
  Search,
  Trophy,
  Headphones,
  ArrowLeft,
  Loader2,
} from "lucide-react"
import { useAppStore } from "@/lib/store"
import { useTranslation } from "@/lib/i18n"
import { useToast } from "@/hooks/use-toast"
import type { PremiumPlan } from "@/lib/types"

interface PremiumSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  preselectedPlan?: PremiumPlan
}

type PaymentType = "card" | "wallet"

export function PremiumSheet({ open, onOpenChange, preselectedPlan }: PremiumSheetProps) {
  const { language, premiumPlan, walletBalance, setPremiumPlan } = useAppStore()
  const t = useTranslation(language)
  const { toast } = useToast()
  const [selectedPlan, setSelectedPlan] = useState<PremiumPlan | null>(preselectedPlan || null)
  const [paymentType, setPaymentType] = useState<PaymentType>("card")
  const [isProcessing, setIsProcessing] = useState(false)
  const [step, setStep] = useState<"plans" | "payment">(preselectedPlan ? "payment" : "plans")
  
  // When opening with a preselected plan, go directly to payment
  React.useEffect(() => {
    if (open && preselectedPlan) {
      setSelectedPlan(preselectedPlan)
      setStep("payment")
    }
  }, [open, preselectedPlan])

  const plans = [
    {
      id: "free" as PremiumPlan,
      name: t.freePlan,
      price: 0,
      description: t.freePlanDesc,
      features: [
        { text: language === "es" ? "3 planes al mes" : "3 plans per month", icon: CalendarPlus },
        { text: language === "es" ? "Hasta 10 participantes" : "Up to 10 participants", icon: Users },
      ],
      color: "bg-muted",
      textColor: "text-foreground",
    },
    {
      id: "pro" as PremiumPlan,
      name: t.proPlan,
      price: 5.99,
      description: t.proPlanDesc,
      features: [
        { text: t.noAds, icon: Sparkles },
        { text: t.plansUpTo20, icon: Users },
        { text: t.plans10Month, icon: CalendarPlus },
        { text: t.exclusiveBadge, icon: Crown },
        { text: t.searchPriority, icon: Search },
      ],
      color: "bg-gradient-to-br from-[#ef7418] to-[#ef7418]/80",
      textColor: "text-white",
      popular: true,
    },
    {
      id: "club" as PremiumPlan,
      name: t.clubPlan,
      price: 14.99,
      description: t.clubPlanDesc,
      features: [
        { text: t.allProFeatures, icon: Check },
        { text: t.createTournaments, icon: Trophy },
        { text: t.exclusiveBadge, icon: Crown },
        { text: t.vipSupport, icon: Headphones },
      ],
      color: "bg-gradient-to-br from-[#1a95a4] to-[#1a95a4]/80",
      textColor: "text-white",
    },
  ]

  const handleSelectPlan = (plan: PremiumPlan) => {
    if (plan === "free") {
      setPremiumPlan("free")
      toast({
        title: language === "es" ? "Plan actualizado" : "Plan updated",
        description: language === "es" ? "Ahora tienes el plan gratuito" : "You now have the free plan",
      })
      return
    }
    setSelectedPlan(plan)
    setStep("payment")
  }

  const handlePayment = () => {
    if (!selectedPlan) return

    const planPrice = plans.find((p) => p.id === selectedPlan)?.price || 0

    if (paymentType === "wallet") {
      if (walletBalance < planPrice) {
        toast({
          title: t.insufficientFunds,
          description: t.addFundsFirst,
          variant: "destructive",
        })
        return
      }
    }

    setIsProcessing(true)

    setTimeout(() => {
      setPremiumPlan(selectedPlan)

      if (paymentType === "wallet") {
        useAppStore.setState((state) => ({
          walletBalance: state.walletBalance - planPrice,
          walletTransactions: [
            {
              id: `tx-${Date.now()}`,
              type: "withdrawal" as const,
              amount: planPrice,
              description: `Suscripción ${selectedPlan === "pro" ? "Pro" : "Club"}`,
              createdAt: new Date(),
            },
            ...state.walletTransactions,
          ],
        }))
      }

      setIsProcessing(false)
      setStep("plans")
      setSelectedPlan(null)
      onOpenChange(false)

      toast({
        title: t.subscriptionSuccess,
        description: selectedPlan === "pro" ? t.welcomeToPro : t.welcomeToClub,
      })
    }, 2000)
  }

  const selectedPlanData = plans.find((p) => p.id === selectedPlan)

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[90vh] rounded-t-2xl p-0 flex flex-col overflow-hidden">
        <SheetHeader className="px-6 pt-6 pb-4 shrink-0 border-b">
          <SheetTitle className="flex items-center gap-2">
            <Crown className="h-5 w-5 text-[#ef7418]" />
            {t.premiumPlans}
          </SheetTitle>
        </SheetHeader>

        <ScrollArea className="flex-1 overflow-auto">
          <div className="px-6 py-4 pb-8">
            {step === "plans" ? (
              <div className="space-y-4 pb-6">
                {plans.map((plan) => {
                  const isCurrent = premiumPlan === plan.id
                  return (
                    <Card
                      key={plan.id}
                      className={`relative overflow-hidden ${isCurrent ? "ring-2 ring-[#ef7418]" : ""}`}
                    >
                      {plan.popular && (
                        <div className="absolute right-0 top-0">
                          <Badge className="rounded-none rounded-bl-lg bg-[#ef7418]">
                            {language === "es" ? "Popular" : "Popular"}
                          </Badge>
                        </div>
                      )}
                      <CardHeader className={`${plan.color} ${plan.textColor}`}>
                        <div className="flex items-center justify-between">
                          <div>
                            <CardTitle className="flex items-center gap-2">
                              {plan.name}
                              {isCurrent && (
                                <Badge variant="outline" className="border-current text-current">
                                  {t.currentPlan}
                                </Badge>
                              )}
                            </CardTitle>
                            <CardDescription className={plan.textColor === "text-white" ? "text-white/80" : ""}>
                              {plan.description}
                            </CardDescription>
                          </div>
                          <div className="text-right">
                            <span className="text-3xl font-bold">{plan.price === 0 ? t.free : `${plan.price}€`}</span>
                            {plan.price > 0 && (
                              <p className="text-xs opacity-80">/{language === "es" ? "mes" : "month"}</p>
                            )}
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-4">
                        <ul className="space-y-2">
                          {plan.features.map((feature, idx) => (
                            <li key={idx} className="flex items-center gap-2 text-sm">
                              <feature.icon className="h-4 w-4 text-[#1a95a4]" />
                              {feature.text}
                            </li>
                          ))}
                        </ul>
                        <Button
                          className={`mt-4 w-full ${
                            plan.id === "pro"
                              ? "bg-[#ef7418] hover:bg-[#ef7418]/90"
                              : plan.id === "club"
                                ? "bg-[#1a95a4] hover:bg-[#1a95a4]/90"
                                : ""
                          }`}
                          variant={plan.id === "free" ? "outline" : "default"}
                          disabled={isCurrent}
                          onClick={() => handleSelectPlan(plan.id)}
                        >
                          {isCurrent ? t.currentPlan : plan.price === 0 ? t.freePlan : t.subscribe}
                        </Button>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            ) : (
              <div className="space-y-6 pb-6">
                <Button variant="ghost" size="sm" className="gap-2" onClick={() => setStep("plans")}>
                  <ArrowLeft className="h-4 w-4" />
                  {language === "es" ? "Volver" : "Back"}
                </Button>

                {selectedPlanData && (
                  <Card className="bg-muted/50">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold">{selectedPlanData.name}</p>
                          <p className="text-sm text-muted-foreground">{t.monthlySubscription}</p>
                        </div>
                        <p className="text-2xl font-bold">{selectedPlanData.price}€</p>
                      </div>
                    </CardContent>
                  </Card>
                )}

                <Separator />

                <div>
                  <h3 className="font-semibold mb-4">{t.selectPaymentMethod}</h3>
                  <RadioGroup value={paymentType} onValueChange={(v) => setPaymentType(v as PaymentType)}>
                    <div className="flex items-center space-x-3 rounded-lg border p-4">
                      <RadioGroupItem value="card" id="card" />
                      <Label htmlFor="card" className="flex flex-1 items-center gap-3 cursor-pointer">
                        <CreditCard className="h-5 w-5 text-[#1a95a4]" />
                        <div>
                          <p className="font-medium">{t.cardPaymentMethod}</p>
                          <p className="text-xs text-muted-foreground">Visa, Mastercard, Amex</p>
                        </div>
                      </Label>
                    </div>
                    <div className="flex items-center space-x-3 rounded-lg border p-4 mt-2">
                      <RadioGroupItem value="wallet" id="wallet" />
                      <Label htmlFor="wallet" className="flex flex-1 items-center gap-3 cursor-pointer">
                        <Wallet className="h-5 w-5 text-[#1a95a4]" />
                        <div>
                          <p className="font-medium">{t.walletPaymentMethod}</p>
                          <p className="text-xs text-muted-foreground">
                            {t.walletBalance}: {walletBalance.toFixed(2)}€
                          </p>
                        </div>
                      </Label>
                    </div>
                  </RadioGroup>
                </div>

                <Button
                  className="w-full bg-[#ef7418] hover:bg-[#ef7418]/90"
                  onClick={handlePayment}
                  disabled={isProcessing}
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {language === "es" ? "Procesando..." : "Processing..."}
                    </>
                  ) : (
                    <>
                      {t.payWith} {paymentType === "card" ? t.cardPaymentMethod : t.walletPaymentMethod}
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
          <ScrollBar orientation="vertical" />
        </ScrollArea>
      </SheetContent>
    </Sheet>
  )
}
