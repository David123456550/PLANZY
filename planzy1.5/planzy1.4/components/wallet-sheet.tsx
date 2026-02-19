"use client"

import { Badge } from "@/components/ui/badge"

import { useState } from "react"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Card, CardContent } from "@/components/ui/card"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import {
  Wallet,
  ArrowDownToLine,
  ArrowUpFromLine,
  Check,
  Loader2,
  BadgeCheck,
  TrendingUp,
  Building2,
  Smartphone,
  CreditCard,
  Plus,
  ArrowLeft,
  Trash2,
  Star,
} from "lucide-react"
import { useAppStore } from "@/lib/store"
import { useTranslation } from "@/lib/i18n"
import { useToast } from "@/hooks/use-toast"
import { format } from "date-fns"
import { es, enUS } from "date-fns/locale"

interface WalletSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

type TransferMethod = "bank" | "bizum" | "paypal"
type ViewMode = "main" | "withdraw" | "add" | "methods"

export function WalletSheet({ open, onOpenChange }: WalletSheetProps) {
  const {
    walletBalance,
    walletTransactions,
    withdrawFromWallet,
    depositToWallet,
    language,
    savedPaymentMethods,
    addSavedPaymentMethod,
    removeSavedPaymentMethod,
    setDefaultPaymentMethod,
  } = useAppStore()
  const t = useTranslation(language)
  const { toast } = useToast()
  const [viewMode, setViewMode] = useState<ViewMode>("main")
  const [transferMethod, setTransferMethod] = useState<TransferMethod>("bank")
  const [withdrawAmount, setWithdrawAmount] = useState("")
  const [addAmount, setAddAmount] = useState("")
  const [iban, setIban] = useState("")
  const [bizumPhone, setBizumPhone] = useState("")
  const [paypalEmail, setPaypalEmail] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)
  const [addingMethod, setAddingMethod] = useState<TransferMethod | null>(null)
  const dateLocale = language === "es" ? es : enUS

  const formatIban = (value: string) => {
    const cleaned = value.replace(/\s/g, "").toUpperCase()
    const matches = cleaned.match(/.{1,4}/g)
    return matches ? matches.join(" ") : cleaned
  }

  const handleWithdraw = () => {
    const amount = Number.parseFloat(withdrawAmount)
    if (!amount || amount <= 0 || amount > walletBalance) {
      toast({
        title: "Error",
        description: language === "es" ? "Cantidad no válida" : "Invalid amount",
        variant: "destructive",
      })
      return
    }

    const savedMethod = savedPaymentMethods.find((m) => m.type === transferMethod)

    if (!savedMethod) {
      if (transferMethod === "bank" && (!iban || iban.replace(/\s/g, "").length < 20)) {
        toast({
          title: "Error",
          description: language === "es" ? "IBAN no válido" : "Invalid IBAN",
          variant: "destructive",
        })
        return
      }
      if (transferMethod === "bizum" && (!bizumPhone || bizumPhone.length < 9)) {
        toast({
          title: "Error",
          description: language === "es" ? "Teléfono no válido" : "Invalid phone",
          variant: "destructive",
        })
        return
      }
      if (transferMethod === "paypal" && (!paypalEmail || !paypalEmail.includes("@"))) {
        toast({
          title: "Error",
          description: language === "es" ? "Email no válido" : "Invalid email",
          variant: "destructive",
        })
        return
      }
    }

    setIsProcessing(true)
    setTimeout(() => {
      withdrawFromWallet(amount)
      setIsProcessing(false)
      setViewMode("main")
      setWithdrawAmount("")
      setIban("")
      setBizumPhone("")
      setPaypalEmail("")
      toast({ title: t.withdrawSuccess, description: t.withdrawSuccessDesc })
    }, 2000)
  }

  const handleAddMoney = () => {
    const amount = Number.parseFloat(addAmount)
    if (!amount || amount <= 0) {
      toast({
        title: "Error",
        description: language === "es" ? "Cantidad no válida" : "Invalid amount",
        variant: "destructive",
      })
      return
    }

    const savedMethod = savedPaymentMethods.find((m) => m.type === transferMethod)

    if (!savedMethod) {
      if (transferMethod === "bank" && (!iban || iban.replace(/\s/g, "").length < 20)) {
        toast({
          title: "Error",
          description: language === "es" ? "IBAN no válido" : "Invalid IBAN",
          variant: "destructive",
        })
        return
      }
      if (transferMethod === "bizum" && (!bizumPhone || bizumPhone.length < 9)) {
        toast({
          title: "Error",
          description: language === "es" ? "Teléfono no válido" : "Invalid phone",
          variant: "destructive",
        })
        return
      }
      if (transferMethod === "paypal" && (!paypalEmail || !paypalEmail.includes("@"))) {
        toast({
          title: "Error",
          description: language === "es" ? "Email no válido" : "Invalid email",
          variant: "destructive",
        })
        return
      }
    }

    setIsProcessing(true)
    setTimeout(() => {
      depositToWallet(amount, language === "es" ? "Ingreso desde cuenta" : "Deposit from account")
      setIsProcessing(false)
      setViewMode("main")
      setAddAmount("")
      setIban("")
      setBizumPhone("")
      setPaypalEmail("")
      toast({ title: t.addSuccess, description: t.addSuccessDesc })
    }, 2000)
  }

  const handleSavePaymentMethod = () => {
    if (!addingMethod) return

    const methodData: any = { type: addingMethod }

    if (addingMethod === "bank") {
      if (!iban || iban.replace(/\s/g, "").length < 20) {
        toast({
          title: "Error",
          description: language === "es" ? "IBAN no válido" : "Invalid IBAN",
          variant: "destructive",
        })
        return
      }
      methodData.iban = iban
    } else if (addingMethod === "bizum") {
      if (!bizumPhone || bizumPhone.length < 9) {
        toast({
          title: "Error",
          description: language === "es" ? "Teléfono no válido" : "Invalid phone",
          variant: "destructive",
        })
        return
      }
      methodData.bizumPhone = bizumPhone
    } else if (addingMethod === "paypal") {
      if (!paypalEmail || !paypalEmail.includes("@")) {
        toast({
          title: "Error",
          description: language === "es" ? "Email no válido" : "Invalid email",
          variant: "destructive",
        })
        return
      }
      methodData.paypalEmail = paypalEmail
    }

    addSavedPaymentMethod(methodData)
    setAddingMethod(null)
    setIban("")
    setBizumPhone("")
    setPaypalEmail("")
    toast({ title: t.methodAdded })
  }

  const getTransactionStyle = (type: string) => {
    switch (type) {
      case "income":
        return {
          icon: <TrendingUp className="h-5 w-5" />,
          bgColor: "bg-blue-100 text-blue-600",
          textColor: "text-blue-600",
          prefix: "+",
        }
      case "refund":
        return {
          icon: <ArrowDownToLine className="h-5 w-5" />,
          bgColor: "bg-green-100 text-green-600",
          textColor: "text-green-600",
          prefix: "+",
        }
      case "deposit":
        return {
          icon: <Plus className="h-5 w-5" />,
          bgColor: "bg-emerald-100 text-emerald-600",
          textColor: "text-emerald-600",
          prefix: "+",
        }
      case "withdrawal":
        return {
          icon: <ArrowUpFromLine className="h-5 w-5" />,
          bgColor: "bg-orange-100 text-[#ef7418]",
          textColor: "text-[#ef7418]",
          prefix: "-",
        }
      default:
        return {
          icon: <ArrowDownToLine className="h-5 w-5" />,
          bgColor: "bg-gray-100 text-gray-600",
          textColor: "text-gray-600",
          prefix: "",
        }
    }
  }

  const getTransactionLabel = (type: string) => {
    switch (type) {
      case "income":
        return t.income
      case "refund":
        return t.refund
      case "deposit":
        return t.deposit
      case "withdrawal":
        return t.withdrawal
      default:
        return type
    }
  }

  const getMethodIcon = (type: TransferMethod) => {
    switch (type) {
      case "bank":
        return <Building2 className="h-5 w-5 text-[#1a95a4]" />
      case "bizum":
        return <Smartphone className="h-5 w-5 text-[#1a95a4]" />
      case "paypal":
        return <CreditCard className="h-5 w-5 text-[#1a95a4]" />
    }
  }

  const getMethodLabel = (type: TransferMethod) => {
    switch (type) {
      case "bank":
        return t.bankAccount
      case "bizum":
        return t.bizum
      case "paypal":
        return t.paypal
    }
  }

  const renderMethodSelection = () => (
    <RadioGroup value={transferMethod} onValueChange={(v) => setTransferMethod(v as TransferMethod)}>
      {(["bank", "bizum", "paypal"] as TransferMethod[]).map((method) => {
        const savedMethod = savedPaymentMethods.find((m) => m.type === method)
        return (
          <div key={method} className="flex items-center space-x-3 rounded-lg border p-3">
            <RadioGroupItem value={method} id={method} />
            <Label htmlFor={method} className="flex flex-1 items-center gap-3 cursor-pointer">
              {getMethodIcon(method)}
              <div className="flex-1">
                <span>{getMethodLabel(method)}</span>
                {savedMethod && (
                  <p className="text-xs text-muted-foreground">
                    {savedMethod.iban
                      ? `****${savedMethod.iban.slice(-4)}`
                      : savedMethod.bizumPhone
                        ? `****${savedMethod.bizumPhone.slice(-4)}`
                        : savedMethod.paypalEmail}
                  </p>
                )}
              </div>
              {savedMethod?.isDefault && <Star className="h-4 w-4 text-[#ef7418] fill-[#ef7418]" />}
            </Label>
          </div>
        )
      })}
    </RadioGroup>
  )

  const renderMethodInput = () => {
    const savedMethod = savedPaymentMethods.find((m) => m.type === transferMethod)
    if (savedMethod) return null

    return (
      <div className="space-y-2 mt-4">
        {transferMethod === "bank" && (
          <>
            <Label>{t.enterBankAccount}</Label>
            <Input
              placeholder={t.ibanPlaceholder}
              value={iban}
              onChange={(e) => setIban(formatIban(e.target.value))}
              maxLength={29}
            />
          </>
        )}
        {transferMethod === "bizum" && (
          <>
            <Label>{t.bizumPhone}</Label>
            <Input
              type="tel"
              placeholder="612 345 678"
              value={bizumPhone}
              onChange={(e) => setBizumPhone(e.target.value)}
              maxLength={12}
            />
          </>
        )}
        {transferMethod === "paypal" && (
          <>
            <Label>{t.paypalEmail}</Label>
            <Input
              type="email"
              placeholder="email@paypal.com"
              value={paypalEmail}
              onChange={(e) => setPaypalEmail(e.target.value)}
            />
          </>
        )}
      </div>
    )
  }

  const renderWithdrawForm = () => (
    <div className="space-y-4">
      <Button variant="ghost" size="sm" className="gap-2" onClick={() => setViewMode("main")}>
        <ArrowLeft className="h-4 w-4" />
        {language === "es" ? "Volver" : "Back"}
      </Button>

      <h3 className="font-semibold">{t.selectWithdrawMethod}</h3>
      {renderMethodSelection()}
      {renderMethodInput()}

      <div className="space-y-2">
        <Label>{t.withdrawAmount}</Label>
        <div className="relative">
          <Input
            type="number"
            placeholder="0.00"
            value={withdrawAmount}
            onChange={(e) => setWithdrawAmount(e.target.value)}
            max={walletBalance}
            className="pr-8"
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">€</span>
        </div>
        <Button
          variant="link"
          size="sm"
          className="text-[#1a95a4] p-0 h-auto"
          onClick={() => setWithdrawAmount(walletBalance.toString())}
        >
          {language === "es" ? "Retirar todo" : "Withdraw all"}
        </Button>
      </div>

      <Button
        className="w-full bg-[#ef7418] hover:bg-[#ef7418]/90 text-white"
        onClick={handleWithdraw}
        disabled={isProcessing || !withdrawAmount}
      >
        {isProcessing ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            {language === "es" ? "Procesando..." : "Processing..."}
          </>
        ) : (
          <>
            <Check className="mr-2 h-4 w-4" />
            {t.withdraw}
          </>
        )}
      </Button>
    </div>
  )

  const renderAddMoneyForm = () => (
    <div className="space-y-4">
      <Button variant="ghost" size="sm" className="gap-2" onClick={() => setViewMode("main")}>
        <ArrowLeft className="h-4 w-4" />
        {language === "es" ? "Volver" : "Back"}
      </Button>

      <h3 className="font-semibold">{t.selectAddMethod}</h3>
      {renderMethodSelection()}
      {renderMethodInput()}

      <div className="space-y-2">
        <Label>{t.amountToAdd}</Label>
        <div className="relative">
          <Input
            type="number"
            placeholder="0.00"
            value={addAmount}
            onChange={(e) => setAddAmount(e.target.value)}
            className="pr-8"
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">€</span>
        </div>
      </div>

      <Button
        className="w-full bg-[#1a95a4] hover:bg-[#1a95a4]/90 text-white"
        onClick={handleAddMoney}
        disabled={isProcessing || !addAmount}
      >
        {isProcessing ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            {language === "es" ? "Procesando..." : "Processing..."}
          </>
        ) : (
          <>
            <Plus className="mr-2 h-4 w-4" />
            {t.addMoneyToWallet}
          </>
        )}
      </Button>
    </div>
  )

  const renderPaymentMethods = () => (
    <div className="space-y-4">
      <Button variant="ghost" size="sm" className="gap-2" onClick={() => setViewMode("main")}>
        <ArrowLeft className="h-4 w-4" />
        {language === "es" ? "Volver" : "Back"}
      </Button>

      <h3 className="font-semibold">{t.paymentMethodsConfig}</h3>

      {savedPaymentMethods.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <CreditCard className="mx-auto h-12 w-12 mb-3 opacity-50" />
          <p className="text-sm">{language === "es" ? "No tienes métodos guardados" : "No saved methods"}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {savedPaymentMethods.map((method) => (
            <div key={method.type} className="flex items-center justify-between rounded-lg border p-4">
              <div className="flex items-center gap-3">
                {getMethodIcon(method.type as TransferMethod)}
                <div>
                  <p className="font-medium">{getMethodLabel(method.type as TransferMethod)}</p>
                  <p className="text-xs text-muted-foreground">
                    {method.iban
                      ? `****${method.iban.replace(/\s/g, "").slice(-4)}`
                      : method.bizumPhone
                        ? `****${method.bizumPhone.slice(-4)}`
                        : method.paypalEmail}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {method.isDefault ? (
                  <Badge className="bg-[#ef7418]">{t.defaultMethod}</Badge>
                ) : (
                  <Button variant="ghost" size="sm" onClick={() => setDefaultPaymentMethod(method.type)}>
                    <Star className="h-4 w-4" />
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-destructive"
                  onClick={() => removeSavedPaymentMethod(method.type)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Separator />

      <h4 className="font-medium">{t.addPaymentMethod}</h4>

      {addingMethod ? (
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
            {getMethodIcon(addingMethod)}
            <span className="font-medium">{getMethodLabel(addingMethod)}</span>
          </div>

          {addingMethod === "bank" && (
            <div className="space-y-2">
              <Label>{t.enterBankAccount}</Label>
              <Input
                placeholder={t.ibanPlaceholder}
                value={iban}
                onChange={(e) => setIban(formatIban(e.target.value))}
                maxLength={29}
              />
            </div>
          )}
          {addingMethod === "bizum" && (
            <div className="space-y-2">
              <Label>{t.bizumPhone}</Label>
              <Input
                type="tel"
                placeholder="612 345 678"
                value={bizumPhone}
                onChange={(e) => setBizumPhone(e.target.value)}
                maxLength={12}
              />
            </div>
          )}
          {addingMethod === "paypal" && (
            <div className="space-y-2">
              <Label>{t.paypalEmail}</Label>
              <Input
                type="email"
                placeholder="email@paypal.com"
                value={paypalEmail}
                onChange={(e) => setPaypalEmail(e.target.value)}
              />
            </div>
          )}

          <div className="flex gap-2">
            <Button variant="outline" className="flex-1 bg-transparent" onClick={() => setAddingMethod(null)}>
              {t.cancel}
            </Button>
            <Button className="flex-1 bg-[#1a95a4] hover:bg-[#1a95a4]/90" onClick={handleSavePaymentMethod}>
              {t.save}
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-3">
          {(["bank", "bizum", "paypal"] as TransferMethod[]).map((method) => {
            const alreadySaved = savedPaymentMethods.some((m) => m.type === method)
            return (
              <Button
                key={method}
                variant="outline"
                className="flex-col h-auto py-4 bg-transparent"
                disabled={alreadySaved}
                onClick={() => setAddingMethod(method)}
              >
                {getMethodIcon(method)}
                <span className="text-xs mt-2">{getMethodLabel(method)}</span>
              </Button>
            )
          })}
        </div>
      )}
    </div>
  )

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[85vh] rounded-t-2xl p-0 flex flex-col overflow-hidden">
        <SheetHeader className="px-6 pt-6 pb-4 shrink-0 border-b">
          <SheetTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5 text-[#1a95a4]" />
            {t.wallet}
          </SheetTitle>
        </SheetHeader>

        <ScrollArea className="flex-1 overflow-auto">
          <div className="px-6 py-4 pb-8">
            <div className="space-y-6 pb-6">
              {viewMode === "main" ? (
                <>
                  <Card className="bg-gradient-to-br from-[#1a95a4] to-[#1a95a4]/80">
                    <CardContent className="p-6 text-center">
                      <p className="text-sm text-white/80">{t.walletBalance}</p>
                      <p className="text-4xl font-bold text-white mt-2">{walletBalance.toFixed(2)}€</p>
                      <div className="flex items-center justify-center gap-1 mt-2">
                        <BadgeCheck className="h-4 w-4 text-white/80" />
                        <span className="text-xs text-white/80">{t.secureBalance}</span>
                      </div>
                    </CardContent>
                  </Card>

                  <div className="grid grid-cols-2 gap-3">
                    <Button
                      onClick={() => setViewMode("add")}
                      className="bg-[#1a95a4] hover:bg-[#1a95a4]/90 text-white h-auto py-4 flex-col gap-2"
                    >
                      <Plus className="h-5 w-5" />
                      <span className="text-sm">+ {language === "es" ? "Ingresar..." : "Deposit..."}</span>
                    </Button>
                    <Button
                      onClick={() => setViewMode("withdraw")}
                      className="bg-[#ef7418] hover:bg-[#ef7418]/90 text-white h-auto py-4 flex-col gap-2"
                    >
                      <ArrowUpFromLine className="h-5 w-5" />
                      <span className="text-sm">{t.withdraw}</span>
                    </Button>
                  </div>

                  <Button variant="outline" className="w-full bg-transparent" onClick={() => setViewMode("methods")}>
                    <CreditCard className="mr-2 h-4 w-4" />
                    {t.paymentMethodsConfig}
                  </Button>

                  <Separator />

                  <div>
                    <h3 className="font-semibold mb-4">{t.recentTransactions}</h3>
                    {walletTransactions.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <Wallet className="mx-auto h-12 w-12 mb-3 opacity-50" />
                        <p className="text-sm">{t.noTransactions}</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {walletTransactions.map((tx) => {
                          const style = getTransactionStyle(tx.type)
                          return (
                            <div key={tx.id} className="flex items-center justify-between rounded-lg border p-4">
                              <div className="flex items-center gap-3">
                                <div
                                  className={`flex h-10 w-10 items-center justify-center rounded-full ${style.bgColor}`}
                                >
                                  {style.icon}
                                </div>
                                <div>
                                  <p className="font-medium">{tx.description}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {format(new Date(tx.createdAt), "d MMM, HH:mm", { locale: dateLocale })}
                                  </p>
                                </div>
                              </div>
                              <p className={`font-semibold ${style.textColor}`}>
                                {style.prefix}
                                {tx.amount.toFixed(2)}€
                              </p>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                </>
              ) : viewMode === "withdraw" ? (
                renderWithdrawForm()
              ) : viewMode === "add" ? (
                renderAddMoneyForm()
              ) : (
                renderPaymentMethods()
              )}
            </div>
          </div>
          <ScrollBar orientation="vertical" />
        </ScrollArea>
      </SheetContent>
    </Sheet>
  )
}
