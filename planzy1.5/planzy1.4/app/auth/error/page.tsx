"use client"

import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { PlanzyLogo } from "@/components/planzy-logo"

export default function AuthErrorPage() {
  const searchParams = useSearchParams()
  const error = searchParams.get("error")

  const isAccountNotRegistered = error === "AccountNotRegistered"

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-background">
      <PlanzyLogo size="lg" showText />
      <Card className="w-full max-w-md mt-8">
        <CardHeader>
          <CardTitle>
            {isAccountNotRegistered ? "Cuenta no registrada" : "Error de autenticación"}
          </CardTitle>
          <CardDescription>
            {isAccountNotRegistered
              ? "No existe una cuenta con ese correo. Regístrate primero con tu email para poder usar el inicio de sesión con Google, Apple o Facebook."
              : "Ha ocurrido un error al iniciar sesión. Inténtalo de nuevo."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Link href="/">
            <Button className="w-full">Volver al inicio</Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  )
}
