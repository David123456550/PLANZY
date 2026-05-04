"use server";

import connectToDatabase from "@/lib/db";
import { Plan as PlanModel } from "@/lib/models/Plan";
import { User as UserModel } from "@/lib/models/User";
import { Chat as ChatModel } from "@/lib/models/Chat";
import { Tournament as TournamentModel } from "@/lib/models/Tournament";
import { WalletTransaction as WalletTransactionModel } from "@/lib/models/WalletTransaction";
import { revalidatePath } from "next/cache";
import type { User, Plan, Tournament, WalletTransaction, Chat, Message } from "@/lib/types";
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

  const fromAddress = getResendFrom();
  console.log(`📤 Enviando correo desde: ${fromAddress} a: ${email}`);

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: fromAddress,
      to: [email],
      subject,
      html,
      text: `Tu código de verificación es ${code}. Expira en 10 minutos.`,
    }),
  });

  if (!response.ok) {
    let errorDetails = "";
    try {
      const data = await response.json();
      errorDetails = data?.message ? `: ${data.message}` : "";
      console.error("Respuesta de error de Resend:", data);
    } catch (e) {
      const text = await response.text();
      console.error("Respuesta de error (texto):", text);
    }
    throw new Error(`Resend error (${response.status})${errorDetails}`);
  }

  const responseData = await response.json();
  console.log("✅ Respuesta exitosa de Resend:", responseData);
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

  // 1. Usar SMTP (Gmail, etc.) si está configurado
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;
  const smtpHost = process.env.SMTP_HOST;
  const hasSmtp = smtpUser && smtpPass && smtpHost && smtpHost !== "127.0.0.1";

  // 2. Usar Resend si hay API key y no hay SMTP configurado
  const resendApiKey = process.env.RESEND_API_KEY;
  
  if (hasSmtp) {
    try {
      const transporter = buildMailTransport();
      await transporter.sendMail({
        from: process.env.SMTP_FROM || smtpUser,
        to: email,
        subject,
        html,
        text: `Tu código de verificación es ${code}. Expira en 10 minutos.`,
      });
      console.log(`✅ Correo enviado vía SMTP (${smtpHost}) a ${email}`);
      return;
    } catch (error: any) {
      console.error("❌ Error enviando correo con SMTP:", error.message);
      throw error;
    }
  }
  
  if (resendApiKey) {
    try {
      console.log(`📧 Intentando enviar correo vía Resend a ${email}...`);
      await sendVerificationEmailViaResend(email, name, code);
      console.log(`✅ Correo enviado exitosamente vía Resend a ${email}`);
      return;
    } catch (error: any) {
      console.error("❌ Error enviando correo con Resend:", error.message);
      console.error("Detalles del error:", error);
      throw error; // Relanzar error para que el usuario sepa qué pasó
    }
  }

  // 3. Fallback: SMTP local (Mailhog) o mostrar código en consola
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
    console.log(`✅ Correo enviado vía SMTP a ${email}`);
  } catch (error: any) {
    console.error("❌ Error enviando correo con SMTP:", error.message);
    
    // En desarrollo, mostrar código en consola como fallback
    if (isDevelopment || error.code === "ECONNREFUSED" || error.code === "ESOCKET") {
      console.log("=".repeat(60));
      console.log("📧 CÓDIGO DE VERIFICACIÓN (SMTP no disponible)");
      console.log("=".repeat(60));
      console.log(`Email: ${email}`);
      console.log(`Código: ${code}`);
      console.log("=".repeat(60));
      console.log("💡 Para enviar correos: configura Gmail SMTP o RESEND_API_KEY en .env");
      console.log("=".repeat(60));
      // No lanzar error en desarrollo, permitir continuar
      return;
    }
    throw error;
  }
}

// --- User Actions ---

export async function getUser(email: string) {
    await connectToDatabase();
    
    // Verificar primero cuántos usuarios hay en total
    const totalCount = await UserModel.countDocuments({});
    console.log(`📊 Total de usuarios en BD antes de buscar: ${totalCount}`);
    
    console.log(`🔍 Buscando usuario con email: ${email}`);
    const user = await UserModel.findOne({ email });
    
    if (user) {
        console.log(`⚠️ Usuario encontrado:`, {
            email: user.email,
            isEmailVerified: user.isEmailVerified,
            id: user.id,
            username: user.username
        });
        return JSON.parse(JSON.stringify(user));
    }
    console.log(`✅ No se encontró usuario con email: ${email}`);
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

async function generateUniqueUsername(baseUsername: string): Promise<string> {
    await connectToDatabase();
    let username = baseUsername;
    let counter = 1;
    
    // Verificar si el username ya existe
    while (true) {
        const existing = await UserModel.findOne({ username });
        if (!existing) {
            return username;
        }
        // Si existe, añadir un número al final
        username = `${baseUsername}${counter}`;
        counter++;
        
        // Prevenir bucles infinitos (máximo 1000 intentos)
        if (counter > 1000) {
            username = `${baseUsername}${Date.now()}`;
            break;
        }
    }
    
    return username;
}

export async function createUser(userData: User) {
    try {
        await connectToDatabase();
        console.log(`🔍 Verificando si existe usuario con email: ${userData.email}`);
        
        // Primero contar todos los usuarios para debug
        const totalUsers = await UserModel.countDocuments({});
        console.log(`📊 Total de usuarios en BD: ${totalUsers}`);
        
        const existing = await UserModel.findOne({ $or: [{ email: userData.email }, { id: userData.id }] });
        
        if (existing) {
            console.log(`⚠️ Usuario existente encontrado:`, {
                email: existing.email,
                isEmailVerified: existing.isEmailVerified,
                id: existing.id
            });
        } else {
            console.log(`✅ No existe usuario con ese email, procediendo a crear`);
        }
        
        // Si el usuario existe pero no está verificado, permitir re-registro eliminando el anterior
        if (existing && existing.email === userData.email && !existing.isEmailVerified) {
            console.log(`🗑️ Eliminando usuario no verificado: ${userData.email}`);
            await UserModel.deleteOne({ email: userData.email });
        } else if (existing) {
            console.log(`⚠️ Usuario ya existe y está verificado, retornando usuario existente`);
            return JSON.parse(JSON.stringify(existing));
        }

        // Asegurar que el username sea único
        const uniqueUsername = await generateUniqueUsername(userData.username);
        userData.username = uniqueUsername;

        try {
            const newUser = await UserModel.create(userData);
            revalidatePath('/');
            return JSON.parse(JSON.stringify(newUser));
        } catch (error: any) {
            console.error("Error creando usuario:", error);
            
            // Si aún hay error de duplicado (por ejemplo, username), intentar con un username completamente único
            if (error.code === 11000) {
                if (error.keyPattern?.username) {
                    const fallbackUsername = `${userData.username}_${Date.now()}`;
                    userData.username = fallbackUsername;
                    try {
                        const newUser = await UserModel.create(userData);
                        revalidatePath('/');
                        return JSON.parse(JSON.stringify(newUser));
                    } catch (retryError: any) {
                        console.error("Error en segundo intento:", retryError);
                        throw new Error(`No se pudo crear el usuario. Error: ${retryError.message || 'Desconocido'}`);
                    }
                } else if (error.keyPattern?.email) {
                    throw new Error("Ya existe una cuenta con este correo electrónico");
                } else {
                    throw new Error(`Error de duplicado: ${JSON.stringify(error.keyPattern)}`);
                }
            }
            
            // Otros errores
            throw new Error(`Error al crear usuario: ${error.message || 'Error desconocido'}`);
        }
    } catch (error: any) {
        console.error("Error en createUser:", error);
        // Si el error ya es un Error con mensaje, relanzarlo
        if (error instanceof Error) {
            throw error;
        }
        // Si no, crear un nuevo Error con el mensaje
        throw new Error(`Error al crear usuario: ${error.message || 'Error desconocido'}`);
    }
}

export async function updateUser(id: string, updates: Partial<User>) {
    await connectToDatabase();
    const updated = await UserModel.findOneAndUpdate({ id }, updates, { new: true });
    if (!updated) return null;
    revalidatePath('/');
    return JSON.parse(JSON.stringify(updated));
}

// Funciones de limpieza de usuarios (útil para desarrollo/testing)
export async function deleteUserByEmail(email: string, includeVerified: boolean = true) {
    await connectToDatabase();
    const query: any = { email };
    if (!includeVerified) {
        query.isEmailVerified = false;
    }
    const result = await UserModel.deleteOne(query);
    revalidatePath('/');
    return { success: true, deletedCount: result.deletedCount };
}

export async function deleteAllUnverifiedUsers() {
    await connectToDatabase();
    const result = await UserModel.deleteMany({ isEmailVerified: false });
    revalidatePath('/');
    return { success: true, deletedCount: result.deletedCount };
}

export async function deleteAllUsers() {
    await connectToDatabase();
    
    // Verificar antes de eliminar
    const beforeCount = await UserModel.countDocuments({});
    console.log(`🗑️ Eliminando usuarios. Total antes: ${beforeCount}`);
    
    const result = await UserModel.deleteMany({});
    
    // Verificar después de eliminar
    const afterCount = await UserModel.countDocuments({});
    console.log(`✅ Eliminación completada. Total después: ${afterCount}`);
    console.log(`📊 Usuarios eliminados: ${result.deletedCount}`);
    
    revalidatePath('/');
    return { success: true, deletedCount: result.deletedCount, beforeCount, afterCount };
}

export async function getAllUsers() {
    await connectToDatabase();
    const users = await UserModel.find({}).select('email isEmailVerified createdAt').sort({ createdAt: -1 });
    return JSON.parse(JSON.stringify(users));
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

    const isDevelopment = process.env.NODE_ENV === "development";
    let emailSent = false;
    let errorMessage: string | undefined = undefined;
    
    try {
        await sendVerificationEmail(user.email, user.name, code);
        emailSent = true;
    } catch (error: any) {
        errorMessage = error.message;
        console.error(`❌ Error enviando correo a ${email}:`, errorMessage);
        
        // Resend 403: solo permite enviar al email de la cuenta en modo prueba
        const isResend403 = errorMessage?.includes("403") || errorMessage?.includes("only send testing emails");
        if (isResend403) {
            console.log("=".repeat(60));
            console.log("⚠️  Resend en modo prueba: solo permite enviar a tu email (davidgcbb@gmail.com)");
            console.log("   Para enviar a otros correos, verifica un dominio en resend.com/domains");
            console.log("=".repeat(60));
            console.log(`📧 Código de verificación para ${email}: ${code}`);
            console.log("=".repeat(60));
            // No lanzar error - devolver el código para que el usuario pueda continuar
            return { success: true, code, emailSent: false };
        }
        
        // Si hay RESEND_API_KEY pero falla por otro motivo
        if (process.env.RESEND_API_KEY) {
            throw new Error(`No se pudo enviar el correo: ${errorMessage}`);
        }
        
        // Sin RESEND: mostrar código en consola (desarrollo)
        if (isDevelopment) {
            console.log("=".repeat(60));
            console.log(`📧 Código de verificación: ${code}`);
            console.log("=".repeat(60));
            return { success: true, code, emailSent: false };
        }
        
        throw new Error(`No se pudo enviar el correo: ${errorMessage}`);
    }
    
    return { success: true, code: undefined, emailSent };
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

function normalizeChat(doc: any): Chat {
    return {
        id: doc.id,
        planId: doc.planId || undefined,
        planTitle: doc.planTitle || undefined,
        isPrivate: Boolean(doc.isPrivate),
        otherUser: doc.otherUser || undefined,
        participants: doc.participants || [],
        messages: doc.messages || [],
        lastMessage: doc.lastMessage || undefined,
        unreadCount: doc.unreadCount || 0,
    };
}

async function ensurePlanGroupChat(plan: any) {
    const chatId = `plan-${plan.id}`;
    const existing = await ChatModel.findOne({ id: chatId });
    if (existing) {
        existing.planTitle = plan.title;
        existing.participants = plan.participants || [];
        await existing.save();
        return existing;
    }

    return ChatModel.create({
        id: chatId,
        planId: plan.id,
        planTitle: plan.title,
        isPrivate: false,
        participants: plan.participants || [],
        messages: [],
        unreadCount: 0,
    });
}

export async function getChatsForUser(userId: string) {
    await connectToDatabase();
    const chats = await ChatModel.find({ "participants.id": userId }).sort({ "lastMessage.createdAt": -1, _id: -1 });
    return JSON.parse(JSON.stringify(chats.map(normalizeChat)));
}

export async function createOrGetPrivateChat(currentUser: User, otherUser: User) {
    await connectToDatabase();
    const existing = await ChatModel.findOne({
        isPrivate: true,
        $and: [
            { "participants.id": currentUser.id },
            { "participants.id": otherUser.id },
        ],
    });

    if (existing) {
        return JSON.parse(JSON.stringify(normalizeChat(existing)));
    }

    const chatId = `private-${[currentUser.id, otherUser.id].sort().join("-")}`;
    const newChat = await ChatModel.create({
        id: chatId,
        isPrivate: true,
        otherUser,
        participants: [currentUser, otherUser],
        messages: [],
        unreadCount: 0,
    });

    revalidatePath("/");
    return JSON.parse(JSON.stringify(normalizeChat(newChat)));
}

export async function sendChatMessage(chatId: string, sender: User, content: string) {
    await connectToDatabase();
    const chat = await ChatModel.findOne({ id: chatId });
    if (!chat) throw new Error("Chat not found");

    const newMessage: Message = {
        id: `msg-${Date.now()}`,
        senderId: sender.id,
        senderName: sender.name,
        senderAvatar: sender.avatar,
        content,
        createdAt: new Date(),
    };

    chat.messages.push(newMessage);
    chat.lastMessage = newMessage;
    await chat.save();

    revalidatePath("/");
    return JSON.parse(JSON.stringify(normalizeChat(chat)));
}

export async function markChatAsRead(chatId: string) {
    await connectToDatabase();
    const chat = await ChatModel.findOneAndUpdate({ id: chatId }, { unreadCount: 0 }, { new: true });
    if (!chat) return null;
    revalidatePath("/");
    return JSON.parse(JSON.stringify(normalizeChat(chat)));
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
    await ensurePlanGroupChat(newPlan);
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
    await ensurePlanGroupChat(plan);

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
