import mongoose, { Schema, model, models } from 'mongoose';

const UserSchema = new Schema({
    id: { type: String, required: true, unique: true }, // Keeping string ID to match frontend types for now, eventually migrate to _id
    name: { type: String, required: true },
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    isEmailVerified: { type: Boolean, default: false },
    emailVerificationCode: { type: String, default: null },
    emailVerificationExpiresAt: { type: Date, default: null },
    password: String,
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
    blockedUsers: [String],
    language: { type: String, enum: ["es", "en"], default: "es" },
    notificationSettings: {
        newPlansInArea: { type: Boolean, default: true },
        upcomingPlans: { type: Boolean, default: true },
        planChanges: { type: Boolean, default: true },
        groupMessages: { type: Boolean, default: true },
    },
    preferredPaymentMethod: { type: String, enum: ["card", "cash", "wallet", null], default: null },
    walletBalance: { type: Number, default: 0 },
    premiumPlan: { type: String, enum: ["free", "pro", "club"], default: "free" },
    premiumExpiresAt: { type: Date, default: null },
    paidPlans: [{
        planId: String,
        amount: Number,
    }],
    savedPaymentMethods: [{
        type: { type: String, enum: ["bank", "bizum", "paypal"] },
        iban: String,
        bizumPhone: String,
        paypalEmail: String,
        isDefault: { type: Boolean, default: false },
    }],
});

// Helper to use existing model or create new one
export const User = models.User || model('User', UserSchema);
