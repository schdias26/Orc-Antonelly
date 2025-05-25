import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Tipos para o banco de dados
export interface Pasta {
  id: string
  nome: string
  cor: string
  descricao?: string
  created_at: string
  updated_at: string
}

export interface Orcamento {
  id: string
  pasta_id?: string
  ip4?: string
  solicitante?: string
  servico: string
  favorecido: string
  telefone?: string
  cpf_cnpj?: string
  banco?: string
  agencia?: string
  conta?: string
  pix?: string
  valor: number
  valor_formatado?: string
  anexos: string[]
  status: "Pendente" | "Aprovado" | "Rejeitado" | "Em análise"
  created_at: string
  updated_at: string
}

export interface Arquivo {
  id: string
  orcamento_id: string
  nome: string
  tipo: string
  tamanho: number
  dados: string
  preview?: string
  created_at: string
}

export interface UsuarioAtivo {
  id: string
  nome: string
  cor: string
  ultima_atividade: string
  pagina_atual?: string
  orcamento_editando?: string
}
