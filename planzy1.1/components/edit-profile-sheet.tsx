"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Camera, X, MapPin, Check, Calendar } from "lucide-react"
import { useAppStore } from "@/lib/store"
import { useTranslation } from "@/lib/i18n"

interface EditProfileSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const allInterests = [
  "Deportes",
  "Senderismo",
  "Gastronomía",
  "Música",
  "Gaming",
  "Bienestar",
  "Arte",
  "Viajes",
  "Fotografía",
  "Cocina",
  "Cine",
  "Lectura",
]

export function EditProfileSheet({ open, onOpenChange }: EditProfileSheetProps) {
  const { user, updateUser, language } = useAppStore()
  const t = useTranslation(language)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [name, setName] = useState(user?.name || "")
  const [description, setDescription] = useState(user?.description || "")
  const [interests, setInterests] = useState<string[]>(user?.interests || [])
  const [city, setCity] = useState(user?.location?.city || "")
  const [age, setAge] = useState(user?.age?.toString() || "")
  const [avatarPreview, setAvatarPreview] = useState(user?.avatar || "")
  const [showSaveSuccess, setShowSaveSuccess] = useState(false)

  const toggleInterest = (interest: string) => {
    setInterests((prev) => (prev.includes(interest) ? prev.filter((i) => i !== interest) : [...prev, interest]))
  }

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (event) => {
        const result = event.target?.result as string
        setAvatarPreview(result)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSave = () => {
    updateUser({
      name,
      description,
      interests,
      avatar: avatarPreview,
      age: age ? Number.parseInt(age) : undefined,
      location: city ? { lat: 0, lng: 0, city } : undefined,
    })

    setShowSaveSuccess(true)
    setTimeout(() => {
      setShowSaveSuccess(false)
      onOpenChange(false)
    }, 1500)
  }

  if (!user) return null

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[85vh] overflow-auto rounded-t-2xl">
        <SheetHeader>
          <SheetTitle>{language === "es" ? "Editar perfil" : "Edit profile"}</SheetTitle>
        </SheetHeader>

        {showSaveSuccess && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
            <div className="flex flex-col items-center gap-3 animate-in zoom-in-50 duration-300">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                <Check className="h-8 w-8 text-green-600" />
              </div>
              <p className="font-semibold text-green-600">
                {language === "es" ? "Cambios guardados correctamente" : "Changes saved successfully"}
              </p>
            </div>
          </div>
        )}

        <div className="mt-6 space-y-6">
          {/* Avatar with photo change */}
          <div className="flex justify-center">
            <div className="relative">
              <Avatar className="h-24 w-24">
                <AvatarImage src={avatarPreview || "/placeholder.svg"} />
                <AvatarFallback className="text-2xl">{user.name[0]}</AvatarFallback>
              </Avatar>
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoSelect} />
              <button
                className="absolute -bottom-1 -right-1 rounded-full bg-[#ef7418] p-2 text-white shadow"
                onClick={() => fileInputRef.current?.click()}
              >
                <Camera className="h-4 w-4" />
              </button>
            </div>
          </div>
          <p className="text-center text-sm text-muted-foreground">{t.changePhoto}</p>

          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name">{language === "es" ? "Nombre" : "Name"}</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="age" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              {t.yourAge}
            </Label>
            <Input
              id="age"
              type="number"
              min="18"
              max="100"
              value={age}
              onChange={(e) => setAge(e.target.value)}
              placeholder={t.agePlaceholder}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="city" className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              {t.whereAreYouFrom}
            </Label>
            <Input id="city" value={city} onChange={(e) => setCity(e.target.value)} placeholder={t.cityPlaceholder} />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">
              {language === "es" ? "Descripción" : "Description"} ({description.length}/200)
            </Label>
            <Textarea
              id="description"
              placeholder={language === "es" ? "Cuéntanos sobre ti..." : "Tell us about yourself..."}
              maxLength={200}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          {/* Interests */}
          <div className="space-y-2">
            <Label>{language === "es" ? "Intereses" : "Interests"}</Label>
            <div className="flex flex-wrap gap-2">
              {allInterests.map((interest) => {
                const isSelected = interests.includes(interest)
                return (
                  <Badge
                    key={interest}
                    variant={isSelected ? "default" : "outline"}
                    className={`cursor-pointer ${isSelected ? "bg-[#1a95a4] hover:bg-[#1a95a4]/90" : ""}`}
                    onClick={() => toggleInterest(interest)}
                  >
                    {interest}
                    {isSelected && <X className="ml-1 h-3 w-3" />}
                  </Badge>
                )
              })}
            </div>
          </div>

          {/* Save button */}
          <Button className="w-full bg-[#ef7418] hover:bg-[#ef7418]/90 text-white" onClick={handleSave}>
            {t.saveChanges}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
