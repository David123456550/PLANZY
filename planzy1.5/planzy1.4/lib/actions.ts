"use server";

import connectToDatabase from "@/lib/db";
import { Plan as PlanModel } from "@/lib/models/Plan";
import { User as UserModel } from "@/lib/models/User";
import { Tournament as TournamentModel } from "@/lib/models/Tournament";
import { WalletTransaction as WalletTransactionModel } from "@/lib/models/WalletTransaction";
import { revalidatePath } from "next/cache";
import type { User, Plan, Tournament, WalletTransaction } from "@/lib/types";
import nodemailer from "nodemailer";

const RESEND_DEFAULT_FROM = "Planzy <onboarding@resend.dev>";

function getResendFrom(): string {
  const custom = process.env.RESEND_FROM;
  if (custom?.includes("@")) {
    return custom.includes("<") ? custom : `Planzy <${custom}>`;
  }
  return RESEND_DEFAULT_FROM;
}

async function sendVerificationEmailViaResend(email: string, name: string, code: string) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new Error("RESEND_API_KEY no configurada");

  const subject = "Código de verificación de Planzy";
  const html = `
    <div style="font-family: Arial, sans-serif; line-height:1.5; color:#222;">
      <h2>¡Hola ${name || ""}!</h2>
      <p>Tu código de verificación es:</p>
      <p style="font-size: 28px; font-weight: 700; letter-spacing: 4px; margin: 16px 0;">${code}</p>
      <p>Este código expira en 10 minutos.</p>
    </div>
  `;

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: getResendFrom(),
      to: [email],
      subject,
      html,
      text: `Tu código de verificación es ${code}. Expira en 10 minutos.`,
    }),
  });

  if (!response.ok) {
    let details = "";
    try {
      const data = await response.json();
      details = data?.message ? `: ${data.message}` : "";
    } catch {
      // ignore
    }
    throw new Error(`Resend error (${response.status})${details}`);
  }
}

function buildMailTransport() {
  const host = process.env.SMTP_HOST || "127.0.0.1";
  const port = Number(process.env.SMTP_PORT || 1025);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: user && pass ? { user, pass } : undefined,
  });
}

async function sendVerificationEmail(email: string, name: string, code: string) {
  const subject = "Código de verificación de Planzy";
  const html = `
    <div style="font-family: Arial, sans-serif; line-height:1.5; color:#222;">
      <h2>¡Hola ${name || ""}!</h2>
      <p>Tu código de verificación es:</p>
      <p style="font-size: 28px; font-weight: 700; letter-spacing: 4px; margin: 16px 0;">${code}</p>
      <p>Este código expira en 10 minutos.</p>
    </div>
  `;

  // 1. Usar Resend si hay API key (no requiere SMTP)
  if (process.env.RESEND_API_KEY) {
    await sendVerificationEmailViaResend(email, name, code);
    return;
  }

  // 2. Usar SMTP (Mailhog, Mailpit, Gmail, etc.)
  const isDevelopment = process.env.NODE_ENV === "development";
  try {
    const transporter = buildMailTransport();
    await transporter.sendMail({
      from: process.env.SMTP_FROM || "no-reply@planzy.local",
      to: email,
      subject,
      html,
      text: `Tu código de verificación es ${code}. Expira en 10 minutos.`,
    });
  } catch (error: any) {
    if (isDevelopment || error.code === "ECONNREFUSED" || error.code === "ESOCKET") {
      console.log("=".repeat(60));
      console.log("📧 CÓDIGO DE VERIFICACIÓN (SMTP no disponible)");
      console.log("=".repeat(60));
      console.log(`Email: ${email}`);
      console.log(`Código: ${code}`);
      console.log("=".repeat(60));
      return;
    }
    throw error;
  }
}

// --- User Actions ---

export async function getUser(email: string) {
    await connectToDatabase();
    const user = await UserModel.findOne({ email });
    if (user) {
        return JSON.parse(JSON.stringify(user));
    }
    return null;
}

export async function getUserById(id: string) {
    await connectToDatabase();
    const user = await UserModel.findOne({ id });
    if (user) {
        return JSON.parse(JSON.stringify(user));
    }
    return null;
}

export async function createUser(userData: User) {
    await connectToDatabase();
    const existing = await UserModel.findOne({ $or: [{ email: userData.email }, { id: userData.id }] });
    
    // Si el usuario existe pero no está verificado, permitir re-registro eliminando el anterior
    if (existing && existing.email === userData.email && !existing.isEmailVerified) {
        await UserModel.deleteOne({ email: userData.email });
    } else if (existing) {
        return JSON.parse(JSON.stringify(existing));
    }

    const newUser = await UserModel.create(userData);
    revalidatePath('/');
    return JSON.parse(JSON.stringify(newUser));
}

export async function updateUser(id: string, updates: Partial<User>) {
    await connectToDatabase();
    const updated = await UserModel.findOneAndUpdate({ id }, updates, { new: true });
    if (!updated) return null;
    revalidatePath('/');
    return JSON.parse(JSON.stringify(updated));
}

export async function sendRegisterVerificationCode(email: string) {
    await connectToDatabase();
    const user = await UserModel.findOne({ email });
    if (!user) throw new Error("User not found");

    const code = `${Math.floor(100000 + Math.random() * 900000)}`;
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    user.emailVerificationCode = code;
    user.emailVerificationExpiresAt = expiresAt;
    await user.save();

    const isDevelopment = process.env.NODE_ENV === "development" || !process.env.SMTP_HOST;
    let emailSent = false;
    
    try {
        await sendVerificationEmail(user.email, user.name, code);
        emailSent = true;
    } catch (error: any) {
        // Si falla el envío pero estamos en desarrollo, continuar de todas formas
        if (!isDevelopment && error.code !== 'ECONNREFUSED' && error.code !== 'ESOCKET') {
            throw error;
        }
    }
    
    // Devolver el código si estamos en desarrollo o si el email no se pudo enviar
    return { 
        success: true, 
        code: (isDevelopment || !emailSent) ? code : undefined 
    };
}

export async function verifyRegisterCode(email: string, code: string) {
    await connectToDatabase();
    const user = await UserModel.findOne({ email });
    if (!user) {
        return { success: false, reason: "not-found" };
    }

    const isExpired = !user.emailVerificationExpiresAt || new Date(user.emailVerificationExpiresAt).getTime() < Date.now();
    if (isExpired) {
        return { success: false, reason: "expired" };
    }

    if (!user.emailVerificationCode || user.emailVerificationCode !== code) {
        return { success: false, reason: "invalid" };
    }

    user.isEmailVerified = true;
    user.emailVerificationCode = null;
    user.emailVerificationExpiresAt = null;
    await user.save();

    revalidatePath('/');
    return { success: true, user: JSON.parse(JSON.stringify(user)) };
}

// --- Plan Actions ---

export async function getPlans() {
    await connectToDatabase();
    const plans = await PlanModel.find({}).sort({ date: 1 });
    return JSON.parse(JSON.stringify(plans));
}

export async function createPlan(planData: Plan) {
    await connectToDatabase();
    const newPlan = await PlanModel.create(planData);
    revalidatePath('/');
    return JSON.parse(JSON.stringify(newPlan));
}

export async function updatePlan(planId: string, updates: Partial<Plan>) {
    await connectToDatabase();
    const updated = await PlanModel.findOneAndUpdate({ id: planId }, updates, { new: true });
    if (!updated) throw new Error("Plan not found");
    revalidatePath('/');
    return JSON.parse(JSON.stringify(updated));
}

export async function deletePlan(planId: string) {
    await connectToDatabase();
    await PlanModel.deleteOne({ id: planId });
    revalidatePath('/');
    return { success: true };
}

export async function joinPlan(planId: string, user: User) {
    await connectToDatabase();
    const plan = await PlanModel.findOne({ id: planId });
    if (!plan) throw new Error("Plan not found");

    // Check if already participating
    const isParticipant = plan.participants.some((p: any) => p.id === user.id);
    if (isParticipant) return JSON.parse(JSON.stringify(plan));

    plan.participants.push(user);
    plan.currentParticipants = plan.participants.length;
    await plan.save();

    revalidatePath('/');
    return JSON.parse(JSON.stringify(plan));
}

export async function leavePlan(planId: string, userId: string) {
    await connectToDatabase();
    const plan = await PlanModel.findOne({ id: planId });
    if (!plan) throw new Error("Plan not found");

    plan.participants = plan.participants.filter((p: any) => p.id !== userId);
    plan.currentParticipants = Math.max(0, plan.participants.length);
    await plan.save();

    revalidatePath('/');
    return JSON.parse(JSON.stringify(plan));
}

// --- Tournament Actions ---

export async function getTournaments() {
    await connectToDatabase();
    const tournaments = await TournamentModel.find({}).sort({ createdAt: -1 });
    return JSON.parse(JSON.stringify(tournaments));
}

export async function createTournament(tournamentData: Tournament) {
    await connectToDatabase();
    const newTournament = await TournamentModel.create(tournamentData);
    revalidatePath('/');
    return JSON.parse(JSON.stringify(newTournament));
}

// --- Wallet Actions ---

export async function getWalletTransactions(userId: string) {
    await connectToDatabase();
    const transactions = await WalletTransactionModel.find({ userId }).sort({ createdAt: -1 });
    return JSON.parse(JSON.stringify(transactions));
}

export async function createWalletTransaction(userId: string, transactionData: Omit<WalletTransaction, "createdAt">) {
    await connectToDatabase();
    const newTransaction = await WalletTransactionModel.create({
        ...transactionData,
        userId,
        createdAt: new Date(),
    });
    revalidatePath('/');
    return JSON.parse(JSON.stringify(newTransaction));
}
