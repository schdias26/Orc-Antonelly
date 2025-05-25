import { supabase, type Orcamento, type Pasta, type Arquivo } from "./supabase"

export class DatabaseService {
  // OPERAÇÕES DE PASTAS
  async getPastas(): Promise<Pasta[]> {
    const { data, error } = await supabase.from("pastas").select("*").order("created_at", { ascending: false })

    if (error) {
      console.error("Erro ao buscar pastas:", error)
      return []
    }

    return data || []
  }

  async createPasta(pasta: Omit<Pasta, "id" | "created_at" | "updated_at">): Promise<Pasta | null> {
    const { data, error } = await supabase.from("pastas").insert(pasta).select().single()

    if (error) {
      console.error("Erro ao criar pasta:", error)
      return null
    }

    return data
  }

  async updatePasta(id: string, updates: Partial<Pasta>): Promise<boolean> {
    const { error } = await supabase.from("pastas").update(updates).eq("id", id)

    if (error) {
      console.error("Erro ao atualizar pasta:", error)
      return false
    }

    return true
  }

  async deletePasta(id: string): Promise<boolean> {
    const { error } = await supabase.from("pastas").delete().eq("id", id)

    if (error) {
      console.error("Erro ao deletar pasta:", error)
      return false
    }

    return true
  }

  // OPERAÇÕES DE ORÇAMENTOS
  async getOrcamentos(pastaId?: string): Promise<Orcamento[]> {
    let query = supabase.from("orcamentos").select("*").order("created_at", { ascending: false })

    if (pastaId) {
      query = query.eq("pasta_id", pastaId)
    }

    const { data, error } = await query

    if (error) {
      console.error("Erro ao buscar orçamentos:", error)
      return []
    }

    return data || []
  }

  async createOrcamento(orcamento: Omit<Orcamento, "id" | "created_at" | "updated_at">): Promise<Orcamento | null> {
    const { data, error } = await supabase.from("orcamentos").insert(orcamento).select().single()

    if (error) {
      console.error("Erro ao criar orçamento:", error)
      return null
    }

    return data
  }

  async updateOrcamento(id: string, updates: Partial<Orcamento>): Promise<boolean> {
    const { error } = await supabase.from("orcamentos").update(updates).eq("id", id)

    if (error) {
      console.error("Erro ao atualizar orçamento:", error)
      return false
    }

    return true
  }

  async deleteOrcamento(id: string): Promise<boolean> {
    const { error } = await supabase.from("orcamentos").delete().eq("id", id)

    if (error) {
      console.error("Erro ao deletar orçamento:", error)
      return false
    }

    return true
  }

  // OPERAÇÕES DE ARQUIVOS
  async getArquivos(orcamentoId: string): Promise<Arquivo[]> {
    const { data, error } = await supabase
      .from("arquivos")
      .select("*")
      .eq("orcamento_id", orcamentoId)
      .order("created_at", { ascending: true })

    if (error) {
      console.error("Erro ao buscar arquivos:", error)
      return []
    }

    return data || []
  }

  async createArquivo(arquivo: Omit<Arquivo, "id" | "created_at">): Promise<Arquivo | null> {
    const { data, error } = await supabase.from("arquivos").insert(arquivo).select().single()

    if (error) {
      console.error("Erro ao criar arquivo:", error)
      return null
    }

    return data
  }

  async deleteArquivos(orcamentoId: string): Promise<boolean> {
    const { error } = await supabase.from("arquivos").delete().eq("orcamento_id", orcamentoId)

    if (error) {
      console.error("Erro ao deletar arquivos:", error)
      return false
    }

    return true
  }

  // OPERAÇÕES DE USUÁRIOS ATIVOS
  async getUsuariosAtivos(): Promise<any[]> {
    const { data, error } = await supabase
      .from("usuarios_ativos")
      .select("*")
      .order("ultima_atividade", { ascending: false })

    if (error) {
      console.error("Erro ao buscar usuários ativos:", error)
      return []
    }

    return data || []
  }
}

export const dbService = new DatabaseService()
