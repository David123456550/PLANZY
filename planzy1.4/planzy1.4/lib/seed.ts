"use server";

import connectToDatabase from "@/lib/db";
import { User } from "@/lib/models/User";
import { Plan } from "@/lib/models/Plan";
import { mockUsers, mockPlans } from "@/lib/mock-data";

export async function seedDatabase() {
    await connectToDatabase();

    const userCount = await User.countDocuments();
    if (userCount === 0) {
        console.log("Seeding Users...");
        await User.insertMany(mockUsers);
    }

    const planCount = await Plan.countDocuments();
    if (planCount === 0) {
        console.log("Seeding Plans...");
        await Plan.insertMany(mockPlans);
    }

    return { success: true, message: "Database seeded successfully" };
}
