"use client"

import { create } from "zustand"
import { persist } from "zustand/middleware"
import type {
  User,
  Plan,
  Notification,
  NotificationSettings,
  Chat,
  Message,
  WalletTransaction,
  AssistantMessage,
  PremiumPlan,
  Tournament,
  PaymentMethodConfig,
} from "./types"
import { mockPlans, mockNotifications } from "./mock-data"
import type { Language } from "./i18n"

export type PaymentMethod = "card" | "cash" | "wallet" | null

interface AppState {
  isAuthenticated: boolean
  user: User | null
  plans: Plan[]
  favorites: string[]
  joinedPlans: string[]
  notifications: Notification[]
  notificationSettings: NotificationSettings
  language: Language
  userLocation: { lat: number; lng: number } | null
  chats: Chat[]
  privateChats: Chat[]
  preferredPaymentMethod: PaymentMethod
  walletBalance: number
  walletTransactions: WalletTransaction[]
  paidPlans: { planId: string; amount: number }[]
  blockedUsers: string[]
  assistantMessages: AssistantMessage[]
  premiumPlan: PremiumPlan
  premiumExpiresAt: Date | null
  plansCreatedThisMonth: number
  tournaments: Tournament[]
  savedPaymentMethods: PaymentMethodConfig[]
  setAuthenticated: (value: boolean) => void
  setUser: (user: User | null) => void
  updateUser: (updates: Partial<User>) => void
  addPlan: (plan: Plan) => void
  editPlan: (planId: string, updates: Partial<Plan>) => void
  deletePlan: (planId: string) => void
  toggleFavorite: (planId: string) => void
  joinPlan: (planId: string) => void
  leavePlan: (planId: string, isRefund?: boolean) => void
  markNotificationRead: (notifId: string) => void
  updateNotificationSettings: (settings: Partial<NotificationSettings>) => void
  setLanguage: (language: Language) => void
  setUserLocation: (location: { lat: number; lng: number } | null) => void
  sendMessage: (chatId: string, content: string) => void
  markChatRead: (chatId: string) => void
  getChatForPlan: (planId: string) => Chat | undefined
  startPrivateChat: (otherUser: User) => Chat
  sendPrivateMessage: (chatId: string, content: string) => void
  getPrivateChatWith: (userId: string) => Chat | undefined
  verifyUser: () => void
  setPreferredPaymentMethod: (method: PaymentMethod) => void
  editMessage: (chatId: string, messageId: string, newContent: string, isPrivate?: boolean) => void
  deleteMessage: (chatId: string, messageId: string, isPrivate?: boolean) => void
  addToWallet: (amount: number, description: string, planId?: string, type?: "refund" | "income") => void
  withdrawFromWallet: (amount: number) => void
  addPaidPlan: (planId: string, amount: number) => void
  blockUser: (userId: string) => void
  unblockUser: (userId: string) => void
  reportUser: (userId: string, reason: string) => void
  addNotification: (notification: Omit<Notification, "id" | "createdAt" | "read">) => void
  addAssistantMessage: (role: "user" | "assistant", content: string) => void
  clearAssistantMessages: () => void
  depositToWallet: (amount: number, description: string) => void
  setPremiumPlan: (plan: PremiumPlan) => void
  addTournament: (tournament: Tournament) => void
  addSavedPaymentMethod: (method: PaymentMethodConfig) => void
  removeSavedPaymentMethod: (type: string) => void
  setDefaultPaymentMethod: (type: string) => void
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      isAuthenticated: false,
      user: null,
      plans: mockPlans,
      favorites: [],
      joinedPlans: ["plan-2", "plan-4"],
      notifications: mockNotifications,
      notificationSettings: {
        newPlansInArea: true,
        upcomingPlans: true,
        planChanges: true,
        groupMessages: true,
      },
      language: "es",
      userLocation: null,
      preferredPaymentMethod: null,
      walletBalance: 0,
      walletTransactions: [],
      paidPlans: [],
      blockedUsers: [],
      assistantMessages: [],
      premiumPlan: "free",
      premiumExpiresAt: null,
      plansCreatedThisMonth: 0,
      tournaments: [],
      savedPaymentMethods: [],
      chats: [
        {
          id: "chat-1",
          planId: "plan-2",
          planTitle: "Ruta de tapas por La Latina",
          participants: [],
          messages: [
            {
              id: "msg-1",
              senderId: "user-2",
              senderName: "María García",
              senderAvatar: "/diverse-woman-avatar.png",
              content: "¡Hola! ¿Quedamos en la Plaza de la Cebada?",
              createdAt: new Date(Date.now() - 3600000),
            },
            {
              id: "msg-2",
              senderId: "user-3",
              senderName: "Carlos López",
              senderAvatar: "/man-avatar.png",
              content: "Perfecto, yo llego sobre las 20:00",
              createdAt: new Date(Date.now() - 1800000),
            },
          ],
          unreadCount: 2,
        },
        {
          id: "chat-2",
          planId: "plan-4",
          planTitle: "Torneo de FIFA 24",
          participants: [],
          messages: [
            {
              id: "msg-3",
              senderId: "user-4",
              senderName: "Ana Martínez",
              senderAvatar: "/gamer-woman.jpg",
              content: "¿Alguien trae mando extra?",
              createdAt: new Date(Date.now() - 7200000),
            },
          ],
          unreadCount: 1,
        },
      ],
      privateChats: [],
      setAuthenticated: (value) => set({ isAuthenticated: value }),
      setUser: (user) => set({ user }),
      updateUser: (updates) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...updates } : null,
        })),
      addPlan: (plan) =>
        set((state) => ({
          plans: [plan, ...state.plans],
          plansCreatedThisMonth: state.plansCreatedThisMonth + 1,
          chats: [
            {
              id: `chat-${plan.id}`,
              planId: plan.id,
              planTitle: plan.title,
              participants: plan.participants,
              messages: [],
              unreadCount: 0,
            },
            ...state.chats,
          ],
        })),
      editPlan: (planId, updates) =>
        set((state) => ({
          plans: state.plans.map((p) => (p.id === planId ? { ...p, ...updates } : p)),
          chats: state.chats.map((c) =>
            c.planId === planId && updates.title ? { ...c, planTitle: updates.title } : c,
          ),
        })),
      deletePlan: (planId) =>
        set((state) => ({
          plans: state.plans.filter((p) => p.id !== planId),
          chats: state.chats.filter((c) => c.planId !== planId),
          favorites: state.favorites.filter((id) => id !== planId),
          joinedPlans: state.joinedPlans.filter((id) => id !== planId),
        })),
      toggleFavorite: (planId) =>
        set((state) => ({
          favorites: state.favorites.includes(planId)
            ? state.favorites.filter((id) => id !== planId)
            : [...state.favorites, planId],
        })),
      joinPlan: (planId) =>
        set((state) => {
          const plan = state.plans.find((p) => p.id === planId)
          if (!plan || !state.user) return state

          const existingChat = state.chats.find((c) => c.planId === planId)
          const newChats = existingChat
            ? state.chats
            : [
                {
                  id: `chat-${planId}`,
                  planId,
                  planTitle: plan.title,
                  participants: [...plan.participants, state.user],
                  messages: [],
                  unreadCount: 0,
                },
                ...state.chats,
              ]

          return {
            joinedPlans: [...state.joinedPlans, planId],
            plans: state.plans.map((p) =>
              p.id === planId
                ? {
                    ...p,
                    currentParticipants: p.currentParticipants + 1,
                    participants: [...p.participants, state.user!],
                  }
                : p,
            ),
            chats: newChats,
          }
        }),
      leavePlan: (planId, isRefund = false) =>
        set((state) => {
          if (!state.user) return state

          const paidPlan = state.paidPlans.find((p) => p.planId === planId)
          const plan = state.plans.find((p) => p.id === planId)
          let newWalletBalance = state.walletBalance
          let newTransactions = state.walletTransactions
          let newPaidPlans = state.paidPlans
          let newNotifications = state.notifications

          if (paidPlan && isRefund) {
            newWalletBalance = state.walletBalance + paidPlan.amount
            newTransactions = [
              {
                id: `tx-${Date.now()}`,
                type: "refund" as const,
                amount: paidPlan.amount,
                description: plan?.title || "Plan cancelado",
                planId,
                createdAt: new Date(),
              },
              ...state.walletTransactions,
            ]
            newPaidPlans = state.paidPlans.filter((p) => p.planId !== planId)

            if (plan && plan.creator.id !== state.user.id) {
              newNotifications = [
                {
                  id: `notif-${Date.now()}`,
                  type: "plan_change" as const,
                  title: state.language === "es" ? "Participante canceló" : "Participant cancelled",
                  message:
                    state.language === "es"
                      ? `${state.user.name} se ha desapuntado de "${plan.title}"`
                      : `${state.user.name} has left "${plan.title}"`,
                  planId,
                  read: false,
                  createdAt: new Date(),
                },
                ...state.notifications,
              ]
            }
          }

          return {
            joinedPlans: state.joinedPlans.filter((id) => id !== planId),
            plans: state.plans.map((p) =>
              p.id === planId
                ? {
                    ...p,
                    currentParticipants: p.currentParticipants - 1,
                    participants: p.participants.filter((u) => u.id !== state.user!.id),
                  }
                : p,
            ),
            walletBalance: newWalletBalance,
            walletTransactions: newTransactions,
            paidPlans: newPaidPlans,
            notifications: newNotifications,
          }
        }),
      markNotificationRead: (notifId) =>
        set((state) => ({
          notifications: state.notifications.map((n) => (n.id === notifId ? { ...n, read: true } : n)),
        })),
      updateNotificationSettings: (settings) =>
        set((state) => ({
          notificationSettings: { ...state.notificationSettings, ...settings },
        })),
      setLanguage: (language) => set({ language }),
      setUserLocation: (location) => set({ userLocation: location }),
      sendMessage: (chatId, content) =>
        set((state) => {
          if (!state.user) return state
          const newMessage: Message = {
            id: `msg-${Date.now()}`,
            senderId: state.user.id,
            senderName: state.user.name,
            senderAvatar: state.user.avatar,
            content,
            createdAt: new Date(),
          }
          return {
            chats: state.chats.map((chat) =>
              chat.id === chatId
                ? {
                    ...chat,
                    messages: [...chat.messages, newMessage],
                    lastMessage: newMessage,
                  }
                : chat,
            ),
          }
        }),
      markChatRead: (chatId) =>
        set((state) => ({
          chats: state.chats.map((chat) => (chat.id === chatId ? { ...chat, unreadCount: 0 } : chat)),
          privateChats: state.privateChats.map((chat) => (chat.id === chatId ? { ...chat, unreadCount: 0 } : chat)),
        })),
      getChatForPlan: (planId) => {
        return get().chats.find((chat) => chat.planId === planId)
      },
      startPrivateChat: (otherUser: User) => {
        const state = get()
        const existingChat = state.privateChats.find((c) => c.otherUser?.id === otherUser.id)
        if (existingChat) return existingChat

        const newChat: Chat = {
          id: `private-${otherUser.id}-${Date.now()}`,
          isPrivate: true,
          otherUser,
          participants: [state.user!, otherUser],
          messages: [],
          unreadCount: 0,
        }
        set({ privateChats: [newChat, ...state.privateChats] })
        return newChat
      },
      sendPrivateMessage: (chatId, content) =>
        set((state) => {
          if (!state.user) return state
          const newMessage: Message = {
            id: `msg-${Date.now()}`,
            senderId: state.user.id,
            senderName: state.user.name,
            senderAvatar: state.user.avatar,
            content,
            createdAt: new Date(),
          }
          return {
            privateChats: state.privateChats.map((chat) =>
              chat.id === chatId
                ? {
                    ...chat,
                    messages: [...chat.messages, newMessage],
                    lastMessage: newMessage,
                  }
                : chat,
            ),
          }
        }),
      getPrivateChatWith: (userId) => {
        return get().privateChats.find((chat) => chat.otherUser?.id === userId)
      },
      verifyUser: () =>
        set((state) => ({
          user: state.user ? { ...state.user, isVerified: true } : null,
        })),
      setPreferredPaymentMethod: (method) => set({ preferredPaymentMethod: method }),
      editMessage: (chatId, messageId, newContent, isPrivate = false) =>
        set((state) => {
          const updateMessages = (messages: Message[]) =>
            messages.map((msg) => (msg.id === messageId ? { ...msg, content: newContent, isEdited: true } : msg))

          if (isPrivate) {
            return {
              privateChats: state.privateChats.map((chat) =>
                chat.id === chatId ? { ...chat, messages: updateMessages(chat.messages) } : chat,
              ),
            }
          }
          return {
            chats: state.chats.map((chat) =>
              chat.id === chatId ? { ...chat, messages: updateMessages(chat.messages) } : chat,
            ),
          }
        }),
      deleteMessage: (chatId, messageId, isPrivate = false) =>
        set((state) => {
          const updateMessages = (messages: Message[]) =>
            messages.map((msg) => (msg.id === messageId ? { ...msg, content: "", isDeleted: true } : msg))

          if (isPrivate) {
            return {
              privateChats: state.privateChats.map((chat) =>
                chat.id === chatId ? { ...chat, messages: updateMessages(chat.messages) } : chat,
              ),
            }
          }
          return {
            chats: state.chats.map((chat) =>
              chat.id === chatId ? { ...chat, messages: updateMessages(chat.messages) } : chat,
            ),
          }
        }),
      addToWallet: (amount, description, planId, type = "refund") =>
        set((state) => ({
          walletBalance: state.walletBalance + amount,
          walletTransactions: [
            {
              id: `tx-${Date.now()}`,
              type,
              amount,
              description,
              planId,
              createdAt: new Date(),
            },
            ...state.walletTransactions,
          ],
        })),
      depositToWallet: (amount, description) =>
        set((state) => ({
          walletBalance: state.walletBalance + amount,
          walletTransactions: [
            {
              id: `tx-${Date.now()}`,
              type: "deposit" as const,
              amount,
              description,
              createdAt: new Date(),
            },
            ...state.walletTransactions,
          ],
        })),
      withdrawFromWallet: (amount) =>
        set((state) => ({
          walletBalance: Math.max(0, state.walletBalance - amount),
          walletTransactions: [
            {
              id: `tx-${Date.now()}`,
              type: "withdrawal" as const,
              amount,
              description: "Retiro a cuenta bancaria",
              createdAt: new Date(),
            },
            ...state.walletTransactions,
          ],
        })),
      addPaidPlan: (planId, amount) =>
        set((state) => ({
          paidPlans: [...state.paidPlans, { planId, amount }],
        })),
      blockUser: (userId) =>
        set((state) => ({
          blockedUsers: [...state.blockedUsers, userId],
        })),
      unblockUser: (userId) =>
        set((state) => ({
          blockedUsers: state.blockedUsers.filter((id) => id !== userId),
        })),
      reportUser: (userId, reason) => {
        console.log(`User ${userId} reported for: ${reason}`)
      },
      addNotification: (notification) =>
        set((state) => ({
          notifications: [
            {
              ...notification,
              id: `notif-${Date.now()}`,
              read: false,
              createdAt: new Date(),
            },
            ...state.notifications,
          ],
        })),
      addAssistantMessage: (role, content) =>
        set((state) => ({
          assistantMessages: [
            ...state.assistantMessages,
            {
              id: `assist-${Date.now()}`,
              role,
              content,
              createdAt: new Date(),
            },
          ],
        })),
      clearAssistantMessages: () => set({ assistantMessages: [] }),
      setPremiumPlan: (plan) =>
        set((state) => ({
          premiumPlan: plan,
          premiumExpiresAt: plan !== "free" ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) : null,
        })),
      addTournament: (tournament) =>
        set((state) => ({
          tournaments: [...state.tournaments, tournament],
        })),
      addSavedPaymentMethod: (method) =>
        set((state) => ({
          savedPaymentMethods: [...state.savedPaymentMethods.filter((m) => m.type !== method.type), method],
        })),
      removeSavedPaymentMethod: (type) =>
        set((state) => ({
          savedPaymentMethods: state.savedPaymentMethods.filter((m) => m.type !== type),
        })),
      setDefaultPaymentMethod: (type) =>
        set((state) => ({
          savedPaymentMethods: state.savedPaymentMethods.map((m) => ({
            ...m,
            isDefault: m.type === type,
          })),
        })),
    }),
    {
      name: "planzy-storage",
    },
  ),
)
