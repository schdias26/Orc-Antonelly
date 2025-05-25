import { supabase, type UsuarioAtivo } from "./supabase"
import type { RealtimeChannel } from "@supabase/supabase-js"

class RealtimeService {
  private channels: Map<string, RealtimeChannel> = new Map()
  private currentUser: UsuarioAtivo | null = null

  // Gerar cor aleatória para o usuário
  private generateUserColor(): string {
    const colors = [
      "bg-blue-100 text-blue-800 border-blue-200",
      "bg-purple-100 text-purple-800 border-purple-200",
      "bg-pink-100 text-pink-800 border-pink-200",
      "bg-yellow-100 text-yellow-800 border-yellow-200",
      "bg-orange-100 text-orange-800 border-orange-200",
      "bg-red-100 text-red-800 border-red-200",
      "bg-indigo-100 text-indigo-800 border-indigo-200",
      "bg-teal-100 text-teal-800 border-teal-200",
    ]
    return colors[Math.floor(Math.random() * colors.length)]
  }

  // Registrar usuário ativo
  async registerUser(nome: string): Promise<UsuarioAtivo> {
    if (this.currentUser) {
      return this.currentUser
    }

    const { data, error } = await supabase
      .from("usuarios_ativos")
      .insert({
        nome,
        cor: this.generateUserColor(),
        ultima_atividade: new Date().toISOString(),
        pagina_atual: window.location.pathname,
      })
      .select()
      .single()

    if (error) {
      console.error("Erro ao registrar usuário:", error)
      throw error
    }

    this.currentUser = data
    this.startHeartbeat()
    return data
  }

  // Atualizar atividade do usuário
  async updateUserActivity(paginaAtual?: string, orcamentoEditando?: string) {
    if (!this.currentUser) return

    const { error } = await supabase
      .from("usuarios_ativos")
      .update({
        ultima_atividade: new Date().toISOString(),
        pagina_atual: paginaAtual || window.location.pathname,
        orcamento_editando: orcamentoEditando,
      })
      .eq("id", this.currentUser.id)

    if (error) {
      console.error("Erro ao atualizar atividade:", error)
    }
  }

  // Heartbeat para manter usuário ativo
  private startHeartbeat() {
    setInterval(() => {
      this.updateUserActivity()
    }, 30000) // A cada 30 segundos
  }

  // Limpar usuários inativos (mais de 2 minutos)
  async cleanInactiveUsers() {
    const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000).toISOString()

    const { error } = await supabase.from("usuarios_ativos").delete().lt("ultima_atividade", twoMinutesAgo)

    if (error) {
      console.error("Erro ao limpar usuários inativos:", error)
    }
  }

  // Subscrever mudanças em orçamentos
  subscribeToOrcamentos(callback: (payload: any) => void): RealtimeChannel {
    const channel = supabase
      .channel("orcamentos-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "orcamentos" }, callback)
      .subscribe()

    this.channels.set("orcamentos", channel)
    return channel
  }

  // Subscrever mudanças em pastas
  subscribeToPastas(callback: (payload: any) => void): RealtimeChannel {
    const channel = supabase
      .channel("pastas-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "pastas" }, callback)
      .subscribe()

    this.channels.set("pastas", channel)
    return channel
  }

  // Subscrever usuários ativos
  subscribeToActiveUsers(callback: (payload: any) => void): RealtimeChannel {
    const channel = supabase
      .channel("usuarios-ativos-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "usuarios_ativos" }, callback)
      .subscribe()

    this.channels.set("usuarios-ativos", channel)
    return channel
  }

  // Desinscrever de um canal
  unsubscribe(channelName: string) {
    const channel = this.channels.get(channelName)
    if (channel) {
      supabase.removeChannel(channel)
      this.channels.delete(channelName)
    }
  }

  // Desinscrever de todos os canais
  unsubscribeAll() {
    this.channels.forEach((channel, name) => {
      supabase.removeChannel(channel)
    })
    this.channels.clear()
  }

  // Remover usuário ao sair
  async removeUser() {
    if (this.currentUser) {
      await supabase.from("usuarios_ativos").delete().eq("id", this.currentUser.id)

      this.currentUser = null
    }
  }

  getCurrentUser(): UsuarioAtivo | null {
    return this.currentUser
  }
}

export const realtimeService = new RealtimeService()
