"use client"

import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import { Grid3X3, Dumbbell, Mountain, UtensilsCrossed, Music, Gamepad2, Heart, Palette, Plane } from "lucide-react"
import { cn } from "@/lib/utils"

const categories = [
  { id: "all", name: "Todos", icon: Grid3X3 },
  { id: "deportes", name: "Deportes", icon: Dumbbell },
  { id: "senderismo", name: "Senderismo", icon: Mountain },
  { id: "gastronomía", name: "Gastronomía", icon: UtensilsCrossed },
  { id: "música", name: "Música", icon: Music },
  { id: "gaming", name: "Gaming", icon: Gamepad2 },
  { id: "bienestar", name: "Bienestar", icon: Heart },
  { id: "arte", name: "Arte", icon: Palette },
  { id: "viajes", name: "Viajes", icon: Plane },
]

interface CategoryFilterProps {
  selected: string
  onSelect: (category: string) => void
}

export function CategoryFilter({ selected, onSelect }: CategoryFilterProps) {
  return (
    <ScrollArea className="w-full whitespace-nowrap">
      <div className="flex gap-2 px-4 py-2">
        {categories.map((category) => {
          const Icon = category.icon
          const isSelected = selected === category.id
          return (
            <Button
              key={category.id}
              variant={isSelected ? "default" : "outline"}
              size="sm"
              className={cn("flex items-center gap-2 rounded-full", isSelected && "bg-[#1a95a4] hover:bg-[#1a95a4]/90")}
              onClick={() => onSelect(category.id)}
            >
              <Icon className="h-4 w-4" />
              {category.name}
            </Button>
          )
        })}
      </div>
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  )
}
