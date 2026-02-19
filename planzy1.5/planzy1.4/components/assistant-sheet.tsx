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

  const getAssistantResponse = (userMessage: string): string => {
    const msg = userMessage.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    
    // Contextual info about user
    const userPlansCreated = plans.filter(p => p.creatorId === user?.id).length
    const userPlansJoined = joinedPlans.length
    const hasPremium = premiumPlan !== null
    const hasWalletMoney = walletBalance > 0

    // Greetings
    if (msg.match(/^(hola|hey|buenas|hi|hello|ey|que tal|como estas)/)) {
      const greetings = language === "es"
        ? [
            `¡Hola! ¿Qué tal? Soy Oliva y estoy lista para ayudarte. ¿Buscas un plan para hoy o tienes alguna duda?`,
            `¡Hey! Encantada de verte por aquí. ¿En qué puedo echarte una mano?`,
            `¡Buenas! ¿Qué necesitas? Puedo ayudarte a encontrar planes, crear actividades o resolver cualquier duda.`
          ]
        : [
            `Hey there! I'm Oliva, ready to help. Looking for a plan or do you have any questions?`,
            `Hi! Great to see you here. How can I help you today?`,
            `Hello! What do you need? I can help you find plans, create activities, or answer any questions.`
          ]
      return greetings[Math.floor(Math.random() * greetings.length)]
    }

    // Thanks
    if (msg.match(/(gracias|thank|genial|perfecto|great|awesome|guay)/)) {
      return language === "es"
        ? "¡De nada! Si tienes más dudas, aquí estaré. ¡Que disfrutes de tus planes!"
        : "You're welcome! If you have more questions, I'll be here. Enjoy your plans!"
    }

    // Creating plans - detailed help
    if (msg.match(/(crear|nuevo|organizar|montar|hacer)/) && msg.match(/(plan|evento|actividad|quedada)/)) {
      return language === "es"
        ? `¡Genial que quieras crear un plan! Es muy fácil:\n\n1. Pulsa el botón '+' en la barra inferior\n2. Elige una categoría (deportes, gastronomía, etc.)\n3. Añade título, descripción y fecha\n4. Indica la ubicación y número de plazas\n5. ¡Publica y espera a que se unan!\n\n${!hasPremium ? 'Consejo: Con Premium puedes crear planes de hasta 20 personas y torneos.' : 'Como usuario Premium, puedes crear planes grandes y torneos.'}`
        : `Great that you want to create a plan! It's easy:\n\n1. Tap the '+' button in the bottom bar\n2. Choose a category (sports, food, etc.)\n3. Add title, description and date\n4. Set location and participant limit\n5. Publish and wait for people to join!\n\n${!hasPremium ? 'Tip: With Premium you can create plans for up to 20 people and tournaments.' : 'As a Premium user, you can create large plans and tournaments.'}`
    }

    // Joining plans
    if (msg.match(/(unir|apuntar|participar|inscribir|join|entrar)/)) {
      return language === "es"
        ? `Para unirte a un plan:\n\n1. Explora el feed o busca planes que te interesen\n2. Abre los detalles del plan\n3. Pulsa "Apuntarme"\n4. Si tiene coste, paga con tarjeta o monedero\n\n${userPlansJoined > 0 ? `Ya te has unido a ${userPlansJoined} plan${userPlansJoined > 1 ? 'es' : ''}. ¡Sigue así!` : 'Aún no te has unido a ningún plan. ¡Es hora de empezar!'}`
        : `To join a plan:\n\n1. Browse the feed or search for plans\n2. Open the plan details\n3. Tap "Join"\n4. If it has a cost, pay with card or wallet\n\n${userPlansJoined > 0 ? `You've joined ${userPlansJoined} plan${userPlansJoined > 1 ? 's' : ''}. Keep it up!` : 'You haven\'t joined any plans yet. Time to start!'}`
    }

    // Wallet and money
    if (msg.match(/(monedero|wallet|dinero|money|pagar|cobrar|saldo|retirar|withdraw)/)) {
      return language === "es"
        ? `Tu monedero virtual es muy útil:\n\n• Saldo actual: ${walletBalance.toFixed(2)}€\n• Recibes reembolsos automáticos si cancelas\n• Ganas dinero cuando otros se unen a tus planes de pago\n• Puedes retirar a tu banco, Bizum o PayPal sin comisión\n\n${hasWalletMoney ? '¡Tienes saldo disponible para usar o retirar!' : 'Tu monedero está vacío. Se llenará con ganancias y reembolsos.'}`
        : `Your virtual wallet is very useful:\n\n• Current balance: €${walletBalance.toFixed(2)}\n• Automatic refunds if you cancel\n• Earn money when others join your paid plans\n• Withdraw to bank, Bizum or PayPal with no fees\n\n${hasWalletMoney ? 'You have balance available to use or withdraw!' : 'Your wallet is empty. It will fill with earnings and refunds.'}`
    }

    // Premium plans
    if (msg.match(/(premium|pro|club|suscripcion|subscription|mejorar|upgrade)/)) {
      return language === "es"
        ? `Tenemos planes Premium para ti:\n\n🌟 **Pro** (4.99€/mes):\n• Sin anuncios\n• Planes de hasta 20 personas\n• 10 planes al mes\n• Insignia exclusiva\n\n👑 **Club** (9.99€/mes):\n• Todo lo de Pro\n• Crear torneos deportivos\n• Prioridad en búsquedas\n• Soporte VIP 24/7\n\n${premiumPlan ? `Actualmente tienes el plan ${premiumPlan === 'pro' ? 'Pro' : 'Club'}. ¡Gracias por tu apoyo!` : 'Aún no tienes Premium. ¡Pruébalo y mejora tu experiencia!'}`
        : `We have Premium plans for you:\n\n🌟 **Pro** (€4.99/month):\n• No ads\n• Plans up to 20 people\n• 10 plans per month\n• Exclusive badge\n\n👑 **Club** (€9.99/month):\n• Everything in Pro\n• Create sports tournaments\n• Search priority\n• VIP 24/7 support\n\n${premiumPlan ? `You currently have the ${premiumPlan === 'pro' ? 'Pro' : 'Club'} plan. Thanks for your support!` : 'You don\'t have Premium yet. Try it and improve your experience!'}`
    }

    // Tournaments
    if (msg.match(/(torneo|tournament|competicion|liga)/)) {
      return language === "es"
        ? `Los torneos son una función exclusiva del plan Club:\n\n• Elige el deporte (pádel, fútbol, baloncesto...)\n• Define número de equipos y jugadores por equipo\n• El sistema genera los brackets automáticamente\n• Gestiona resultados y clasificación\n\n${premiumPlan === 'club' ? '¡Tienes Club! Crea tu torneo desde el botón "+" seleccionando la opción de torneo.' : 'Necesitas el plan Club para crear torneos. ¿Te gustaría saber más?'}`
        : `Tournaments are an exclusive Club plan feature:\n\n• Choose the sport (padel, football, basketball...)\n• Set number of teams and players per team\n• System generates brackets automatically\n• Manage results and standings\n\n${premiumPlan === 'club' ? 'You have Club! Create your tournament from the "+" button by selecting tournament.' : 'You need the Club plan to create tournaments. Would you like to know more?'}`
    }

    // Chat functionality
    if (msg.match(/(chat|mensaje|hablar|contactar|comunicar|message)/)) {
      return language === "es"
        ? `Los chats en Planzy funcionan así:\n\n📱 **Chat de grupo**: Automático al unirte a un plan. Coordínate con otros participantes.\n\n💬 **Chat privado**: Envía mensajes directos a cualquier usuario desde su perfil.\n\nConsejos:\n• Puedes editar y eliminar tus mensajes\n• Las notificaciones te avisan de mensajes nuevos\n• Usa el chat para conocer mejor a los participantes antes del plan`
        : `Chats in Planzy work like this:\n\n📱 **Group chat**: Automatic when joining a plan. Coordinate with other participants.\n\n💬 **Private chat**: Send direct messages to any user from their profile.\n\nTips:\n• You can edit and delete your messages\n• Notifications alert you to new messages\n• Use chat to get to know participants before the plan`
    }

    // Search and discover
    if (msg.match(/(buscar|search|encontrar|descubrir|explorar|filtrar|filter)/)) {
      return language === "es"
        ? `Para encontrar planes perfectos para ti:\n\n🔍 **Búsqueda avanzada**:\n• Filtra por categoría (deportes, gastronomía...)\n• Busca por ubicación o ciudad\n• Encuentra por nombre de plan o usuario\n\n🗺️ **Mapa**: Ve planes cercanos geográficamente\n\n💡 Consejo: Usa varios filtros combinados para resultados más precisos.`
        : `To find perfect plans for you:\n\n🔍 **Advanced search**:\n• Filter by category (sports, food...)\n• Search by location or city\n• Find by plan name or user\n\n🗺️ **Map**: See nearby plans geographically\n\n💡 Tip: Use multiple filters combined for more precise results.`
    }

    // Verification
    if (msg.match(/(verificar|verificacion|verify|insignia|badge|confianza)/)) {
      return language === "es"
        ? `La verificación aumenta la confianza en tu perfil:\n\n✅ **Cómo verificarte**:\n1. Ve a tu perfil > Ajustes\n2. Selecciona "Verificación de identidad"\n3. Sube una selfie con tu DNI/NIE visible\n4. Esperamos la verificación (24-48h)\n\n🛡️ Los usuarios verificados generan más confianza y reciben más solicitudes de unión a sus planes.`
        : `Verification increases trust in your profile:\n\n✅ **How to verify**:\n1. Go to your profile > Settings\n2. Select "Identity verification"\n3. Upload a selfie with your ID visible\n4. Wait for verification (24-48h)\n\n🛡️ Verified users generate more trust and receive more join requests for their plans.`
    }

    // Safety - block/report
    if (msg.match(/(bloquear|block|denunciar|report|seguridad|safety|problema)/)) {
      return language === "es"
        ? `Tu seguridad es importante:\n\n🚫 **Bloquear usuario**: Desde su perfil, pulsa los 3 puntos > Bloquear. No verás sus planes ni mensajes.\n\n⚠️ **Denunciar**: Si alguien tiene comportamiento inapropiado, denúncialo desde su perfil. Nuestro equipo lo revisará.\n\n📋 Si tienes problemas graves, contacta con soporte desde Ajustes.`
        : `Your safety is important:\n\n🚫 **Block user**: From their profile, tap 3 dots > Block. You won't see their plans or messages.\n\n⚠️ **Report**: If someone behaves inappropriately, report them from their profile. Our team will review it.\n\n📋 For serious issues, contact support from Settings.`
    }

    // Who is Oliva / assistant info
    if (msg.match(/(quien eres|oliva|asistente|assistant|who are you|que puedes|what can you)/)) {
      return language === "es"
        ? `¡Soy Oliva! 🫒 Tu asistente virtual de Planzy.\n\nPuedo ayudarte con:\n• Crear y gestionar planes\n• Encontrar actividades cerca de ti\n• Explicarte cómo funciona la app\n• Resolver dudas sobre pagos y monedero\n• Información sobre Premium\n• Consejos de seguridad\n\n¡Pregúntame lo que necesites!`
        : `I'm Oliva! 🫒 Your Planzy virtual assistant.\n\nI can help you with:\n• Creating and managing plans\n• Finding activities near you\n• Explaining how the app works\n• Answering payment and wallet questions\n• Premium information\n• Safety tips\n\nAsk me anything you need!`
    }

    // Recommendations based on context
    if (msg.match(/(recomendar|sugerir|que hago|idea|aburrido|recommend|suggest|bored)/)) {
      const suggestions = language === "es"
        ? [
            `¿Qué te apetece hacer? Según tu zona, hay planes de deportes, gastronomía y ocio. ¡Explora el feed o usa el mapa para ver qué hay cerca!`,
            `Mi sugerencia: ${userPlansCreated === 0 ? 'crea tu primer plan y conoce gente nueva' : userPlansJoined < 3 ? 'únete a más planes para ampliar tu círculo' : 'sigue así, estás muy activo en Planzy'}!`,
            `¿Has probado la búsqueda por mapa? Es genial para descubrir planes cerca de ti que quizás no conocías.`
          ]
        : [
            `What do you feel like doing? In your area, there are sports, food and leisure plans. Explore the feed or use the map to see what's nearby!`,
            `My suggestion: ${userPlansCreated === 0 ? 'create your first plan and meet new people' : userPlansJoined < 3 ? 'join more plans to expand your circle' : 'keep it up, you\'re very active on Planzy'}!`,
            `Have you tried the map search? It's great for discovering plans near you that you might not know about.`
          ]
      return suggestions[Math.floor(Math.random() * suggestions.length)]
    }

    // Default intelligent responses
    const defaultResponses = language === "es"
      ? [
          `Hmm, no estoy segura de entender del todo. ¿Podrías darme más detalles? Puedo ayudarte con planes, pagos, chats, premium y mucho más.`,
          `Interesante pregunta. Para ayudarte mejor, ¿podrías especificar si es sobre crear planes, unirte a actividades, el monedero, o algo más?`,
          `Estoy aquí para ayudarte con todo lo relacionado con Planzy. Cuéntame más sobre lo que necesitas: ¿buscar planes, crear actividades, gestionar tu cuenta...?`,
          `¿Sabías que puedo ayudarte a encontrar planes perfectos para ti? Cuéntame qué tipo de actividades te gustan o qué dudas tienes.`
        ]
      : [
          `Hmm, I'm not sure I fully understand. Could you give me more details? I can help with plans, payments, chats, premium and much more.`,
          `Interesting question. To help you better, could you specify if it's about creating plans, joining activities, the wallet, or something else?`,
          `I'm here to help you with everything related to Planzy. Tell me more about what you need: finding plans, creating activities, managing your account...?`,
          `Did you know I can help you find perfect plans for you? Tell me what kind of activities you like or what questions you have.`
        ]

    return defaultResponses[Math.floor(Math.random() * defaultResponses.length)]
  }

  const handleSend = () => {
    if (!input.trim()) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
    }

    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setIsTyping(true)

    setTimeout(() => {
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: getAssistantResponse(input),
      }
      setMessages((prev) => [...prev, assistantMessage])
      setIsTyping(false)
    }, 1000)
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
