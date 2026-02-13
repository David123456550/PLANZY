import mongoose, { Schema, model, models } from 'mongoose';

const UserSchema = new Schema({
    id: { type: String, required: true, unique: true }, // Keeping string ID to match frontend types for now, eventually migrate to _id
    name: { type: String, required: true },
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    phone: String,
    dni: String,
    avatar: String,
    description: String,
    interests: [String],
    isVerified: { type: Boolean, default: false },
    age: Number,
    location: {
        lat: Number,
        lng: Number,
        city: String
    },
    createdAt: { type: Date, default: Date.now },
    blockedUsers: [String]
});

// Helper to use existing model or create new one
export const User = models.User || model('User', UserSchema);
