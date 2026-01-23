"use client"

import { BadgeCheck } from "lucide-react"
import { cn } from "@/lib/utils"

interface VerifiedBadgeProps {
  className?: string
  size?: "sm" | "md" | "lg"
}

export function VerifiedBadge({ className, size = "sm" }: VerifiedBadgeProps) {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-5 w-5",
    lg: "h-6 w-6",
  }

  return <BadgeCheck className={cn("text-blue-500 fill-blue-500", sizeClasses[size], className)} />
}
