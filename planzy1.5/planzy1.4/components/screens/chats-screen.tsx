"use client"

import { useState } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { MessageCircle, Users, User } from "lucide-react"
import { useAppStore } from "@/lib/store"
import { useTranslation } from "@/lib/i18n"
import { ChatSheet } from "@/components/chat-sheet"
import { PrivateChatSheet } from "@/components/private-chat-sheet"
import type { Chat } from "@/lib/types"
import { format } from "date-fns"

export function ChatsScreen() {
  const { chats, privateChats, joinedPlans, language } = useAppStore()
  const t = useTranslation(language)
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null)
  const [selectedPrivateChat, setSelectedPrivateChat] = useState<Chat | null>(null)

  // Only show chats for plans user has joined
  const userChats = chats.filter((chat) => joinedPlans.includes(chat.planId || ""))
  const totalGroupUnread = userChats.reduce((acc, chat) => acc + chat.unreadCount, 0)
  const totalPrivateUnread = privateChats.reduce((acc, chat) => acc + chat.unreadCount, 0)
  const totalUnread = totalGroupUnread + totalPrivateUnread

  const handleSelectChat = (chat: Chat) => {
    setSelectedChat(chat)
  }

  const handleSelectPrivateChat = (chat: Chat) => {
    setSelectedPrivateChat(chat)
  }

  const handleCloseChat = () => {
    setSelectedChat(null)
  }

  const handleClosePrivateChat = () => {
    setSelectedPrivateChat(null)
  }

  return (
    <div className="flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center justify-between px-5 py-4">
          <h1 className="text-lg font-semibold flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-[#1a95a4]" />
            {t.chats}
            {totalUnread > 0 && <Badge className="bg-[#ef7418]">{totalUnread}</Badge>}
          </h1>
        </div>
      </header>

      <Tabs defaultValue="all" className="flex-1">
        <TabsList className="mx-5 mt-4 grid w-auto grid-cols-3">
          <TabsTrigger value="all" className="gap-1">
            {t.allChats}
            {totalUnread > 0 && (
              <Badge variant="secondary" className="h-5 px-1.5 text-[10px]">
                {totalUnread}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="groups" className="gap-1">
            <Users className="h-3.5 w-3.5" />
            {totalGroupUnread > 0 && (
              <Badge variant="secondary" className="h-5 px-1.5 text-[10px]">
                {totalGroupUnread}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="private" className="gap-1">
            <User className="h-3.5 w-3.5" />
            {totalPrivateUnread > 0 && (
              <Badge variant="secondary" className="h-5 px-1.5 text-[10px]">
                {totalPrivateUnread}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-0">
          {userChats.length === 0 && privateChats.length === 0 ? (
            <div className="flex h-64 flex-col items-center justify-center px-5 text-center">
              <MessageCircle className="mb-4 h-12 w-12 text-muted-foreground/50" />
              <p className="font-medium">{t.noChats}</p>
              <p className="mt-1 text-sm text-muted-foreground">{t.joinPlanToChat}</p>
            </div>
          ) : (
            <div className="divide-y">
              {privateChats.map((chat) => {
                const lastMsg = chat.messages[chat.messages.length - 1]
                return (
                  <button
                    key={chat.id}
                    className="flex w-full items-center gap-4 px-5 py-4 text-left transition-colors hover:bg-muted/50"
                    onClick={() => handleSelectPrivateChat(chat)}
                  >
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={chat.otherUser?.avatar || "/placeholder.svg"} />
                      <AvatarFallback>{chat.otherUser?.name[0]}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 overflow-hidden">
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="font-medium truncate">{chat.otherUser?.name}</h3>
                        {lastMsg && (
                          <span className="shrink-0 text-xs text-muted-foreground">
                            {format(new Date(lastMsg.createdAt), "HH:mm")}
                          </span>
                        )}
                      </div>
                      {lastMsg && <p className="mt-0.5 truncate text-sm text-muted-foreground">{lastMsg.content}</p>}
                    </div>
                    {chat.unreadCount > 0 && <Badge className="shrink-0 bg-[#ef7418]">{chat.unreadCount}</Badge>}
                  </button>
                )
              })}
              {userChats.map((chat) => {
                const lastMsg = chat.messages[chat.messages.length - 1]
                return (
                  <button
                    key={chat.id}
                    className="flex w-full items-center gap-4 px-5 py-4 text-left transition-colors hover:bg-muted/50"
                    onClick={() => handleSelectChat(chat)}
                  >
                    <div className="relative">
                      <Avatar className="h-12 w-12">
                        <AvatarImage
                          src={`/.jpg?height=48&width=48&query=${encodeURIComponent(chat.planTitle || "plan")}`}
                        />
                        <AvatarFallback>{chat.planTitle?.[0]}</AvatarFallback>
                      </Avatar>
                      <div className="absolute -bottom-0.5 -right-0.5 rounded-full bg-[#1a95a4] p-1">
                        <Users className="h-2.5 w-2.5 text-white" />
                      </div>
                    </div>
                    <div className="flex-1 overflow-hidden">
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="font-medium truncate">{chat.planTitle}</h3>
                        {lastMsg && (
                          <span className="shrink-0 text-xs text-muted-foreground">
                            {format(new Date(lastMsg.createdAt), "HH:mm")}
                          </span>
                        )}
                      </div>
                      {lastMsg && (
                        <p className="mt-0.5 truncate text-sm text-muted-foreground">
                          {lastMsg.senderName.split(" ")[0]}: {lastMsg.content}
                        </p>
                      )}
                    </div>
                    {chat.unreadCount > 0 && <Badge className="shrink-0 bg-[#ef7418]">{chat.unreadCount}</Badge>}
                  </button>
                )
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="groups" className="mt-0">
          {userChats.length === 0 ? (
            <div className="flex h-64 flex-col items-center justify-center px-5 text-center">
              <Users className="mb-4 h-12 w-12 text-muted-foreground/50" />
              <p className="font-medium">{t.noChats}</p>
              <p className="mt-1 text-sm text-muted-foreground">{t.joinPlanToChat}</p>
            </div>
          ) : (
            <div className="divide-y">
              {userChats.map((chat) => {
                const lastMsg = chat.messages[chat.messages.length - 1]
                return (
                  <button
                    key={chat.id}
                    className="flex w-full items-center gap-4 px-5 py-4 text-left transition-colors hover:bg-muted/50"
                    onClick={() => handleSelectChat(chat)}
                  >
                    <Avatar className="h-12 w-12">
                      <AvatarImage
                        src={`/.jpg?height=48&width=48&query=${encodeURIComponent(chat.planTitle || "plan")}`}
                      />
                      <AvatarFallback>{chat.planTitle?.[0]}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 overflow-hidden">
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="font-medium truncate">{chat.planTitle}</h3>
                        {lastMsg && (
                          <span className="shrink-0 text-xs text-muted-foreground">
                            {format(new Date(lastMsg.createdAt), "HH:mm")}
                          </span>
                        )}
                      </div>
                      {lastMsg && (
                        <p className="mt-0.5 truncate text-sm text-muted-foreground">
                          {lastMsg.senderName.split(" ")[0]}: {lastMsg.content}
                        </p>
                      )}
                    </div>
                    {chat.unreadCount > 0 && <Badge className="shrink-0 bg-[#ef7418]">{chat.unreadCount}</Badge>}
                  </button>
                )
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="private" className="mt-0">
          {privateChats.length === 0 ? (
            <div className="flex h-64 flex-col items-center justify-center px-5 text-center">
              <User className="mb-4 h-12 w-12 text-muted-foreground/50" />
              <p className="font-medium">{t.privateChats}</p>
              <p className="mt-1 text-sm text-muted-foreground">{t.startConversation}</p>
            </div>
          ) : (
            <div className="divide-y">
              {privateChats.map((chat) => {
                const lastMsg = chat.messages[chat.messages.length - 1]
                return (
                  <button
                    key={chat.id}
                    className="flex w-full items-center gap-4 px-5 py-4 text-left transition-colors hover:bg-muted/50"
                    onClick={() => handleSelectPrivateChat(chat)}
                  >
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={chat.otherUser?.avatar || "/placeholder.svg"} />
                      <AvatarFallback>{chat.otherUser?.name[0]}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 overflow-hidden">
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="font-medium truncate">{chat.otherUser?.name}</h3>
                        {lastMsg && (
                          <span className="shrink-0 text-xs text-muted-foreground">
                            {format(new Date(lastMsg.createdAt), "HH:mm")}
                          </span>
                        )}
                      </div>
                      {lastMsg && <p className="mt-0.5 truncate text-sm text-muted-foreground">{lastMsg.content}</p>}
                    </div>
                    {chat.unreadCount > 0 && <Badge className="shrink-0 bg-[#ef7418]">{chat.unreadCount}</Badge>}
                  </button>
                )
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <ChatSheet chat={selectedChat} open={!!selectedChat} onOpenChange={(open) => !open && handleCloseChat()} />
      <PrivateChatSheet
        chat={selectedPrivateChat}
        open={!!selectedPrivateChat}
        onOpenChange={(open) => !open && handleClosePrivateChat()}
      />
    </div>
  )
}
