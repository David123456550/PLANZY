import NextAuth from "next-auth"
import Google from "next-auth/providers/google"
import Apple from "next-auth/providers/apple"
import Facebook from "next-auth/providers/facebook"
import { getUser } from "@/lib/actions"
import type { User } from "@/lib/types"

const providers = [
  process.env.GOOGLE_CLIENT_ID &&
    process.env.GOOGLE_CLIENT_SECRET &&
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      authorization: { params: { prompt: "select_account" } },
    }),
  process.env.APPLE_ID &&
    process.env.APPLE_SECRET &&
    Apple({
      clientId: process.env.APPLE_ID,
      clientSecret: process.env.APPLE_SECRET,
      authorization: { params: { scope: "name email", response_mode: "form_post" } },
    }),
  process.env.FACEBOOK_CLIENT_ID &&
    process.env.FACEBOOK_CLIENT_SECRET &&
    Facebook({
      clientId: process.env.FACEBOOK_CLIENT_ID,
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET,
      authorization: { params: { scope: "email public_profile" } },
    }),
].filter(Boolean) as any[]

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers,
  callbacks: {
    async signIn({ user, account }) {
      const email = user.email
      if (!email) return false

      try {
        const existingUser = await getUser(email)
        if (!existingUser) {
          return "/auth/error?error=AccountNotRegistered"
        }
        return true
      } catch {
        return false
      }
    },
    async jwt({ token, user }) {
      if (user?.email) {
        try {
          const dbUser = await getUser(user.email)
          if (dbUser) {
            token.planzyUser = dbUser
          }
        } catch {
          // ignore
        }
      }
      return token
    },
    async session({ session, token }) {
      if (token.planzyUser) {
        (session as any).planzyUser = token.planzyUser as User
      }
      return session
    },
  },
  pages: {
    signIn: "/",
    error: "/auth/error",
  },
  trustHost: true,
})
