export interface Orcamento {
  id: string
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
  anexos: string[]
  dataEnvio: string
  status: "Pendente" | "Aprovado" | "Rejeitado" | "Em análise"
}

export function generateOrcamentoId(servico: string, favorecido: string, valor: number, data: string): string {
  const month = data.substring(0, 7) // YYYY-MM
  const cleanServico = servico.toLowerCase().replace(/\s+/g, "")
  const cleanFavorecido = favorecido.toLowerCase().replace(/\s+/g, "")
  return `${cleanServico}-${cleanFavorecido}-${valor}-${month}`
}

export function checkDuplicateOrcamento(
  orcamentos: Orcamento[],
  servico: string,
  favorecido: string,
  valor: number,
  data: string,
): { isDuplicate: boolean; existingOrcamento?: Orcamento } {
  // Verificar duplicata no mesmo mês
  const monthId = generateOrcamentoId(servico, favorecido, valor, data)
  const monthDuplicate = orcamentos.find((orc) => orc.id === monthId)

  if (monthDuplicate) {
    return { isDuplicate: true, existingOrcamento: monthDuplicate }
  }

  // Verificar duplicata no mesmo dia
  const dayDuplicates = orcamentos.filter((orc) => {
    return (
      orc.dataEnvio === data &&
      orc.servico.toLowerCase().trim() === servico.toLowerCase().trim() &&
      orc.favorecido.toLowerCase().trim() === favorecido.toLowerCase().trim() &&
      orc.valor === valor
    )
  })

  if (dayDuplicates.length > 0) {
    return { isDuplicate: true, existingOrcamento: dayDuplicates[0] }
  }

  return { isDuplicate: false }
}

export function saveOrcamento(orcamento: Omit<Orcamento, "id">): { success: boolean; message: string; id?: string } {
  try {
    const existingOrcamentos = getOrcamentos()
    const duplicateCheck = checkDuplicateOrcamento(
      existingOrcamentos,
      orcamento.servico,
      orcamento.favorecido,
      orcamento.valor,
      orcamento.dataEnvio,
    )

    if (duplicateCheck.isDuplicate) {
      const existing = duplicateCheck.existingOrcamento!
      return {
        success: false,
        message: `Orçamento duplicado! Já existe um orçamento idêntico (ID: ${existing.id}) criado em ${new Date(existing.dataEnvio).toLocaleDateString("pt-BR")}. Mesmo fornecedor, serviço e valor não podem ser repetidos no mesmo mês.`,
      }
    }

    const id = generateOrcamentoId(orcamento.servico, orcamento.favorecido, orcamento.valor, orcamento.dataEnvio)
    const newOrcamento: Orcamento = { ...orcamento, id }
    const updatedOrcamentos = [...existingOrcamentos, newOrcamento]

    localStorage.setItem("orcamentos", JSON.stringify(updatedOrcamentos))
    return { success: true, message: "Orçamento salvo com sucesso!", id }
  } catch (error) {
    return { success: false, message: "Erro ao salvar orçamento." }
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
