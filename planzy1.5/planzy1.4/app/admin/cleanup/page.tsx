"use client"

import { useState } from "react"
import {
  deleteAllUsersForAdmin,
  deleteAllUnverifiedUsersForAdmin,
  getAllUsersForAdmin,
  deleteUserByEmailForAdmin,
  wipeEntireApplicationDatabase,
} from "@/lib/actions"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function CleanupPage() {
  const [adminPassword, setAdminPassword] = useState("")
  const [wipeConfirm, setWipeConfirm] = useState("")
  const [users, setUsers] = useState<{ email: string; isEmailVerified?: boolean; createdAt?: string }[]>([])
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState("")

  const loadUsers = async () => {
    if (!adminPassword) {
      setResult("❌ Introduce la contraseña de administrador")
      return
    }
    setLoading(true)
    try {
      const allUsers = await getAllUsersForAdmin(adminPassword)
      setUsers(allUsers)
      setResult(`✅ Cargados ${allUsers.length} usuarios`)
    } catch (error: unknown) {
      setResult(`❌ Error: ${error instanceof Error ? error.message : "desconocido"}`)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteUnverified = async () => {
    if (!adminPassword) return
    if (!confirm("¿Eliminar todos los usuarios no verificados?")) return
    setLoading(true)
    try {
      const res = await deleteAllUnverifiedUsersForAdmin(adminPassword)
      setResult(`✅ Eliminados ${res.deletedCount} usuarios no verificados`)
      await loadUsers()
    } catch (error: unknown) {
      setResult(`❌ Error: ${error instanceof Error ? error.message : "desconocido"}`)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteAll = async () => {
    if (!adminPassword) return
    if (!confirm("¿Eliminar TODOS los usuarios? (no borra planes ni chats)")) return
    setLoading(true)
    try {
      const res = await deleteAllUsersForAdmin(adminPassword)
      setResult(`✅ Eliminados ${res.deletedCount} usuarios`)
      await loadUsers()
    } catch (error: unknown) {
      setResult(`❌ Error: ${error instanceof Error ? error.message : "desconocido"}`)
    } finally {
      setLoading(false)
    }
  }

  const handleWipeEverything = async () => {
    if (!adminPassword) return
    if (!confirm("⚠️ Esto borrará usuarios, planes, chats, torneos, monedero y notificaciones. ¿Continuar?")) return
    setLoading(true)
    try {
      const res = await wipeEntireApplicationDatabase(adminPassword, wipeConfirm)
      setResult(`✅ Base limpiada: ${JSON.stringify(res.deleted)}`)
      setUsers([])
    } catch (error: unknown) {
      setResult(`❌ Error: ${error instanceof Error ? error.message : "desconocido"}`)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteByEmail = async (email: string) => {
    if (!adminPassword) return
    if (!confirm(`¿Eliminar ${email}?`)) return
    setLoading(true)
    try {
      await deleteUserByEmailForAdmin(adminPassword, email)
      setResult(`✅ Usuario eliminado: ${email}`)
      await loadUsers()
    } catch (error: unknown) {
      setResult(`❌ Error: ${error instanceof Error ? error.message : "desconocido"}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto max-w-4xl p-6">
      <Card>
        <CardHeader>
          <CardTitle>Administración — limpieza</CardTitle>
          <CardDescription>
            Solo el usuario administrador (correo configurado en el servidor). Introduce su contraseña de la app para
            cada acción.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2 max-w-md">
            <Label htmlFor="admin-pw">Contraseña del administrador</Label>
            <Input
              id="admin-pw"
              type="password"
              autoComplete="current-password"
              value={adminPassword}
              onChange={(e) => setAdminPassword(e.target.value)}
              placeholder="Contraseña de la cuenta admin en Planzy"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <Button onClick={loadUsers} disabled={loading}>
              Cargar usuarios
            </Button>
            <Button onClick={handleDeleteUnverified} disabled={loading} variant="destructive">
              Eliminar no verificados
            </Button>
            <Button onClick={handleDeleteAll} disabled={loading} variant="destructive" className="bg-red-600 hover:bg-red-700">
              Eliminar todos los usuarios
            </Button>
          </div>

          <div className="rounded-md border border-destructive/50 p-4 space-y-2 max-w-lg">
            <p className="text-sm font-medium text-destructive">Borrar toda la base de datos (app)</p>
            <p className="text-xs text-muted-foreground">
              Escribe <strong>BORRAR TODO</strong> o <strong>DELETE ALL</strong> y confirma.
            </p>
            <Input
              value={wipeConfirm}
              onChange={(e) => setWipeConfirm(e.target.value)}
              placeholder="BORRAR TODO"
              autoComplete="off"
            />
            <Button type="button" onClick={handleWipeEverything} disabled={loading} variant="destructive">
              Borrar todo (usuarios, planes, chats…)
            </Button>
          </div>

          {result && (
            <div
              className={`rounded p-3 text-sm ${result.startsWith("✅") ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800"}`}
            >
              {result}
            </div>
          )}

          {users.length > 0 && (
            <div className="mt-6">
              <h3 className="mb-3 text-lg font-semibold">Usuarios ({users.length})</h3>
              <div className="max-h-96 space-y-2 overflow-y-auto">
                {users.map((u) => (
                  <div key={u.email} className="flex items-center justify-between rounded border p-3">
                    <div>
                      <div className="font-medium">{u.email}</div>
                      <div className="text-sm text-gray-500">
                        {u.isEmailVerified ? "Verificado" : "No verificado"} ·{" "}
                        {u.createdAt ? new Date(u.createdAt).toLocaleString() : ""}
                      </div>
                    </div>
                    <Button size="sm" variant="outline" onClick={() => handleDeleteByEmail(u.email)} disabled={loading}>
                      Eliminar
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
