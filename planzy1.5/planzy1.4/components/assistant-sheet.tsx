"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import { Send, User, Loader2, Sparkles } from "lucide-react"
import { useAppStore } from "@/lib/store"
import { useTranslation } from "@/lib/i18n"
import { getOlivaLocalReply, type OlivaContext } from "@/lib/oliva-assistant"
import { getAssistantAIReply } from "@/lib/assistant-ai"

interface AssistantSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
}

export function AssistantSheet({ open, onOpenChange }: AssistantSheetProps) {
  const { language, user, plans, joinedPlans, premiumPlan, walletBalance } = useAppStore()
  const t = useTranslation(language)
  const scrollRef = useRef<HTMLDivElement>(null)
  const [isTyping, setIsTyping] = useState(false)

  const welcomeMessage = language === "es" 
    ? `¡Hola${user?.name ? ` ${user.name.split(' ')[0]}` : ''}! Soy Oliva, tu asistente personal de Planzy. Estoy aquí para ayudarte a descubrir planes, resolver dudas y sacar el máximo partido a la app. ¿En qué puedo ayudarte hoy?`
    : `Hi${user?.name ? ` ${user.name.split(' ')[0]}` : ''}! I'm Oliva, your personal Planzy assistant. I'm here to help you discover plans, answer questions, and get the most out of the app. How can I help you today?`

  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "assistant",
      content: welcomeMessage,
    },
  ])
  const [input, setInput] = useState("")

  useEffect(() => {
    if (scrollRef.current) {
      const scrollElement = scrollRef.current.querySelector("[data-radix-scroll-area-viewport]")
      if (scrollElement) {
        scrollElement.scrollTop = scrollElement.scrollHeight
      }
    }
  }, [messages])

  const handleSend = async () => {
    const text = input.trim()
    if (!text || isTyping) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: text,
    }

    const historyBefore = messages.map((m) => ({ role: m.role, content: m.content }))

    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setIsTyping(true)

    const olivaCtx: OlivaContext = {
      language,
      userName: user?.name,
      premiumPlan,
      walletBalance,
      joinedPlanCount: joinedPlans.length,
      createdPlanCount: plans.filter((p) => p.creator?.id === user?.id).length,
      plans,
    }

    const locale = language === "es" ? "es-ES" : "en-GB"
    const planSummaries = plans.slice(0, 18).map((p) => ({
      title: p.title,
      category: p.category,
      city: p.location?.city ?? "",
      dateLabel: p.date instanceof Date ? p.date.toLocaleDateString(locale) : String(p.date),
    }))

    const tryAi = async () => {
      try {
        return await getAssistantAIReply(text, historyBefore, {
            language,
            userName: user?.name,
            premiumPlan,
            walletBalance,
            joinedPlanCount: joinedPlans.length,
            createdPlanCount: olivaCtx.createdPlanCount,
            planSummaries,
        })
      } catch {
        return null
      }
    }

    const [aiReply] = await Promise.all([tryAi(), new Promise((r) => setTimeout(r, 400))])
    const content = aiReply ?? getOlivaLocalReply(text, olivaCtx, [...historyBefore, { role: "user", content: text }])

    const assistantMessage: Message = {
      id: (Date.now() + 1).toString(),
      role: "assistant",
      content,
    }
    setMessages((prev) => [...prev, assistantMessage])
    setIsTyping(false)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="flex w-full flex-col sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-3">
            <div className="relative">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-green-500 to-emerald-600 text-white font-bold text-lg">
                O
              </div>
              <Sparkles className="absolute -right-1 -top-1 h-4 w-4 text-amber-500" />
            </div>
            <div className="flex flex-col items-start">
              <span className="text-base font-semibold">Oliva</span>
              <span className="text-xs text-muted-foreground font-normal">
                {language === "es" ? "Tu asistente de Planzy" : "Your Planzy assistant"}
              </span>
            </div>
          </SheetTitle>
        </SheetHeader>

        {/* Messages */}
        <ScrollArea ref={scrollRef} className="flex-1 overflow-auto py-4">
          <div className="space-y-4 pr-4">
            {messages.map((message) => (
              <div key={message.id} className={`flex gap-3 ${message.role === "user" ? "flex-row-reverse" : ""}`}>
                <Avatar className="h-8 w-8 flex-shrink-0">
                  {message.role === "assistant" ? (
                    <AvatarFallback className="bg-gradient-to-br from-green-500 to-emerald-600 text-white font-semibold">
                      O
                    </AvatarFallback>
                  ) : (
                    <>
                      <AvatarImage src={user?.avatar || "/placeholder.svg"} />
                      <AvatarFallback className="bg-[#ef7418] text-white">
                        <User className="h-4 w-4" />
                      </AvatarFallback>
                    </>
                  )}
                </Avatar>
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-2.5 ${
                    message.role === "user" ? "bg-[#ef7418] text-white" : "bg-muted"
                  }`}
                >
                  <p className="text-sm whitespace-pre-line">{message.content}</p>
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex gap-3">
                <Avatar className="h-8 w-8 flex-shrink-0">
                  <AvatarFallback className="bg-gradient-to-br from-green-500 to-emerald-600 text-white font-semibold">
                    O
                  </AvatarFallback>
                </Avatar>
                <div className="rounded-2xl px-4 py-2.5 bg-muted flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">
                    {language === "es" ? "Oliva está escribiendo..." : "Oliva is typing..."}
                  </span>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Input */}
        <div className="flex gap-2 border-t pt-4">
          <Input
            placeholder={t.askAssistant}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyPress}
          />
          <Button
            size="icon"
            className="bg-[#ef7418] hover:bg-[#ef7418]/90 text-white"
            onClick={handleSend}
            disabled={!input.trim() || isTyping}
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
