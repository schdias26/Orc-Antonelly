export interface Pasta {
  id: string
  nome: string
  cor: string
  descricao?: string
  dataCriacao: string
}

// Atualizar interface Orcamento para incluir pastaId
export interface Orcamento {
  id: string
  pastaId?: string
  ip4: string
  solicitante: string
  servico: string
  favorecido: string
  telefone: string
  cpfCnpj: string
  banco: string
  agencia: string
  conta: string
  pix: string
  valor: number
  valorFormatado: string
  anexos: string[]
  dataEnvio: string
  status: "Pendente" | "Aprovado" | "Rejeitado" | "Em análise"
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value)
}

export function parseCurrency(value: string): number {
  const cleanValue = value.replace(/[^\d,]/g, "").replace(",", ".")
  return Number.parseFloat(cleanValue) || 0
}

export function toTitleCase(str: string): string {
  return str
    .toLowerCase()
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ")
}

export function generateOrcamentoId(servico: string, favorecido: string, data: string): string {
  const dataFormatada = new Date(data).toLocaleDateString("pt-BR").replace(/\//g, "-")
  const cleanServico = servico
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .substring(0, 20)
  const cleanFavorecido = favorecido
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .substring(0, 20)
  return `${cleanServico}-${cleanFavorecido}-${dataFormatada}`
}

export function generatePDFFileName(orcamento: Orcamento): string {
  const dataFormatada = new Date(orcamento.dataEnvio).toLocaleDateString("pt-BR").replace(/\//g, "-")
  const cleanServico = toTitleCase(orcamento.servico)
    .replace(/\s+/g, "-")
    .replace(/[^a-zA-Z0-9-]/g, "")
    .substring(0, 30)
  const cleanFavorecido = toTitleCase(orcamento.favorecido)
    .replace(/\s+/g, "-")
    .replace(/[^a-zA-Z0-9-]/g, "")
    .substring(0, 30)

  return `${cleanServico}-${cleanFavorecido}-${dataFormatada}.pdf`
}

export function checkDuplicateOrcamento(
  orcamentos: Orcamento[],
  servico: string,
  favorecido: string,
  data: string,
): { isDuplicate: boolean; existingOrcamento?: Orcamento } {
  const id = generateOrcamentoId(servico, favorecido, data)
  const duplicate = orcamentos.find((orc) => orc.id === id)

  if (duplicate) {
    return { isDuplicate: true, existingOrcamento: duplicate }
  }

  const dayDuplicates = orcamentos.filter((orc) => {
    return (
      orc.dataEnvio === data &&
      orc.servico.toLowerCase().trim() === servico.toLowerCase().trim() &&
      orc.favorecido.toLowerCase().trim() === favorecido.toLowerCase().trim()
    )
  })

  if (dayDuplicates.length > 0) {
    return { isDuplicate: true, existingOrcamento: dayDuplicates[0] }
  }

  return { isDuplicate: false }
}

// Adicionar funções para gerenciar pastas
export function getPastas(): Pasta[] {
  try {
    const stored = localStorage.getItem("pastas")
    return stored ? JSON.parse(stored) : []
  } catch (error) {
    return []
  }
}

export function savePasta(pasta: Omit<Pasta, "id" | "dataCriacao">): {
  success: boolean
  message: string
  id?: string
} {
  try {
    const existingPastas = getPastas()

    // Verificar se já existe uma pasta com o mesmo nome
    const duplicate = existingPastas.find((p) => p.nome.toLowerCase() === pasta.nome.toLowerCase())
    if (duplicate) {
      return { success: false, message: "Já existe uma pasta com este nome." }
    }

    const id = `pasta-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    const newPasta: Pasta = {
      ...pasta,
      id,
      dataCriacao: new Date().toISOString(),
    }

    const updatedPastas = [...existingPastas, newPasta]
    localStorage.setItem("pastas", JSON.stringify(updatedPastas))

    return { success: true, message: "Pasta criada com sucesso!", id }
  } catch (error) {
    return { success: false, message: "Erro ao criar pasta." }
  }
}

export function deletePasta(id: string): boolean {
  try {
    const pastas = getPastas()
    const orcamentos = getOrcamentos()

    // Verificar se há orçamentos na pasta
    const orcamentosNaPasta = orcamentos.filter((orc) => orc.pastaId === id)
    if (orcamentosNaPasta.length > 0) {
      return false // Não permitir deletar pasta com orçamentos
    }

    const filtered = pastas.filter((pasta) => pasta.id !== id)
    localStorage.setItem("pastas", JSON.stringify(filtered))
    return true
  } catch (error) {
    return false
  }
}

export function updatePasta(id: string, updates: Partial<Omit<Pasta, "id" | "dataCriacao">>): boolean {
  try {
    const pastas = getPastas()
    const index = pastas.findIndex((pasta) => pasta.id === id)

    if (index !== -1) {
      pastas[index] = { ...pastas[index], ...updates }
      localStorage.setItem("pastas", JSON.stringify(pastas))
      return true
    }
    return false
  } catch (error) {
    return false
  }
}

// Atualizar função saveOrcamento para incluir pastaId
export function saveOrcamento(orcamento: Omit<Orcamento, "id">): { success: boolean; message: string; id?: string } {
  try {
    const existingOrcamentos = getOrcamentos()
    const duplicateCheck = checkDuplicateOrcamento(
      existingOrcamentos,
      orcamento.servico,
      orcamento.favorecido,
      orcamento.dataEnvio,
    )

    if (duplicateCheck.isDuplicate) {
      const existing = duplicateCheck.existingOrcamento!
      return {
        success: false,
        message: `Orçamento duplicado! Já existe um orçamento idêntico (ID: ${existing.id}) criado em ${new Date(existing.dataEnvio).toLocaleDateString("pt-BR")}. Mesmo fornecedor e serviço não podem ser repetidos no mesmo dia.`,
      }
    }

    const id = generateOrcamentoId(orcamento.servico, orcamento.favorecido, orcamento.dataEnvio)
    const newOrcamento: Orcamento = { ...orcamento, id }
    const updatedOrcamentos = [...existingOrcamentos, newOrcamento]

    localStorage.setItem("orcamentos", JSON.stringify(updatedOrcamentos))
    return { success: true, message: "Orçamento salvo com sucesso!", id }
  } catch (error) {
    return { success: false, message: "Erro ao salvar orçamento." }
  }
}

// Função para mover orçamento para pasta
export function moveOrcamentoToPasta(orcamentoId: string, pastaId: string | null): boolean {
  try {
    const orcamentos = getOrcamentos()
    const index = orcamentos.findIndex((orc) => orc.id === orcamentoId)

    if (index !== -1) {
      orcamentos[index].pastaId = pastaId || undefined
      localStorage.setItem("orcamentos", JSON.stringify(orcamentos))
      return true
    }
    return false
  } catch (error) {
    return false
  }
}

// Atualizar a função getOrcamentosByPasta para funcionar corretamente
export function getOrcamentosByPasta(pastaId?: string): Orcamento[] {
  const orcamentos = getOrcamentos()
  if (pastaId) {
    return orcamentos.filter((orc) => orc.pastaId === pastaId)
  } else {
    return orcamentos.filter((orc) => !orc.pastaId) // Orçamentos sem pasta
  }
}

// Adicionar função para obter estatísticas por pasta
export function getEstatisticasPorPasta(pastaId?: string): {
  total: number
  pendentes: number
  aprovados: number
  rejeitados: number
  emAnalise: number
  valorTotal: number
} {
  const orcamentos = getOrcamentosByPasta(pastaId)

  return {
    total: orcamentos.length,
    pendentes: orcamentos.filter((o) => o.status === "Pendente").length,
    aprovados: orcamentos.filter((o) => o.status === "Aprovado").length,
    rejeitados: orcamentos.filter((o) => o.status === "Rejeitado").length,
    emAnalise: orcamentos.filter((o) => o.status === "Em análise").length,
    valorTotal: orcamentos.reduce((sum, o) => sum + o.valor, 0),
  }
}

export function getOrcamentos(): Orcamento[] {
  try {
    const stored = localStorage.getItem("orcamentos")
    return stored ? JSON.parse(stored) : []
  } catch (error) {
    return []
  }
}

export function updateOrcamentoStatus(id: string, status: Orcamento["status"]): boolean {
  try {
    const orcamentos = getOrcamentos()
    const index = orcamentos.findIndex((orc) => orc.id === id)

    if (index !== -1) {
      orcamentos[index].status = status
      localStorage.setItem("orcamentos", JSON.stringify(orcamentos))
      return true
    }
    return false
  } catch (error) {
    return false
  }
}

export function deleteOrcamento(id: string): boolean {
  try {
    const orcamentos = getOrcamentos()
    const filtered = orcamentos.filter((orc) => orc.id !== id)
    localStorage.setItem("orcamentos", JSON.stringify(filtered))
    return true
  } catch (error) {
    return false
  }
}
