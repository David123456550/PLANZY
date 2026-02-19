import type React from "react"
import type { Metadata, Viewport } from "next"
import { DM_Sans } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/toaster"
import { DataInitializer } from "@/components/data-initializer"
import { PlanzySessionProvider } from "@/components/session-provider"
import { AuthSync } from "@/components/auth-sync"

const dmSans = DM_Sans({ subsets: ["latin"], weight: ["400", "500", "600", "700"] })

export const metadata: Metadata = {
  title: "Planzy - Si no tienes plan, usa Planzy",
  description: "Conecta con personas de tu zona para disfrutar de actividades y experiencias juntos",
  generator: "v0.app",
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0f172a" },
  ],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={`${dmSans.className} antialiased`}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <PlanzySessionProvider>
            {children}
            <AuthSync />
            <DataInitializer />
            <Toaster />
          </PlanzySessionProvider>
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  )
}
