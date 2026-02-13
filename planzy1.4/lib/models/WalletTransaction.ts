import mongoose, { Schema, model, models } from 'mongoose';

const WalletTransactionSchema = new Schema({
    id: { type: String, required: true, unique: true },
    type: { type: String, enum: ["refund", "withdrawal", "income", "deposit"], required: true },
    amount: { type: Number, required: true },
    description: String,
    planId: String,
    createdAt: { type: Date, default: Date.now }
});

export const WalletTransaction = models.WalletTransaction || model('WalletTransaction', WalletTransactionSchema);
