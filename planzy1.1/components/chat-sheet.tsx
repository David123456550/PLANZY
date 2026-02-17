"use client"

import type React from "react"
import { useState, useRef, useEffect, useCallback } from "react"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Send, ArrowLeft, Users, MoreVertical, Pencil, Trash2 } from "lucide-react"
import { useAppStore } from "@/lib/store"
import { useTranslation } from "@/lib/i18n"
import type { Chat } from "@/lib/types"
import { format } from "date-fns"
import { ParticipantsSheet } from "./participants-sheet"

interface ChatSheetProps {
  chat: Chat | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ChatSheet({ chat, open, onOpenChange }: ChatSheetProps) {
  const { user, sendMessage, markChatRead, language, chats, editMessage, deleteMessage, plans } = useAppStore()
  const t = useTranslation(language)
  const [message, setMessage] = useState("")
  const scrollRef = useRef<HTMLDivElement>(null)
  const [participantsOpen, setParticipantsOpen] = useState(false)
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null)
  const [editingContent, setEditingContent] = useState("")
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [messageToDelete, setMessageToDelete] = useState<string | null>(null)

  const currentChat = chat?.id ? chats.find((c) => c.id === chat.id) || chat : null

  const plan = currentChat?.planId ? plans.find((p) => p.id === currentChat.planId) : null
  const participants = plan?.participants || currentChat?.participants || []

  const handleMarkRead = useCallback(() => {
    if (currentChat?.id) {
      markChatRead(currentChat.id)
    }
  }, [currentChat?.id, markChatRead])

  useEffect(() => {
    if (open && currentChat?.id) {
      handleMarkRead()
    }
  }, [open, currentChat?.id, handleMarkRead])

  useEffect(() => {
    if (scrollRef.current && open && currentChat) {
      const scrollElement = scrollRef.current.querySelector("[data-radix-scroll-area-viewport]")
      if (scrollElement) {
        setTimeout(() => {
          scrollElement.scrollTop = scrollElement.scrollHeight
        }, 50)
      }
    }
  }, [currentChat, open]) // Updated to use currentChat instead of currentChat?.messages

  const handleSend = () => {
    if (!message.trim() || !currentChat) return
    sendMessage(currentChat.id, message.trim())
    setMessage("")
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleEditMessage = (messageId: string, content: string) => {
    setEditingMessageId(messageId)
    setEditingContent(content)
  }

  const handleSaveEdit = () => {
    if (!currentChat || !editingMessageId || !editingContent.trim()) return
    editMessage(currentChat.id, editingMessageId, editingContent.trim(), false)
    setEditingMessageId(null)
    setEditingContent("")
  }

  const handleCancelEdit = () => {
    setEditingMessageId(null)
    setEditingContent("")
  }

  const handleDeleteMessage = (messageId: string) => {
    setMessageToDelete(messageId)
    setDeleteDialogOpen(true)
  }

  const confirmDelete = () => {
    if (!currentChat || !messageToDelete) return
    deleteMessage(currentChat.id, messageToDelete, false)
    setDeleteDialogOpen(false)
    setMessageToDelete(null)
  }

  if (!currentChat) return null

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="right" className="flex w-full flex-col p-0 sm:max-w-md">
          <SheetHeader className="border-b px-5 py-4 shrink-0">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div className="flex-1">
                <SheetTitle className="text-left text-base">{currentChat.planTitle}</SheetTitle>
                <p className="text-xs text-muted-foreground">
                  {participants.length} {t.participants}
                </p>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setParticipantsOpen(true)}>
                <Users className="h-5 w-5" />
              </Button>
            </div>
          </SheetHeader>

          <ScrollArea ref={scrollRef} className="flex-1 p-5">
            <div className="space-y-4">
              {currentChat.messages.length === 0 ? (
                <div className="flex h-40 flex-col items-center justify-center text-center text-muted-foreground">
                  <p className="text-sm">{language === "es" ? "No hay mensajes aún" : "No messages yet"}</p>
                  <p className="text-xs">{language === "es" ? "Sé el primero en escribir" : "Be the first to write"}</p>
                </div>
              ) : (
                currentChat.messages.map((msg) => {
                  const isOwn = msg.senderId === user?.id
                  const isEditing = editingMessageId === msg.id

                  if (msg.isDeleted) {
                    return (
                      <div key={msg.id} className={`flex gap-2 ${isOwn ? "flex-row-reverse" : ""}`}>
                        <div className={`max-w-[75%] ${isOwn ? "items-end" : "items-start"}`}>
                          <div className="rounded-2xl px-4 py-2.5 bg-muted/50 italic text-muted-foreground">
                            <p className="text-sm">{t.messageDeleted}</p>
                          </div>
                        </div>
                      </div>
                    )
                  }

                  return (
                    <div key={msg.id} className={`flex gap-2 ${isOwn ? "flex-row-reverse" : ""}`}>
                      {!isOwn && (
                        <Avatar className="h-8 w-8 shrink-0">
                          <AvatarImage src={msg.senderAvatar || "/placeholder.svg"} />
                          <AvatarFallback>{msg.senderName[0]}</AvatarFallback>
                        </Avatar>
                      )}
                      <div className={`max-w-[75%] ${isOwn ? "items-end" : "items-start"}`}>
                        {!isOwn && <p className="mb-1 text-xs font-medium text-muted-foreground">{msg.senderName}</p>}

                        {isEditing ? (
                          <div className="space-y-2">
                            <Input
                              value={editingContent}
                              onChange={(e) => setEditingContent(e.target.value)}
                              className="text-sm"
                              autoFocus
                            />
                            <div className="flex gap-2">
                              <Button size="sm" variant="outline" onClick={handleCancelEdit}>
                                {t.cancel}
                              </Button>
                              <Button size="sm" onClick={handleSaveEdit} className="bg-[#ef7418] hover:bg-[#ef7418]/90">
                                {t.save}
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="group relative">
                            <div
                              className={`rounded-2xl px-4 py-2.5 ${isOwn ? "bg-[#ef7418] text-white" : "bg-muted"}`}
                            >
                              <p className="text-sm">{msg.content}</p>
                              {msg.isEdited && (
                                <p className={`text-[10px] mt-1 ${isOwn ? "text-white/70" : "text-muted-foreground"}`}>
                                  ({t.messageEdited})
                                </p>
                              )}
                            </div>

                            {isOwn && (
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="absolute -left-8 top-1/2 -translate-y-1/2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                                  >
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="start">
                                  <DropdownMenuItem onClick={() => handleEditMessage(msg.id, msg.content)}>
                                    <Pencil className="h-4 w-4 mr-2" />
                                    {t.editMessage}
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => handleDeleteMessage(msg.id)}
                                    className="text-destructive"
                                  >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    {t.deleteMessage}
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            )}
                          </div>
                        )}

                        <p className="mt-1 text-xs text-muted-foreground">{format(new Date(msg.createdAt), "HH:mm")}</p>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </ScrollArea>

          <div className="border-t p-4 shrink-0">
            <div className="flex gap-3">
              <Input
                placeholder={t.typeMessage}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={handleKeyPress}
                className="flex-1"
              />
              <Button
                size="icon"
                onClick={handleSend}
                disabled={!message.trim()}
                className="bg-[#ef7418] hover:bg-[#ef7418]/90"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      <ParticipantsSheet
        participants={participants}
        planTitle={currentChat.planTitle || ""}
        open={participantsOpen}
        onOpenChange={setParticipantsOpen}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t.confirmDelete}</AlertDialogTitle>
            <AlertDialogDescription>
              {language === "es" ? "Esta acción no se puede deshacer." : "This action cannot be undone."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t.cancel}</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground">
              {t.delete}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
