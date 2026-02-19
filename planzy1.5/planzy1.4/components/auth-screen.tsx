"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp"
import { PlanzyLogo } from "./planzy-logo"
import { mockPlans } from "@/lib/mock-data"
import { MapPin, ArrowLeft, CheckCircle, Mail } from "lucide-react"
import { useAppStore } from "@/lib/store"
import { useTranslation } from "@/lib/i18n"
import { useToast } from "@/hooks/use-toast"
import { createUser, getUser, sendRegisterVerificationCode, verifyRegisterCode } from "@/lib/actions"
import type { User } from "@/lib/types"

interface AuthScreenProps {
  onLogin: (user: User) => void
}

type AuthStep = "auth" | "verification" | "forgot-password"

export function AuthScreen({ onLogin }: AuthScreenProps) {
  const { language } = useAppStore()
  const t = useTranslation(language)
  const { toast } = useToast()

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [name, setName] = useState("")
  const [phone, setPhone] = useState("")
  const [dni, setDni] = useState("")
  const [step, setStep] = useState<AuthStep>("auth")
  const [verificationCode, setVerificationCode] = useState("")
  const [isVerifying, setIsVerifying] = useState(false)
  const [authMode, setAuthMode] = useState<"login" | "register">("login")
  const [isResending, setIsResending] = useState(false)
  const [resetEmail, setResetEmail] = useState("")
  const [isSendingReset, setIsSendingReset] = useState(false)
  const [pendingUser, setPendingUser] = useState<User | null>(null)

  const handleSocialLogin = async (provider: "google" | "facebook" | "apple") => {
    try {
      const socialEmail = `${provider}@planzy.local`
      const existing = await getUser(socialEmail)
      if (existing) {
        onLogin(existing)
        return
      }

      const socialUser: User = {
        id: `user-${Date.now()}`,
        name: provider === "google" ? "Google User" : provider === "facebook" ? "Facebook User" : "Apple User",
        username: `${provider}${Date.now().toString().slice(-6)}`,
        email: socialEmail,
        interests: [],
        createdAt: new Date(),
        language,
        notificationSettings: {
          newPlansInArea: true,
          upcomingPlans: true,
          planChanges: true,
          groupMessages: true,
        },
        preferredPaymentMethod: null,
        walletBalance: 0,
        premiumPlan: "free",
        savedPaymentMethods: [],
      }

      const created = await createUser(socialUser)
      onLogin(created)
    } catch (error) {
      toast({
        title: "Error",
        description: language === "es" ? "No se pudo iniciar sesión" : "Login failed",
        variant: "destructive",
      })
    }
  }

  const recentPlans = mockPlans.slice(0, 3)

  const handleEmailAuth = async (mode: "login" | "register") => {
    if (!email || !password || (mode === "register" && (!name || !phone || !dni))) {
      toast({
        title: "Error",
        description: language === "es" ? "Por favor completa todos los campos" : "Please fill in all fields",
        variant: "destructive",
      })
      return
    }
    try {
      if (mode === "login") {
        const existingUser = await getUser(email)
        if (!existingUser || (existingUser.password && existingUser.password !== password)) {
          toast({
            title: "Error",
            description: language === "es" ? "Credenciales inválidas" : "Invalid credentials",
            variant: "destructive",
          })
          return
        }
        if (!existingUser.isEmailVerified) {
          // Si el usuario no está verificado, enviar código de verificación y mostrar pantalla de verificación
          try {
            const result = await sendRegisterVerificationCode(existingUser.email)
            setPendingUser(existingUser)
            setAuthMode("register")
            setStep("verification")
            if (result.emailSent) {
              toast({
                title: language === "es" ? "Correo no verificado" : "Email not verified",
                description: language === "es"
                  ? "Hemos reenviado el código de verificación a tu correo"
                  : "We've resent the verification code to your email",
              })
            } else if (result.code) {
              toast({
                title: language === "es" ? "Correo no verificado" : "Email not verified",
                description: language === "es"
                  ? `Debes verificar tu correo. Código: ${result.code} (correo no enviado - configura RESEND_API_KEY)`
                  : `You must verify your email. Code: ${result.code} (email not sent - configure RESEND_API_KEY)`,
              })
            }
          } catch (error: any) {
            toast({
              title: language === "es" ? "Correo no verificado" : "Email not verified",
              description: error.message || (language === "es"
                ? "Debes verificar tu correo para iniciar sesión. Revisa la consola del servidor."
                : "You must verify your email before logging in. Check server console."),
              variant: "destructive",
            })
          }
          return
        }
        onLogin(existingUser)
        return
      } else {
        const existingUser = await getUser(email)
        if (existingUser) {
          toast({
            title: language === "es" ? "Cuenta existente" : "Account already exists",
            description:
              language === "es"
                ? "Ya hay una cuenta registrada con ese correo"
                : "An account with this email already exists",
            variant: "destructive",
          })
          return
        }

        // Generar username base desde el email, asegurando que tenga al menos 3 caracteres
        let usernameBase = email.split("@")[0].replace(/[^a-zA-Z0-9_]/g, "").toLowerCase()
        if (!usernameBase || usernameBase.length < 3) {
          usernameBase = `user${Date.now()}`
        }
        const registerUser: User = {
          id: `user-${Date.now()}`,
          name,
          username: usernameBase,
          email,
          isEmailVerified: false,
          emailVerificationCode: null,
          emailVerificationExpiresAt: null,
          password,
          phone,
          dni,
          interests: [],
          createdAt: new Date(),
          language,
          notificationSettings: {
            newPlansInArea: true,
            upcomingPlans: true,
            planChanges: true,
            groupMessages: true,
          },
          preferredPaymentMethod: null,
          walletBalance: 0,
          premiumPlan: "free",
          savedPaymentMethods: [],
        }
        let created
        try {
          created = await createUser(registerUser)
          console.log("✅ Usuario creado exitosamente:", created.email)
        } catch (createError: any) {
          console.error("❌ Error creando usuario:", createError)
          throw createError // Relanzar para que se capture en el catch general
        }
        
        let result
        try {
          result = await sendRegisterVerificationCode(created.email)
          setPendingUser(created)
          
          setAuthMode(mode)
          setStep("verification")
          
          // Mostrar mensaje según si el correo se envió o no
          if (result.emailSent) {
            toast({
              title: language === "es" ? "Código enviado" : "Code sent",
              description:
                language === "es"
                  ? `Hemos enviado un código de verificación a ${email}`
                  : `We sent a verification code to ${email}`,
            })
          } else if (result.code) {
            toast({
              title: language === "es" ? "Código generado" : "Code generated",
              description:
                language === "es"
                  ? `Código: ${result.code} (correo no enviado - configura RESEND_API_KEY en .env)`
                  : `Code: ${result.code} (email not sent - configure RESEND_API_KEY in .env)`,
              variant: "default",
            })
          }
        } catch (error: any) {
          console.error("❌ Error enviando código:", error)
          toast({
            title: language === "es" ? "Error enviando correo" : "Email error",
            description: error.message || (language === "es" 
              ? "No se pudo enviar el correo. Revisa la consola del servidor."
              : "Could not send email. Check server console."),
            variant: "destructive",
          })
          // Aún así, permitir continuar con el código en desarrollo
          if (result?.code) {
            setPendingUser(created)
            setAuthMode(mode)
            setStep("verification")
          }
        }
      }
    } catch (error: any) {
      console.error("Error en handleEmailAuth:", error);
      const errorMessage = error?.message || error?.toString() || "Error desconocido";
      toast({
        title: "Error",
        description: language === "es" 
          ? `No se pudo procesar la autenticación: ${errorMessage}`
          : `Authentication failed: ${errorMessage}`,
        variant: "destructive",
      })
    }
  }

  const handleVerification = () => {
    if (verificationCode.length !== 6) {
      toast({
        title: "Error",
        description: language === "es" ? "Por favor introduce el código completo" : "Please enter the complete code",
        variant: "destructive",
      })
      return
    }
    if (!pendingUser?.email) return

    setIsVerifying(true)
    verifyRegisterCode(pendingUser.email, verificationCode)
      .then((result) => {
        setIsVerifying(false)
        if (!result.success) {
          const description =
            result.reason === "expired"
              ? language === "es"
                ? "El código ha expirado, solicita uno nuevo"
                : "The code has expired, request a new one"
              : language === "es"
                ? "Código inválido"
                : "Invalid code"

          toast({
            title: "Error",
            description,
            variant: "destructive",
          })
          return
        }

        toast({
          title: language === "es" ? "Verificación exitosa" : "Verification successful",
          description:
            language === "es" ? "Tu cuenta ha sido verificada correctamente" : "Your account has been verified",
        })
        onLogin(result.user)
      })
      .catch(() => {
        setIsVerifying(false)
        toast({
          title: "Error",
          description: language === "es" ? "No se pudo verificar el código" : "Could not verify the code",
          variant: "destructive",
        })
      })
  }

  const handleResendCode = () => {
    if (!pendingUser?.email) return
    setIsResending(true)
    setVerificationCode("") // Clear old code
    sendRegisterVerificationCode(pendingUser.email)
      .then((result) => {
        setIsResending(false)
        if (result.emailSent) {
          toast({
            title: t.newCodeSent,
            description: t.newCodeSentDesc,
          })
        } else if (result.code) {
          toast({
            title: language === "es" ? "Código regenerado" : "Code regenerated",
            description: 
              language === "es"
                ? `Código: ${result.code} (correo no enviado - configura RESEND_API_KEY)`
                : `Code: ${result.code} (email not sent - configure RESEND_API_KEY)`,
          })
        }
      })
      .catch((error) => {
        setIsResending(false)
        console.error("Error reenviando código:", error)
        toast({
          title: "Error",
          description: error.message || (language === "es"
            ? "No se pudo reenviar el código. Revisa la consola del servidor."
            : "Could not resend code. Check server console."),
          variant: "destructive",
        })
      })
  }

  const handleForgotPassword = () => {
    setResetEmail(email)
    setStep("forgot-password")
  }

  const handleSendResetEmail = () => {
    if (!resetEmail) {
      toast({
        title: "Error",
        description: language === "es" ? "Por favor introduce tu correo electrónico" : "Please enter your email",
        variant: "destructive",
      })
      return
    }
    setIsSendingReset(true)
    setTimeout(() => {
      setIsSendingReset(false)
      toast({
        title: t.resetEmailSent,
        description: t.resetEmailSentDesc,
      })
      setStep("auth")
    }, 1500)
  }

  if (step === "forgot-password") {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto flex min-h-screen flex-col items-center justify-center px-5 py-8">
          <div className="mb-8">
            <PlanzyLogo size="lg" />
          </div>

          <Card className="w-full max-w-md">
            <CardHeader className="relative text-center px-6 pt-6">
              <Button variant="ghost" size="sm" className="absolute left-4 top-4" onClick={() => setStep("auth")}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                {t.backToLogin}
              </Button>
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#1a95a4]/10">
                <Mail className="h-8 w-8 text-[#1a95a4]" />
              </div>
              <CardTitle style={{ color: "#1a95a4" }}>{t.resetPassword}</CardTitle>
              <CardDescription>{t.resetPasswordDesc}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 px-6 pb-6">
              <div className="space-y-2">
                <Label htmlFor="reset-email">{t.email}</Label>
                <Input
                  id="reset-email"
                  type="email"
                  placeholder="tu@email.com"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                />
              </div>

              <Button
                className="w-full bg-[#ef7418] hover:bg-[#ef7418]/90 text-white"
                onClick={handleSendResetEmail}
                disabled={isSendingReset}
              >
                {isSendingReset ? (language === "es" ? "Enviando..." : "Sending...") : t.sendResetEmail}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (step === "verification") {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto flex min-h-screen flex-col items-center justify-center px-5 py-8">
          <div className="mb-8">
            <PlanzyLogo size="lg" />
          </div>

          <Card className="w-full max-w-md">
            <CardHeader className="relative text-center px-6 pt-6">
              <Button
                variant="ghost"
                size="sm"
                className="absolute left-4 top-4"
                onClick={() => {
                  setStep("auth")
                  setVerificationCode("")
                }}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                {language === "es" ? "Volver" : "Back"}
              </Button>
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#1a95a4]/10">
                <CheckCircle className="h-8 w-8 text-[#1a95a4]" />
              </div>
              <CardTitle style={{ color: "#1a95a4" }}>{t.verifyEmail}</CardTitle>
              <CardDescription>
                {t.verificationSent} <span className="font-medium text-foreground">{email}</span>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 px-6 pb-6">
              <div className="space-y-3">
                <Label className="text-center block">{t.enterCode}</Label>
                <div className="flex justify-center">
                  <InputOTP maxLength={6} value={verificationCode} onChange={(value) => setVerificationCode(value)}>
                    <InputOTPGroup>
                      <InputOTPSlot index={0} />
                      <InputOTPSlot index={1} />
                      <InputOTPSlot index={2} />
                      <InputOTPSlot index={3} />
                      <InputOTPSlot index={4} />
                      <InputOTPSlot index={5} />
                    </InputOTPGroup>
                  </InputOTP>
                </div>
              </div>

              <Button
                className="w-full bg-[#ef7418] hover:bg-[#ef7418]/90 text-white"
                onClick={handleVerification}
                disabled={isVerifying || verificationCode.length !== 6}
              >
                {isVerifying ? (language === "es" ? "Verificando..." : "Verifying...") : t.verify}
              </Button>

              <div className="text-center space-y-2">
                <p className="text-sm text-muted-foreground">{t.didntReceiveCode}</p>
                <Button variant="link" className="text-[#1a95a4]" onClick={handleResendCode} disabled={isResending}>
                  {isResending ? (language === "es" ? "Reenviando..." : "Resending...") : t.resendNewCode}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto flex min-h-screen flex-col items-center justify-center px-5 py-8">
        <div className="mb-8">
          <PlanzyLogo size="lg" />
        </div>

        <p className="mb-8 text-center text-base text-muted-foreground max-w-sm">{t.connect}</p>

        {/* Recent plans preview */}
        <div className="mb-8 w-full max-w-md">
          <h3 className="mb-4 text-center text-sm font-medium text-muted-foreground">{t.recentPlans}</h3>
          <div className="flex gap-3 overflow-x-auto pb-2">
            {recentPlans.map((plan) => (
              <div key={plan.id} className="flex-shrink-0 w-[140px] rounded-xl border bg-card p-3">
                <div
                  className="mb-2 h-16 rounded-lg bg-cover bg-center"
                  style={{ backgroundImage: `url(${plan.image})` }}
                />
                <p className="text-xs font-medium line-clamp-2">{plan.title}</p>
                <div className="mt-1 flex items-center gap-1 text-[10px] text-muted-foreground">
                  <MapPin className="h-3 w-3" />
                  <span className="truncate">{plan.location.city}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <Card className="w-full max-w-md">
          <CardHeader className="text-center px-6 pt-6">
            <CardTitle style={{ color: "#1a95a4" }}>{t.slogan}</CardTitle>
            <CardDescription>
              {language === "es"
                ? "Inicia sesión o crea una cuenta para empezar"
                : "Login or create an account to start"}
            </CardDescription>
          </CardHeader>
          <CardContent className="px-6 pb-6">
            <div className="mb-6 grid grid-cols-3 gap-3">
              <Button variant="outline" className="flex flex-col gap-1 h-auto py-3 bg-transparent" onClick={() => handleSocialLogin("google")}>
                <svg className="h-5 w-5" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                <span className="text-xs">Google</span>
              </Button>
              <Button variant="outline" className="flex flex-col gap-1 h-auto py-3 bg-transparent" onClick={() => handleSocialLogin("facebook")}>
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
                <span className="text-xs">Facebook</span>
              </Button>
              <Button variant="outline" className="flex flex-col gap-1 h-auto py-3 bg-transparent" onClick={() => handleSocialLogin("apple")}>
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
                </svg>
                <span className="text-xs">Apple</span>
              </Button>
            </div>

            <div className="relative mb-6">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">{t.orWithEmail}</span>
              </div>
            </div>

            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">{t.login}</TabsTrigger>
                <TabsTrigger value="register">{t.register}</TabsTrigger>
              </TabsList>
              <TabsContent value="login" className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="email">{t.email}</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="tu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">{t.password}</Label>
                  <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
                </div>
                <div className="text-right">
                  <Button variant="link" className="text-[#1a95a4] p-0 h-auto text-sm" onClick={handleForgotPassword}>
                    {t.forgotPassword}
                  </Button>
                </div>
                <Button
                  className="w-full bg-[#ef7418] hover:bg-[#ef7418]/90 text-white"
                  onClick={() => handleEmailAuth("login")}
                >
                  {t.login}
                </Button>
              </TabsContent>
              <TabsContent value="register" className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="name">{t.fullName}</Label>
                  <Input
                    id="name"
                    placeholder={language === "es" ? "Tu nombre completo" : "Your full name"}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dni">{t.dni}</Label>
                  <Input
                    id="dni"
                    placeholder={t.dniPlaceholder}
                    value={dni}
                    onChange={(e) => setDni(e.target.value.toUpperCase())}
                    maxLength={9}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reg-email">{t.email}</Label>
                  <Input
                    id="reg-email"
                    type="email"
                    placeholder="tu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reg-phone">{t.phone}</Label>
                  <Input
                    id="reg-phone"
                    type="tel"
                    placeholder="+34 612 345 678"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reg-password">{t.password}</Label>
                  <Input
                    id="reg-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
                <Button
                  className="w-full bg-[#ef7418] hover:bg-[#ef7418]/90 text-white"
                  onClick={() => handleEmailAuth("register")}
                >
                  {t.createAccount}
                </Button>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
