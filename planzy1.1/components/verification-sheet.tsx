"use client"

import { useState } from "react"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Camera, CheckCircle2, Upload, Loader2 } from "lucide-react"
import { useAppStore } from "@/lib/store"
import { useTranslation } from "@/lib/i18n"
import { useToast } from "@/hooks/use-toast"

interface VerificationSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function VerificationSheet({ open, onOpenChange }: VerificationSheetProps) {
  const { user, verifyUser, language } = useAppStore()
  const t = useTranslation(language)
  const { toast } = useToast()
  const [isUploading, setIsUploading] = useState(false)
  const [uploadedImage, setUploadedImage] = useState<string | null>(null)

  const handleUpload = () => {
    // Simulate file input click
    const input = document.createElement("input")
    input.type = "file"
    input.accept = "image/*"
    input.capture = "user"
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (file) {
        const reader = new FileReader()
        reader.onload = (e) => {
          setUploadedImage(e.target?.result as string)
        }
        reader.readAsDataURL(file)
      }
    }
    input.click()
  }

  const handleVerify = async () => {
    if (!uploadedImage) return

    setIsUploading(true)
    // Simulate verification process
    await new Promise((resolve) => setTimeout(resolve, 2000))

    verifyUser()
    setIsUploading(false)

    toast({
      title: t.verificationComplete,
      description:
        language === "es"
          ? "Tu identidad ha sido verificada correctamente"
          : "Your identity has been verified successfully",
    })

    onOpenChange(false)
  }

  if (user?.isVerified) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="bottom" className="rounded-t-3xl">
          <SheetHeader className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
            <SheetTitle>{t.verificationComplete}</SheetTitle>
            <SheetDescription>
              {language === "es"
                ? "Tu identidad ya está verificada. Aparecerá un tick azul junto a tu nombre."
                : "Your identity is already verified. A blue checkmark will appear next to your name."}
            </SheetDescription>
          </SheetHeader>
          <div className="mt-6">
            <Button className="w-full" onClick={() => onOpenChange(false)}>
              {t.close}
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    )
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-3xl">
        <SheetHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#ef7418]/10">
            <Camera className="h-8 w-8 text-[#ef7418]" />
          </div>
          <SheetTitle>{t.verifyIdentity}</SheetTitle>
          <SheetDescription>{t.verifyDescription}</SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-4">
          {uploadedImage ? (
            <div className="relative mx-auto h-48 w-48 overflow-hidden rounded-xl border-2 border-dashed border-[#ef7418]">
              <img
                src={uploadedImage || "/placeholder.svg"}
                alt="Selfie preview"
                className="h-full w-full object-cover"
              />
              <Button
                variant="ghost"
                size="sm"
                className="absolute bottom-2 right-2 bg-background/80"
                onClick={handleUpload}
              >
                {language === "es" ? "Cambiar" : "Change"}
              </Button>
            </div>
          ) : (
            <button
              onClick={handleUpload}
              className="mx-auto flex h-48 w-48 flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-muted-foreground/30 bg-muted/50 transition-colors hover:border-[#ef7418] hover:bg-muted"
            >
              <Upload className="h-10 w-10 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">{t.uploadSelfie}</span>
            </button>
          )}

          <div className="rounded-lg bg-muted p-4 text-sm text-muted-foreground">
            <p className="font-medium text-foreground mb-2">{language === "es" ? "Instrucciones:" : "Instructions:"}</p>
            <ul className="list-disc list-inside space-y-1">
              <li>{language === "es" ? "Sostén tu DNI junto a tu cara" : "Hold your ID next to your face"}</li>
              <li>{language === "es" ? "Asegúrate de que ambos sean visibles" : "Make sure both are visible"}</li>
              <li>{language === "es" ? "Buena iluminación es importante" : "Good lighting is important"}</li>
            </ul>
          </div>

          <Button
            className="w-full bg-[#ef7418] hover:bg-[#ef7418]/90 text-white"
            onClick={handleVerify}
            disabled={!uploadedImage || isUploading}
          >
            {isUploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t.verificationPending}
              </>
            ) : (
              t.verifyIdentity
            )}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
