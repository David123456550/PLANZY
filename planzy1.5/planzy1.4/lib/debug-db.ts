"use server";

import connectToDatabase from "@/lib/db";
import { User as UserModel } from "@/lib/models/User";

export async function debugDatabase() {
    try {
        await connectToDatabase();
        
        const totalUsers = await UserModel.countDocuments({});
        const verifiedUsers = await UserModel.countDocuments({ isEmailVerified: true });
        const unverifiedUsers = await UserModel.countDocuments({ isEmailVerified: false });
        
        const allUsers = await UserModel.find({}).select('email isEmailVerified createdAt').sort({ createdAt: -1 });
        
        console.log("=".repeat(60));
        console.log("🔍 DEBUG DE BASE DE DATOS");
        console.log("=".repeat(60));
        console.log(`Total de usuarios: ${totalUsers}`);
        console.log(`Usuarios verificados: ${verifiedUsers}`);
        console.log(`Usuarios no verificados: ${unverifiedUsers}`);
        console.log("=".repeat(60));
        console.log("Lista de usuarios:");
        allUsers.forEach((user, index) => {
            console.log(`${index + 1}. ${user.email} - ${user.isEmailVerified ? '✅ Verificado' : '❌ No verificado'} - ${new Date(user.createdAt).toLocaleString()}`);
        });
        console.log("=".repeat(60));
        
        return {
            totalUsers,
            verifiedUsers,
            unverifiedUsers,
            users: JSON.parse(JSON.stringify(allUsers))
        };
    } catch (error: any) {
        console.error("❌ Error en debug:", error);
        throw error;
    }
}
