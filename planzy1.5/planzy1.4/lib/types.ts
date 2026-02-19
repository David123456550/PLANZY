export interface User {
  id: string
  name: string
  username: string
  email: string
  isEmailVerified?: boolean
  emailVerificationCode?: string | null
  emailVerificationExpiresAt?: Date | null
  password?: string
  phone?: string
  dni?: string
  avatar?: string
  description?: string
  interests: string[]
  isVerified?: boolean
  age?: number
  location?: {
    lat: number
    lng: number
    city: string
  }
  createdAt: Date
  blockedUsers?: string[]
  language?: "es" | "en"
  notificationSettings?: NotificationSettings
  preferredPaymentMethod?: "card" | "cash" | "wallet" | null
  walletBalance?: number
  premiumPlan?: PremiumPlan
  premiumExpiresAt?: Date | null
  savedPaymentMethods?: PaymentMethodConfig[]
  paidPlans?: { planId: string; amount: number }[]
}

export interface Plan {
  id: string
  title: string
  description: string
  image?: string
  category: string
  date: Date
  time: string
  location: {
    name: string
    address: string
    lat: number
    lng: number
    city: string
  }
  maxParticipants?: number
  currentParticipants: number
  pricePerPerson?: number
  minAge?: number
  courtReservation?: {
    courtName: string
    reservationTime: string
    price: number
  }
  creator: User
  participants: User[]
  createdAt: Date
}

export interface Notification {
  id: string
  type: "new_plan" | "upcoming" | "plan_change" | "message"
  title: string
  message: string
  planId?: string
  read: boolean
  createdAt: Date
}

export interface NotificationSettings {
  newPlansInArea: boolean
  upcomingPlans: boolean
  planChanges: boolean
  groupMessages: boolean
}

export interface Message {
  id: string
  senderId: string
  senderName: string
  senderAvatar?: string
  content: string
  createdAt: Date
  isEdited?: boolean
  isDeleted?: boolean
}

export interface Chat {
  id: string
  planId?: string
  planTitle?: string
  isPrivate?: boolean
  otherUser?: User
  participants: User[]
  messages: Message[]
  lastMessage?: Message
  unreadCount: number
}

export interface WalletTransaction {
  id: string
  type: "refund" | "withdrawal" | "income" | "deposit"
  amount: number
  description: string
  planId?: string
  createdAt: Date
}

export interface AssistantMessage {
  id: string
  role: "user" | "assistant"
  content: string
  createdAt: Date
}

export type PremiumPlan = "free" | "pro" | "club"

export interface Tournament {
  id: string
  planId: string
  sport: string
  playersPerTeam: number
  teams: TournamentTeam[]
  createdAt: Date
}

export interface TournamentTeam {
  id: string
  name: string
  color: string
  players: User[]
}

export interface PaymentMethodConfig {
  type: "bank" | "bizum" | "paypal"
  iban?: string
  bizumPhone?: string
  paypalEmail?: string
  isDefault?: boolean
}
