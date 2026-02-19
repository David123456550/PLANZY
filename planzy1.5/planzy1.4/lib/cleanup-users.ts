"use server";

/**
 * Script de limpieza de usuarios para desarrollo/testing
 * 
 * Uso desde la consola del navegador o desde un componente:
 * 
 * import { deleteAllUsers, deleteAllUnverifiedUsers, getAllUsers } from '@/lib/actions';
 * 
 * // Ver todos los usuarios
 * const users = await getAllUsers();
 * console.log(users);
 * 
 * // Eliminar solo usuarios no verificados
 * await deleteAllUnverifiedUsers();
 * 
 * // Eliminar TODOS los usuarios (¡cuidado!)
 * await deleteAllUsers();
 */

import { deleteAllUsers, deleteAllUnverifiedUsers, getAllUsers, deleteUserByEmail } from './actions';

// Función helper para ejecutar desde la consola del navegador
export async function cleanupUsers() {
    try {
        console.log("🧹 Limpiando usuarios de prueba...");
        
        // Primero mostrar cuántos usuarios hay
        const allUsers = await getAllUsers();
        console.log(`📊 Total de usuarios: ${allUsers.length}`);
        console.log("Usuarios:", allUsers);
        
        // Eliminar solo usuarios no verificados (más seguro)
        const result = await deleteAllUnverifiedUsers();
        console.log(`✅ Eliminados ${result.deletedCount} usuarios no verificados`);
        
        return result;
    } catch (error: any) {
        console.error("❌ Error limpiando usuarios:", error);
        throw error;
    }
}

export { deleteAllUsers, deleteAllUnverifiedUsers, getAllUsers, deleteUserByEmail };
