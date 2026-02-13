import mongoose, { Schema, model, models } from 'mongoose';

const MessageSchema = new Schema({
    id: { type: String, required: true },
    senderId: { type: String, required: true },
    senderName: String,
    senderAvatar: String,
    content: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
    isEdited: Boolean,
    isDeleted: Boolean
});

const ChatSchema = new Schema({
    id: { type: String, required: true, unique: true },
    planId: String,
    planTitle: String,
    isPrivate: Boolean,
    otherUser: Object, // User object
    participants: [Object], // Array of User objects
    messages: [MessageSchema],
    lastMessage: MessageSchema,
    unreadCount: { type: Number, default: 0 }
});

export const Chat = models.Chat || model('Chat', ChatSchema);
