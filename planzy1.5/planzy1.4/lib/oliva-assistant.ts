/**
 * Oliva: respuestas locales con contexto de la app (sin API externa).
 * Con OPENAI_API_KEY, el cliente puede llamar antes a getAssistantAIReply.
 */

import type { Plan, PremiumPlan } from "@/lib/types"

export interface OlivaContext {
  language: "es" | "en"
  userName?: string
  premiumPlan: PremiumPlan
  walletBalance: number
  joinedPlanCount: number
  createdPlanCount: number
  plans: Plan[]
}

export type OlivaHistoryItem = { role: "user" | "assistant"; content: string }

function normalize(msg: string): string {
  return msg
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim()
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]!
}

function formatPlanLine(p: Plan, lang: "es" | "en"): string {
  const city = p.location?.city || ""
  const when = p.date instanceof Date ? p.date.toLocaleDateString(lang === "es" ? "es-ES" : "en-GB") : String(p.date)
  const price =
    p.pricePerPerson != null && p.pricePerPerson > 0
      ? lang === "es"
        ? ` · ${p.pricePerPerson}€`
        : ` · €${p.pricePerPerson}`
      : ""
  return `• ${p.title} (${p.category}${city ? `, ${city}` : ""}) — ${when}${price}`
}

function suggestPlansFromMessage(msg: string, plans: Plan[], lang: "es" | "en", limit: number): string | null {
  const n = normalize(msg)
  const now = Date.now()
  const upcoming = plans.filter((p) => {
    const t = p.date instanceof Date ? p.date.getTime() : new Date(p.date as unknown as string).getTime()
    return !Number.isNaN(t) && t >= now - 86400000
  })

  if (upcoming.length === 0) return null

  const categoryHints: Record<string, string[]> = {
    deportes: ["deport", "sport", "padel", "futbol", "tenis", "running", "gym", "fitness", "baloncesto", "basket"],
    gastronomia: ["comida", "food", "restaur", "cena", "brunch", "tapas", "gastro", "cenar", "comer"],
    ocio: ["ocio", "leisure", "cine", "party", "fiesta", "musica", "juego", "game"],
    naturaleza: ["natur", "hiking", "sender", "montana", "playa", "aire libre"],
    cultura: ["cultura", "museum", "museo", "arte", "teatro"],
  }

  let pool = upcoming
  for (const [cat, keys] of Object.entries(categoryHints)) {
    if (keys.some((k) => n.includes(k))) {
      const filtered = upcoming.filter(
        (p) =>
          normalize(p.category).includes(cat) ||
          keys.some((k) => normalize(`${p.title} ${p.description}`).includes(k)),
      )
      if (filtered.length > 0) {
        pool = filtered
        break
      }
    }
  }

  const slice = pool.slice(0, limit)
  if (slice.length === 0) return null

  const intro =
    lang === "es"
      ? "Estos planes encajan con lo que comentas o están cerca en el tiempo:\n\n"
      : "These plans match what you said or are coming up soon:\n\n"
  return intro + slice.map((p) => formatPlanLine(p, lang)).join("\n")
}

function lastUserTurn(history: OlivaHistoryItem[]): string {
  const rev = [...history].reverse()
  const lastUser = rev.find((m) => m.role === "user")
  return lastUser?.content?.trim() || ""
}

function effectiveQuery(userMessage: string, history: OlivaHistoryItem[]): string {
  const t = userMessage.trim()
  if (t.length >= 12) return t
  const short = /^(si|sí|ok|vale|claro|perfecto|genial|yes|yep|sure|no|nop|nope)\.?$/i.test(t)
  if (!short) return t
  const prev = lastUserTurn(history.slice(0, -1))
  if (prev) return `${prev} ${t}`
  return t
}

export function getOlivaLocalReply(userMessage: string, ctx: OlivaContext, history: OlivaHistoryItem[]): string {
  const raw = effectiveQuery(userMessage, history)
  const msg = normalize(raw)

  const hasPremium = ctx.premiumPlan !== "free"
  const hasWalletMoney = ctx.walletBalance > 0
  const es = ctx.language === "es"
  const firstName = ctx.userName?.split(/\s+/)[0]

  if (
    msg.match(
      /(login|iniciar sesion|registr|cuenta|correo|email|codigo|code|verif|password|contrasena|olvid|forgot|reset)/,
    )
  ) {
    return es
      ? `Sobre **cuenta y acceso** en Planzy:\n\n• **Registro / login**: usamos un **código por correo** para entrar con seguridad.\n• **¿No llega el mail?** Revisa spam y el correo escrito.\n• **Contraseña olvidada**: en acceso, **“He olvidado mi contraseña”**; recibirás un código para una nueva.\n\nSi falla, cierra sesión y pide otro código.`
      : `**Account & sign-in** on Planzy:\n\n• **Sign up / login**: we use an **email code** for secure access.\n• **No email?** Check spam and the address.\n• **Forgot password**: use **“Forgot password”** on sign-in; you’ll get a code for a new password.\n\nIf it fails, sign out and request a new code.`
  }

  if (msg.match(/(notific|alert|push|perfil|profile|avatar|bio|ajustes|settings|idioma|language)/)) {
    return es
      ? `**Perfil y notificaciones**:\n\n• **Perfil**: toca tu foto para nombre, bio, intereses y avatar.\n• **Notificaciones**: en Ajustes activa o silencia planes, chats y pagos.\n• **Idioma**: español/inglés en Ajustes o el selector de la app.`
      : `**Profile & notifications**:\n\n• **Profile**: tap your photo for name, bio, interests, avatar.\n• **Notifications**: in Settings toggle plans, chats, and payments.\n• **Language**: ES/EN in Settings or the app selector.`
  }

  if (msg.match(/^(hola|hey|buenas|hi|hello|ey|que tal|como estas)/)) {
    const greetings = es
      ? [
          `¡Hola${firstName ? `, ${firstName}` : ""}! Soy Oliva. ¿Buscas un plan para hoy o tienes alguna duda?`,
          `¡Hey${firstName ? ` ${firstName}` : ""}! ¿En qué puedo echarte una mano con Planzy?`,
          `¡Buenas! Puedo ayudarte con planes, pagos, chats o Premium. ¿Qué necesitas?`,
        ]
      : [
          `Hey${firstName ? ` ${firstName}` : ""}! I'm Oliva. Looking for a plan or have a question?`,
          `Hi! How can I help you with Planzy today?`,
          `Hello! I can help with plans, payments, chats, or Premium. What do you need?`,
        ]
    return pick(greetings)
  }

  if (msg.match(/(gracias|thank|genial|perfecto|great|awesome|guay)/)) {
    return es
      ? "¡De nada! Si tienes más dudas, aquí estaré. ¡Que disfrutes de tus planes!"
      : "You're welcome! If you have more questions, I'll be here. Enjoy your plans!"
  }

  if (msg.match(/(cancelar|leave|salir del plan|abandonar)/) && msg.match(/plan|event/)) {
    return es
      ? `Para **salirte de un plan**:\n\n1. Abre el plan en el que participas\n2. Busca la opción de salir / cancelar participación\n3. Si pagaste, según las reglas del plan puede aplicarse reembolso al **monedero**\n\nSi no ves el botón, asegúrate de estar unido desde “Mis planes”.`
      : `To **leave a plan**:\n\n1. Open the plan you joined\n2. Use leave / cancel participation\n3. If you paid, refunds may go to your **wallet** per plan rules\n\nIf you don’t see the option, check you joined from “My plans”.`
  }

  if (msg.match(/(crear|nuevo|organizar|montar)/) && msg.match(/(plan|evento|actividad|quedada)/)) {
    return es
      ? `¡Genial que quieras crear un plan!\n\n1. Pulsa **'+'** abajo\n2. Elige **categoría**\n3. Título, descripción, **fecha** y foto si quieres\n4. Ubicación y **plazas**\n5. Publica\n\n${!hasPremium ? "Con **Premium** puedes planes más grandes y torneos (Club)." : ctx.premiumPlan === "club" ? "Con **Club** puedes crear **torneos** desde '+'." : "Con **Pro/Club** tienes más capacidad para planes grandes."}`
      : `To create a plan:\n\n1. Tap **'+'** at the bottom\n2. Pick a **category**\n3. Title, description, **date**, optional image\n4. Location and **spots**\n5. Publish\n\n${!hasPremium ? "**Premium** unlocks bigger plans and tournaments (Club)." : ctx.premiumPlan === "club" ? "With **Club**, create **tournaments** from '+'." : "**Pro/Club** gives you more room for big plans."}`
  }

  if (msg.match(/(unir|apuntar|participar|inscribir|join|entrar)/)) {
    return es
      ? `Para **unirte**:\n\n1. Explora el feed o el mapa\n2. Abre el plan → **Apuntarme**\n3. Si hay precio: tarjeta o **monedero**\n\n${ctx.joinedPlanCount > 0 ? `Llevas **${ctx.joinedPlanCount}** plan${ctx.joinedPlanCount > 1 ? "es" : ""} apuntado${ctx.joinedPlanCount > 1 ? "s" : ""}.` : "Aún no estás en ningún plan: ¡elige uno que te motive!"}`
      : `To **join**:\n\n1. Browse feed or map\n2. Open plan → **Join**\n3. If paid: card or **wallet**\n\n${ctx.joinedPlanCount > 0 ? `You're in **${ctx.joinedPlanCount}** plan(s).` : "You haven't joined yet—pick something fun!"}`
  }

  if (msg.match(/(monedero|wallet|dinero|money|pagar|cobrar|saldo|retirar|withdraw)/)) {
    return es
      ? `**Monedero**\n\n• Saldo: **${ctx.walletBalance.toFixed(2)}€**\n• Reembolsos al cancelar\n• Cobras cuando otros se unen a tus planes de pago\n• Retiros sin comisión (según integración)\n\n${hasWalletMoney ? "Tienes saldo para usar o retirar." : "Tu monedero está en cero; se llena con ventas y reembolsos."}`
      : `**Wallet**\n\n• Balance: **€${ctx.walletBalance.toFixed(2)}**\n• Refunds when you cancel\n• Earnings when others join your paid plans\n• Withdrawals without fees (where supported)\n\n${hasWalletMoney ? "You have balance to spend or withdraw." : "Wallet is empty; it fills from sales and refunds."}`
  }

  if (msg.match(/(premium|pro|club|suscripcion|subscription|mejorar|upgrade)/)) {
    return es
      ? `**Premium**\n\n🌟 **Pro** (~4.99€/mes): sin anuncios, planes más grandes, cupo mensual de creación.\n👑 **Club**: todo Pro + **torneos** y extras.\n\n${hasPremium ? `Tienes **${ctx.premiumPlan === "pro" ? "Pro" : "Club"}**. ¡Gracias!` : "Aún no tienes Premium: ábrelo desde tu perfil o cuando la app te lo proponga."}`
      : `**Premium**\n\n🌟 **Pro**: no ads, bigger plans, monthly creation quota.\n👑 **Club**: Pro + **tournaments** and extras.\n\n${hasPremium ? `You have **${ctx.premiumPlan === "pro" ? "Pro" : "Club"}**. Thanks!` : "No Premium yet—open it from your profile or when the app offers it."}`
  }

  if (msg.match(/(torneo|tournament|competicion|liga)/)) {
    return es
      ? `Los **torneos** son de **Club**:\n\n• Deporte, equipos, brackets\n• Resultados y clasificación\n\n${ctx.premiumPlan === "club" ? "Tienes Club: créalos desde **'+'**." : "Necesitas **Club** para crear torneos."}`
      : `**Tournaments** are **Club**:\n\n• Sport, teams, brackets\n• Results and standings\n\n${ctx.premiumPlan === "club" ? "You have Club: create from **'+'**." : "You need **Club** to create tournaments."}`
  }

  if (msg.match(/(chat|mensaje|hablar|contactar|comunicar|message)/)) {
    return es
      ? `**Chats**\n\n• **Grupo**: al unirte a un plan.\n• **Privado**: desde el perfil de un usuario.\n\nPuedes editar o borrar tus mensajes; las notificaciones avisan de novedades.`
      : `**Chats**\n\n• **Group**: when you join a plan.\n• **Private**: from a user’s profile.\n\nEdit/delete your messages; notifications for updates.`
  }

  if (msg.match(/(buscar|search|encontrar|descubrir|explorar|filtrar|filter|mapa|map)/)) {
    const extra = suggestPlansFromMessage(raw, ctx.plans, ctx.language, 3)
    return es
      ? `**Encontrar planes**\n\n• Filtros por categoría, zona, texto\n• **Mapa** para ver qué hay cerca\n\n${extra ? `${extra}\n\n` : ""}Combina filtros para afinar resultados.`
      : `**Find plans**\n\n• Filters: category, area, text\n• **Map** for nearby\n\n${extra ? `${extra}\n\n` : ""}Combine filters to narrow down.`
  }

  if (msg.match(/(verificar|verificacion|verify|insignia|badge|confianza|dni)/)) {
    return es
      ? `**Verificación**: en Perfil > Ajustes, flujo de identidad si está activo. Los perfiles verificados generan más confianza al organizar o unirse a planes.`
      : `**Verification**: Profile > Settings if identity flow is enabled. Verified profiles build more trust.`
  }

  if (msg.match(/(bloquear|block|denunciar|report|seguridad|safety)/)) {
    return es
      ? `**Seguridad**\n\n• **Bloquear**: perfil del usuario → menú.\n• **Denunciar**: comportamiento inapropiado desde su perfil.\n\nPara casos graves, contacta soporte desde Ajustes si está disponible.`
      : `**Safety**\n\n• **Block**: user profile → menu.\n• **Report**: inappropriate behavior from their profile.\n\nFor serious cases, use support from Settings if available.`
  }

  if (msg.match(/(quien eres|oliva|asistente|assistant|who are you|que puedes|what can you)/)) {
    return es
      ? `Soy **Oliva**, asistente de Planzy.\n\nPuedo orientarte sobre: crear/unirte a planes, monedero, Premium, chats, cuenta y seguridad. ${ctx.createdPlanCount > 0 ? `Has creado **${ctx.createdPlanCount}** plan(es). ` : ""}${ctx.joinedPlanCount > 0 ? `Participas en **${ctx.joinedPlanCount}**.` : ""}`
      : `I'm **Oliva**, Planzy’s assistant.\n\nI can help with: plans, wallet, Premium, chats, account, safety. ${ctx.createdPlanCount > 0 ? `You created **${ctx.createdPlanCount}** plan(s). ` : ""}${ctx.joinedPlanCount > 0 ? `You joined **${ctx.joinedPlanCount}**.` : ""}`
  }

  if (msg.match(/(recomendar|sugerir|que hago|idea|aburrido|recommend|suggest|bored|planes cerca|algo que hacer)/)) {
    const extra = suggestPlansFromMessage(raw, ctx.plans, ctx.language, 4)
    if (extra) return `${es ? "Aquí van ideas concretas del feed:\n\n" : "Here are concrete picks from the feed:\n\n"}${extra}`
    return es
      ? pick([
          `Explora el **mapa** y el feed: deporte, gastronomía, ocio. ${ctx.joinedPlanCount < 2 ? "Apúntate a un par de planes esta semana." : "Sigue mezclando categorías para descubrir cosas nuevas."}`,
          `${ctx.createdPlanCount === 0 ? "Prueba a **crear** un plan sencillo (café, paseo): así atraes a gente con tus gustos." : "Organiza algo en tu zona y compártelo en redes."}`,
        ])
      : pick([
          `Use the **map** and feed—sports, food, leisure. ${ctx.joinedPlanCount < 2 ? "Join a couple of plans this week." : "Mix categories to discover new things."}`,
          `${ctx.createdPlanCount === 0 ? "Try **creating** a simple plan (coffee, walk) to attract like-minded people." : "Host something local and share it."}`,
        ])
  }

  const vague = suggestPlansFromMessage(raw, ctx.plans, ctx.language, 2)
  const defaultsEs = [
    `No tengo una respuesta fija para eso. Prueba a decirme si es **cuenta**, **planes**, **pagos**, **chat** o **Premium**.`,
    `Para afinar: ¿quieres **encontrar** un plan, **crear** uno o resolver un **pago**?`,
    `Puedo detallar pasos si me dices una palabra clave: *mapa*, *monedero*, *torneo*, *código correo*…`,
  ]
  const defaultsEn = [
    `I don’t have a fixed answer for that. Say if it’s **account**, **plans**, **payments**, **chat**, or **Premium**.`,
    `To narrow it: do you want to **find** a plan, **create** one, or fix a **payment**?`,
    `I can go step-by-step with a keyword: *map*, *wallet*, *tournament*, *email code*…`,
  ]
  const base = pick(es ? defaultsEs : defaultsEn)
  return vague ? `${base}\n\n${vague}` : base
}