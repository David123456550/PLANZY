"use server"

import type { PremiumPlan } from "@/lib/types"

export type AssistantHistoryItem = { role: "user" | "assistant"; content: string }

export type AssistantAIContext = {
  language: "es" | "en"
  userName?: string
  premiumPlan: PremiumPlan
  walletBalance: number
  joinedPlanCount: number
  createdPlanCount: number
  planSummaries: { title: string; category: string; city: string; dateLabel: string }[]
}

function buildSystemPrompt(ctx: AssistantAIContext): string {
  const plansBlock =
    ctx.planSummaries.length > 0
      ? ctx.planSummaries.map((p) => `- ${p.title} (${p.category}, ${p.city}) ${p.dateLabel}`).join("\n")
      : "(no hay planes listados en el feed del cliente)"

  return `Eres Oliva, asistente virtual de la app Planzy (planes sociales: deporte, ocio, gastronomía, quedadas con amigos).
Idioma de respuesta: ${ctx.language === "es" ? "español" : "English"}.
Responde de forma breve y útil (máx. ~12 líneas salvo que pidan detalle). Usa viñetas cuando ayude.
No inventes funciones que no existan; estas sí: feed de planes, mapa, crear plan con categoría/fecha/ubicación/foto, unirse y pagar con tarjeta o monedero, chats de grupo al unirse y chat privado desde perfil, Premium Pro/Club y torneos solo Club, monedero con saldo y retiros, login y registro con código por email, recuperación de contraseña con código.
Contexto del usuario:
- Nombre: ${ctx.userName || "—"}
- Premium: ${ctx.premiumPlan}
- Monedero: ${ctx.walletBalance.toFixed(2)} EUR
- Planes creados (aprox.): ${ctx.createdPlanCount}
- Planes en los que participa: ${ctx.joinedPlanCount}
Planes recientes / visibles para sugerir (puedes mencionar 1–3 si encajan con la pregunta):
${plansBlock}`
}

/**
 * Si OPENAI_API_KEY está definida, devuelve texto del modelo; si no, null (el cliente usa lógica local).
 */
export async function getAssistantAIReply(
  userMessage: string,
  history: AssistantHistoryItem[],
  ctx: AssistantAIContext,
): Promise<string | null> {
  const key = process.env.OPENAI_API_KEY
  if (!key?.trim()) return null

  const model = process.env.OPENAI_MODEL?.trim() || "gpt-4o-mini"
  const system = buildSystemPrompt(ctx)

  const apiMessages: { role: "system" | "user" | "assistant"; content: string }[] = [
    { role: "system", content: system },
    ...history.slice(-10).map((m) => ({ role: m.role, content: m.content })),
    { role: "user", content: userMessage.trim() },
  ]

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages: apiMessages,
      max_tokens: 600,
      temperature: 0.65,
    }),
  })

  if (!res.ok) {
    console.error("[Oliva AI]", res.status, await res.text())
    return null
  }

  const data = (await res.json()) as {
    choices?: { message?: { content?: string } }[]
  }
  const text = data.choices?.[0]?.message?.content?.trim()
  return text || null
}
