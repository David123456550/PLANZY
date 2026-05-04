/** Único correo con permisos de administración en la app. Override: PLANZY_ADMIN_EMAIL o NEXT_PUBLIC_PLANZY_ADMIN_EMAIL (mismo valor en cliente y servidor). */
const DEFAULT_PLANZY_ADMIN_EMAIL = "davidgcbb@gmail.com"

function resolvedAdminEmail(): string {
  if (typeof process === "undefined") return DEFAULT_PLANZY_ADMIN_EMAIL
  const raw =
    process.env.PLANZY_ADMIN_EMAIL ||
    process.env.NEXT_PUBLIC_PLANZY_ADMIN_EMAIL ||
    DEFAULT_PLANZY_ADMIN_EMAIL
  return raw.trim().toLowerCase()
}

export function getPlanzyAdminEmail(): string {
  return resolvedAdminEmail()
}

export function isPlanzyAdminEmail(email: string | undefined | null): boolean {
  if (!email) return false
  return email.trim().toLowerCase() === resolvedAdminEmail()
}
