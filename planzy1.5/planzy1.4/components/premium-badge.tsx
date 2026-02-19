"use client"

import { Crown } from "lucide-react"
import { useAppStore } from "@/lib/store"

interface PremiumBadgeProps {
  size?: "sm" | "md"
}

export function PremiumBadge({ size = "sm" }: PremiumBadgeProps) {
  const { premiumPlan } = useAppStore()

  if (premiumPlan === "free") return null

  const colors = premiumPlan === "pro" ? "bg-[#ef7418] text-white" : "bg-[#1a95a4] text-white"

  const iconSize = size === "sm" ? "h-3 w-3" : "h-4 w-4"
  const badgeSize = size === "sm" ? "h-5 px-1.5" : "h-6 px-2"
  const textSize = size === "sm" ? "text-[10px]" : "text-xs"

  return (
    <span className={`inline-flex items-center gap-1 rounded-full ${colors} ${badgeSize}`}>
      <Crown className={iconSize} />
      <span className={`font-semibold ${textSize}`}>{premiumPlan === "pro" ? "PRO" : "CLUB"}</span>
    </span>
  )
}
