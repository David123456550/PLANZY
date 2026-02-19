"use client";

import { useState } from "react";
import { deleteAllUsers, deleteAllUnverifiedUsers, getAllUsers, deleteUserByEmail } from "@/lib/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function CleanupPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string>("");

  const loadUsers = async () => {
    setLoading(true);
    try {
      const allUsers = await getAllUsers();
      setUsers(allUsers);
      setResult(`✅ Cargados ${allUsers.length} usuarios`);
    } catch (error: any) {
      setResult(`❌ Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUnverified = async () => {
    if (!confirm("¿Estás seguro de eliminar TODOS los usuarios no verificados?")) return;
    
    setLoading(true);
    try {
      const result = await deleteAllUnverifiedUsers();
      setResult(`✅ Eliminados ${result.deletedCount} usuarios no verificados`);
      await loadUsers();
    } catch (error: any) {
      setResult(`❌ Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAll = async () => {
    if (!confirm("⚠️ ¿ESTÁS SEGURO de eliminar TODOS los usuarios? Esta acción no se puede deshacer.")) return;
    if (!confirm("⚠️ ÚLTIMA CONFIRMACIÓN: ¿Eliminar TODOS los usuarios?")) return;
    
    setLoading(true);
    try {
      const result = await deleteAllUsers();
      setResult(`✅ Eliminados ${result.deletedCount} usuarios`);
      await loadUsers();
    } catch (error: any) {
      setResult(`❌ Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteByEmail = async (email: string) => {
    if (!confirm(`¿Eliminar usuario con email: ${email}?`)) return;
    
    setLoading(true);
    try {
      const result = await deleteUserByEmail(email);
      setResult(`✅ Usuario eliminado: ${email}`);
      await loadUsers();
    } catch (error: any) {
      setResult(`❌ Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle>🧹 Limpieza de Usuarios</CardTitle>
          <CardDescription>
            Herramienta de administración para eliminar usuarios de prueba de la base de datos
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2 flex-wrap">
            <Button onClick={loadUsers} disabled={loading}>
              📊 Cargar Usuarios
            </Button>
            <Button 
              onClick={handleDeleteUnverified} 
              disabled={loading}
              variant="destructive"
            >
              🗑️ Eliminar No Verificados
            </Button>
            <Button 
              onClick={handleDeleteAll} 
              disabled={loading}
              variant="destructive"
              className="bg-red-600 hover:bg-red-700"
            >
              ⚠️ Eliminar TODOS
            </Button>
          </div>

          {result && (
            <div className={`p-3 rounded ${result.includes("✅") ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800"}`}>
              {result}
            </div>
          )}

          {users.length > 0 && (
            <div className="mt-6">
              <h3 className="text-lg font-semibold mb-3">
                Usuarios en la base de datos ({users.length})
              </h3>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {users.map((user, index) => (
                  <div 
                    key={index}
                    className="flex items-center justify-between p-3 border rounded"
                  >
                    <div>
                      <div className="font-medium">{user.email}</div>
                      <div className="text-sm text-gray-500">
                        {user.isEmailVerified ? "✅ Verificado" : "❌ No verificado"} • 
                        Creado: {new Date(user.createdAt).toLocaleString()}
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDeleteByEmail(user.email)}
                      disabled={loading}
                    >
                      Eliminar
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {users.length === 0 && !loading && (
            <div className="text-center text-gray-500 py-8">
              No hay usuarios. Haz clic en "Cargar Usuarios" para ver la lista.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
