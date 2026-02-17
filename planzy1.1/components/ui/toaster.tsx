"use client"

import { useToast } from "@/hooks/use-toast"
import { CheckCircle } from "lucide-react"
import { Toast, ToastClose, ToastDescription, ToastProvider, ToastTitle, ToastViewport } from "@/components/ui/toast"

export function Toaster() {
  const { toasts } = useToast()

  return (
    <ToastProvider>
      {toasts.map(({ id, title, description, action, variant, ...props }) => {
        const isSuccess = variant !== "destructive"

        return (
          <Toast key={id} variant={variant} {...props}>
            <div
              className={
                isSuccess ? "flex flex-col items-center justify-center w-full text-center gap-2" : "grid gap-1"
              }
            >
              {isSuccess && (
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
              )}
              {title && <ToastTitle className={isSuccess ? "text-center" : ""}>{title}</ToastTitle>}
              {description && (
                <ToastDescription className={isSuccess ? "text-center" : ""}>{description}</ToastDescription>
              )}
            </div>
            {action}
            <ToastClose />
          </Toast>
        )
      })}
      <ToastViewport />
    </ToastProvider>
  )
}
