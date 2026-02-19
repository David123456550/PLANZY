"use client"

import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Copy, Share2, MessageCircle } from "lucide-react"
import { useAppStore } from "@/lib/store"
import { useTranslation } from "@/lib/i18n"
import { useToast } from "@/hooks/use-toast"
import type { Plan } from "@/lib/types"

interface ShareSheetProps {
  plan: Plan | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ShareSheet({ plan, open, onOpenChange }: ShareSheetProps) {
  const { language } = useAppStore()
  const t = useTranslation(language)
  const { toast } = useToast()

  if (!plan) return null

  const shareUrl = `https://planzy.app/plan/${plan.id}`
  const shareText = `${plan.title} - ${plan.location.name}`

  const handleCopyLink = async () => {
    await navigator.clipboard.writeText(shareUrl)
    toast({
      title: t.linkCopied,
      description: t.linkCopiedDesc,
    })
    onOpenChange(false)
  }

  const handleShare = async (platform: string) => {
    let url = ""
    switch (platform) {
      case "whatsapp":
        url = `https://wa.me/?text=${encodeURIComponent(`${shareText}\n${shareUrl}`)}`
        break
      case "telegram":
        url = `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`
        break
      case "twitter":
        url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`
        break
    }
    if (url) {
      window.open(url, "_blank")
    }
    onOpenChange(false)
  }

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: plan.title,
          text: shareText,
          url: shareUrl,
        })
      } catch {}
    }
    onOpenChange(false)
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-2xl">
        <SheetHeader className="pb-4">
          <SheetTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5 text-[#1a95a4]" />
            {t.sharePlan}
          </SheetTitle>
        </SheetHeader>

        <div className="space-y-3 pb-4">
          <Button variant="outline" className="w-full justify-start gap-3 bg-transparent" onClick={handleCopyLink}>
            <Copy className="h-5 w-5" />
            {t.copyLink}
          </Button>

          <div className="grid grid-cols-3 gap-3">
            <Button
              variant="outline"
              className="flex h-auto flex-col gap-2 py-4 bg-transparent"
              onClick={() => handleShare("whatsapp")}
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-500">
                <MessageCircle className="h-5 w-5 text-white" />
              </div>
              <span className="text-xs">WhatsApp</span>
            </Button>
            <Button
              variant="outline"
              className="flex h-auto flex-col gap-2 py-4 bg-transparent"
              onClick={() => handleShare("telegram")}
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-500">
                <svg className="h-5 w-5 text-white" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z" />
                </svg>
              </div>
              <span className="text-xs">Telegram</span>
            </Button>
            <Button
              variant="outline"
              className="flex h-auto flex-col gap-2 py-4 bg-transparent"
              onClick={handleNativeShare}
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#1a95a4]">
                <Share2 className="h-5 w-5 text-white" />
              </div>
              <span className="text-xs">{language === "es" ? "Más" : "More"}</span>
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
