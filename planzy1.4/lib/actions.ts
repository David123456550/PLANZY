"use server";

import connectToDatabase from "@/lib/db";
import { Plan as PlanModel } from "@/lib/models/Plan";
import { User as UserModel } from "@/lib/models/User";
import { revalidatePath } from "next/cache";
import type { User, Plan } from "@/lib/types";

// --- User Actions ---

export async function getUser(email: string) {
    await connectToDatabase();
    const user = await UserModel.findOne({ email });
    if (user) {
        return JSON.parse(JSON.stringify(user));
    }
    return null;
}

export async function createUser(userData: User) {
    await connectToDatabase();
    const existing = await UserModel.findOne({ email: userData.email });
    if (existing) return JSON.parse(JSON.stringify(existing));

    const newUser = await UserModel.create(userData);
    return JSON.parse(JSON.stringify(newUser));
}

export async function updateUser(id: string, updates: Partial<User>) {
    await connectToDatabase();
    // Use type assertion if automatic inference fails for Mongoose specific methods
    const updated = await UserModel.findOneAndUpdate({ id }, updates, { new: true });
    revalidatePath('/');
    return JSON.parse(JSON.stringify(updated));
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

export async function joinPlan(planId: string, user: User) {
    await connectToDatabase();
    const plan = await PlanModel.findOne({ id: planId });
    if (!plan) throw new Error("Plan not found");

    // Check if already participating
    const isParticipant = plan.participants.some((p: any) => p.id === user.id);
    if (isParticipant) return JSON.parse(JSON.stringify(plan));

    plan.participants.push(user);
    plan.currentParticipants += 1;
    await plan.save();

    revalidatePath('/');
    return JSON.parse(JSON.stringify(plan));
}

export async function leavePlan(planId: string, userId: string) {
    await connectToDatabase();
    const plan = await PlanModel.findOne({ id: planId });
    if (!plan) throw new Error("Plan not found");

    plan.participants = plan.participants.filter((p: any) => p.id !== userId);
    plan.currentParticipants = Math.max(0, plan.currentParticipants - 1);
    await plan.save();

    revalidatePath('/');
    return JSON.parse(JSON.stringify(plan));
}
