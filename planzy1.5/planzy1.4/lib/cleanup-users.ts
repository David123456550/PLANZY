/**
 * Limpieza vía acciones de servidor: todas requieren la contraseña del único admin (cuenta en admin-config).
 *
 * Ejemplo desde código de servidor o herramienta interna:
 *   await getAllUsersForAdmin(password)
 *   await wipeEntireApplicationDatabase(password, "BORRAR TODO")
 */

import {
  deleteAllUsersForAdmin,
  deleteAllUnverifiedUsersForAdmin,
  getAllUsersForAdmin,
  deleteUserByEmailForAdmin,
  wipeEntireApplicationDatabase,
} from "./actions"

export async function cleanupUnverifiedUsers(adminPassword: string) {
  return deleteAllUnverifiedUsersForAdmin(adminPassword)
}

export async function cleanupAllUsers(adminPassword: string) {
  return deleteAllUsersForAdmin(adminPassword)
}

export {
  getAllUsersForAdmin,
  deleteUserByEmailForAdmin,
  wipeEntireApplicationDatabase,
}
