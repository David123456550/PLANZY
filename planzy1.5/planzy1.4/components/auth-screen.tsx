"use client"

import { useRef, useState } from "react"
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
import {
  createUser,
  getUser,
  sendPasswordResetCode,
  sendRegisterVerificationCode,
  verifyLoginCode,
  verifyRegisterCode,
  resetPasswordWithCode,
} from "@/lib/actions"
import type { User } from "@/lib/types"

interface AuthScreenProps {
  onLogin: (user: User) => void
}

type AuthStep = "auth" | "verification" | "forgot-password" | "reset-password"

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
  const [resetCode, setResetCode] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmNewPassword, setConfirmNewPassword] = useState("")
  const [isSendingReset, setIsSendingReset] = useState(false)
  const [isResettingPassword, setIsResettingPassword] = useState(false)
  const [pendingUser, setPendingUser] = useState<User | null>(null)
  const resetEmailRef = useRef("")

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
        const result = await sendRegisterVerificationCode(existingUser.email)
        setPendingUser(existingUser)
        setAuthMode("login")
        setStep("verification")
        if (result.emailSent) {
          toast({
            title: language === "es" ? "Código enviado" : "Code sent",
            description:
              language === "es"
                ? `Te enviamos un código para iniciar sesión a ${existingUser.email}`
                : `We sent a login code to ${existingUser.email}`,
          })
        } else if (result.code) {
          toast({
            title: language === "es" ? "Código generado" : "Code generated",
            description:
              language === "es"
                ? `Código de inicio de sesión: ${result.code}`
                : `Login code: ${result.code}`,
          })
        }
        return
      } else {
        const existingUser = await getUser(email)
        if (existingUser) {
          // Si el usuario existe pero no está verificado, permitir re-registro
          if (!existingUser.isEmailVerified) {
            // El createUser ya maneja esto, continuar con el registro
          } else {
            toast({
              title: language === "es" ? "Cuenta existente" : "Account already exists",
              description:
                language === "es"
                  ? "Ya hay una cuenta verificada con ese correo. Si quieres eliminarla, usa la página de administración."
                  : "An account with this email already exists. If you want to delete it, use the admin page.",
              variant: "destructive",
            })
            return
          }
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
                  ? `Código: ${result.code} (Resend en modo prueba solo envía a tu email. Usa este código para continuar.)`
                  : `Code: ${result.code} (Resend trial only sends to your email. Use this code to continue.)`,
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
    const verificationAction =
      authMode === "login"
        ? verifyLoginCode(pendingUser.email, verificationCode)
        : verifyRegisterCode(pendingUser.email, verificationCode)

    verificationAction
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
            authMode === "login"
              ? language === "es"
                ? "Inicio de sesión completado"
                : "Login completed"
              : language === "es"
                ? "Tu cuenta ha sido verificada correctamente"
                : "Your account has been verified",
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

  const handleSendResetEmail = async () => {
    if (!resetEmail) {
      toast({
        title: "Error",
        description: language === "es" ? "Por favor introduce tu correo electrónico" : "Please enter your email",
        variant: "destructive",
      })
      return
    }
    setIsSendingReset(true)
    try {
      const result = await sendPasswordResetCode(resetEmail)
      setIsSendingReset(false)
      resetEmailRef.current = resetEmail
      setStep("reset-password")
      toast({
        title: t.resetEmailSent,
        description:
          result && "code" in result && result.code
            ? language === "es"
              ? `Código de recuperación: ${result.code}`
              : `Recovery code: ${result.code}`
            : t.resetEmailSentDesc,
      })
    } catch {
      setIsSendingReset(false)
      toast({
        title: "Error",
        description:
          language === "es"
            ? "No se pudo enviar el correo de recuperación"
            : "Could not send recovery email",
        variant: "destructive",
      })
    }
  }

  const handleResetPassword = async () => {
    if (!resetCode || resetCode.length !== 6 || !newPassword || !confirmNewPassword) {
      toast({
        title: "Error",
        description:
          language === "es"
            ? "Completa todos los campos y el código de 6 dígitos"
            : "Complete all fields and the 6-digit code",
        variant: "destructive",
      })
      return
    }
    if (newPassword !== confirmNewPassword) {
      toast({
        title: "Error",
        description: language === "es" ? "Las contraseñas no coinciden" : "Passwords do not match",
        variant: "destructive",
      })
      return
    }

    setIsResettingPassword(true)
    const result = await resetPasswordWithCode(resetEmailRef.current || resetEmail, resetCode, newPassword)
    setIsResettingPassword(false)
    if (!result.success) {
      toast({
        title: "Error",
        description:
          result.reason === "expired"
            ? language === "es"
              ? "El código ha expirado"
              : "Code has expired"
            : language === "es"
              ? "Código inválido"
              : "Invalid code",
        variant: "destructive",
      })
      return
    }

    toast({
      title: language === "es" ? "Contraseña actualizada" : "Password updated",
      description:
        language === "es"
          ? "Ya puedes iniciar sesión con tu nueva contraseña"
          : "You can now log in with your new password",
    })
    setStep("auth")
    setPassword(newPassword)
  }

  if (step === "reset-password") {
    return (
      <div className="min-h-screen bg-background">
        <div className="mx-auto flex min-h-dvh w-full max-w-lg flex-col items-center justify-center px-4 py-8 sm:max-w-xl sm:px-6 md:max-w-2xl md:px-8">
          <div className="mb-8">
            <PlanzyLogo size="lg" />
          </div>

          <Card className="w-full max-w-md">
            <CardHeader className="relative text-center px-6 pt-6">
              <Button variant="ghost" size="sm" className="absolute left-4 top-4" onClick={() => setStep("forgot-password")}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                {t.backToLogin}
              </Button>
              <CardTitle style={{ color: "#1a95a4" }}>
                {language === "es" ? "Restablecer contraseña" : "Reset password"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 px-6 pb-6">
              <div className="space-y-2">
                <Label>{language === "es" ? "Código" : "Code"}</Label>
                <InputOTP maxLength={6} value={resetCode} onChange={(value) => setResetCode(value)}>
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
              <div className="space-y-2">
                <Label>{language === "es" ? "Nueva contraseña" : "New password"}</Label>
                <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>{language === "es" ? "Confirmar contraseña" : "Confirm password"}</Label>
                <Input type="password" value={confirmNewPassword} onChange={(e) => setConfirmNewPassword(e.target.value)} />
              </div>
              <Button
                className="w-full bg-[#ef7418] hover:bg-[#ef7418]/90 text-white"
                onClick={handleResetPassword}
                disabled={isResettingPassword}
              >
                {isResettingPassword
                  ? language === "es"
                    ? "Actualizando..."
                    : "Updating..."
                  : language === "es"
                    ? "Actualizar contraseña"
                    : "Update password"}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (step === "forgot-password") {
    return (
      <div className="min-h-screen bg-background">
        <div className="mx-auto flex min-h-dvh w-full max-w-lg flex-col items-center justify-center px-4 py-8 sm:max-w-xl sm:px-6 md:max-w-2xl md:px-8">
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
        <div className="mx-auto flex min-h-dvh w-full max-w-lg flex-col items-center justify-center px-4 py-8 sm:max-w-xl sm:px-6 md:max-w-2xl md:px-8">
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
      <div className="mx-auto flex min-h-dvh w-full max-w-lg flex-col items-center justify-center px-4 py-8 sm:max-w-xl sm:px-6 md:max-w-2xl md:px-8">
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
