"use client"

import { useState, useEffect } from "react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Users, Wifi, WifiOff } from "lucide-react"
import { realtimeService } from "@/lib/realtime-service"
import { dbService } from "@/lib/database-service"
import type { UsuarioAtivo } from "@/lib/supabase"

interface UserPresenceProps {
  currentPage?: string
}

export function UserPresence({ currentPage }: UserPresenceProps) {
  const [usuarios, setUsuarios] = useState<UsuarioAtivo[]>([])
  const [currentUser, setCurrentUser] = useState<UsuarioAtivo | null>(null)
  const [isOnline, setIsOnline] = useState(true)

  useEffect(() => {
    // Registrar usuário atual
    const registerCurrentUser = async () => {
      try {
        const userName = `Usuário ${Math.floor(Math.random() * 1000)}`
        const user = await realtimeService.registerUser(userName)
        setCurrentUser(user)
      } catch (error) {
        console.error("Erro ao registrar usuário:", error)
      }
    }

    // Carregar usuários ativos
    const loadActiveUsers = async () => {
      const users = await dbService.getUsuariosAtivos()
      setUsuarios(users)
    }

    // Monitorar status de conexão
    const updateOnlineStatus = () => {
      setIsOnline(navigator.onLine)
    }

    registerCurrentUser()
    loadActiveUsers()

    window.addEventListener("online", updateOnlineStatus)
    window.addEventListener("offline", updateOnlineStatus)

    // Subscrever mudanças em usuários ativos
    const channel = realtimeService.subscribeToActiveUsers((payload) => {
      console.log("Mudança em usuários ativos:", payload)
      loadActiveUsers()
    })

    // Limpar usuários inativos periodicamente
    const cleanupInterval = setInterval(() => {
      realtimeService.cleanInactiveUsers()
    }, 60000) // A cada minuto

    // Cleanup ao desmontar
    return () => {
      window.removeEventListener("online", updateOnlineStatus)
      window.removeEventListener("offline", updateOnlineStatus)
      realtimeService.unsubscribe("usuarios-ativos")
      clearInterval(cleanupInterval)
      realtimeService.removeUser()
    }
  }, [])

  // Atualizar página atual quando mudar
  useEffect(() => {
    if (currentUser && currentPage) {
      realtimeService.updateUserActivity(currentPage)
    }
  }, [currentPage, currentUser])

  const usuariosOnline = usuarios.filter((user) => {
    const lastActivity = new Date(user.ultima_atividade)
    const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000)
    return lastActivity > twoMinutesAgo
  })

  return (
    <Card className="border-blue-200 bg-blue-50">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Users className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-800">{usuariosOnline.length} usuário(s) online</span>
            {isOnline ? (
              <div className="flex items-center text-green-600">
                <Wifi className="w-4 h-4 mr-1" />
                <span className="text-xs">Conectado</span>
              </div>
            ) : (
              <div className="flex items-center text-red-600">
                <WifiOff className="w-4 h-4 mr-1" />
                <span className="text-xs">Desconectado</span>
              </div>
            )}
          </div>

          <div className="flex flex-wrap gap-1">
            {usuariosOnline.map((usuario) => (
              <Badge
                key={usuario.id}
                className={`${usuario.cor} text-xs`}
                title={`${usuario.nome} - ${usuario.pagina_atual || "Navegando"}`}
              >
                {usuario.nome}
                {usuario.id === currentUser?.id && " (você)"}
              </Badge>
            ))}
          </div>
        </div>

        {usuariosOnline.length > 1 && (
          <div className="mt-2 text-xs text-blue-600">
            💡 Sistema colaborativo ativo - todas as alterações são sincronizadas em tempo real
          </div>
        )}
      </CardContent>
    </Card>
  )
}
