import mongoose, { Schema, model, models } from 'mongoose';

const NotificationSchema = new Schema({
    id: { type: String, required: true, unique: true },
    type: { type: String, enum: ["new_plan", "upcoming", "plan_change", "message"], required: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    planId: String,
    read: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now }
});

export const Notification = models.Notification || model('Notification', NotificationSchema);
