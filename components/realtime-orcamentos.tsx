"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Trash2, Calendar, Filter, FileText, Download, Edit, Save, X } from "lucide-react"
import { dbService } from "@/lib/database-service"
import { realtimeService } from "@/lib/realtime-service"
import { generateOrcamentoPDF, downloadPDF } from "@/lib/pdf-generator"
import type { Orcamento } from "@/lib/supabase"

interface RealtimeOrcamentosProps {
  selectedPastaId?: string | null
}

export function RealtimeOrcamentos({ selectedPastaId }: RealtimeOrcamentosProps) {
  const [orcamentos, setOrcamentos] = useState<Orcamento[]>([])
  const [filteredOrcamentos, setFilteredOrcamentos] = useState<Orcamento[]>([])
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingData, setEditingData] = useState<Partial<Orcamento>>({})
  const [filters, setFilters] = useState({
    dataInicio: "",
    dataFim: "",
    status: "",
    favorecido: "",
  })
  const [loadingPdf, setLoadingPdf] = useState<string | null>(null)

  // Carregar orçamentos
  const loadOrcamentos = async () => {
    const data = await dbService.getOrcamentos(selectedPastaId || undefined)
    setOrcamentos(data)
  }

  useEffect(() => {
    loadOrcamentos()

    // Subscrever mudanças em tempo real
    const channel = realtimeService.subscribeToOrcamentos((payload) => {
      console.log("Mudança em orçamentos:", payload)

      if (payload.eventType === "INSERT") {
        setOrcamentos((prev) => [payload.new, ...prev])
      } else if (payload.eventType === "UPDATE") {
        setOrcamentos((prev) => prev.map((orc) => (orc.id === payload.new.id ? payload.new : orc)))
      } else if (payload.eventType === "DELETE") {
        setOrcamentos((prev) => prev.filter((orc) => orc.id !== payload.old.id))
      }
    })

    return () => {
      realtimeService.unsubscribe("orcamentos")
    }
  }, [selectedPastaId])

  // Aplicar filtros
  useEffect(() => {
    let filtered = [...orcamentos]

    if (filters.dataInicio) {
      filtered = filtered.filter((orc) => orc.created_at >= filters.dataInicio)
    }

    if (filters.dataFim) {
      filtered = filtered.filter((orc) => orc.created_at <= filters.dataFim)
    }

    if (filters.status) {
      filtered = filtered.filter((orc) => orc.status === filters.status)
    }

    if (filters.favorecido) {
      filtered = filtered.filter((orc) => orc.favorecido.toLowerCase().includes(filters.favorecido.toLowerCase()))
    }

    setFilteredOrcamentos(filtered)
  }, [orcamentos, filters])

  // Iniciar edição
  const startEditing = (orcamento: Orcamento) => {
    setEditingId(orcamento.id)
    setEditingData(orcamento)
    realtimeService.updateUserActivity(undefined, orcamento.id)
  }

  // Cancelar edição
  const cancelEditing = () => {
    setEditingId(null)
    setEditingData({})
    realtimeService.updateUserActivity(undefined, undefined)
  }

  // Salvar edição
  const saveEditing = async () => {
    if (!editingId || !editingData) return

    const success = await dbService.updateOrcamento(editingId, editingData)
    if (success) {
      setEditingId(null)
      setEditingData({})
      realtimeService.updateUserActivity(undefined, undefined)
    }
  }

  // Deletar orçamento
  const handleDelete = async (id: string) => {
    if (confirm("Tem certeza que deseja excluir este orçamento? Esta ação não pode ser desfeita.")) {
      await dbService.deleteOrcamento(id)
      await dbService.deleteArquivos(id)
    }
  }

  // Atualizar status
  const handleStatusChange = async (id: string, newStatus: Orcamento["status"]) => {
    await dbService.updateOrcamento(id, { status: newStatus })
  }

  // Gerar PDF
  const handleDownloadPDF = async (orcamento: Orcamento) => {
    setLoadingPdf(orcamento.id)

    try {
      const arquivos = await dbService.getArquivos(orcamento.id)
      const storedFiles = arquivos.map((arquivo) => ({
        name: arquivo.nome,
        type: arquivo.tipo,
        size: arquivo.tamanho,
        data: arquivo.dados,
        preview: arquivo.preview,
      }))

      const pdfBlob = await generateOrcamentoPDF(
        {
          ip4: orcamento.ip4 || "",
          solicitante: orcamento.solicitante || "",
          servico: orcamento.servico,
          favorecido: orcamento.favorecido,
          telefone: orcamento.telefone || "",
          cpfCnpj: orcamento.cpf_cnpj || "",
          banco: orcamento.banco || "",
          agencia: orcamento.agencia || "",
          conta: orcamento.conta || "",
          pix: orcamento.pix || "",
          valor: Number(orcamento.valor),
          valorFormatado: orcamento.valor_formatado || "",
          anexos: orcamento.anexos,
          dataEnvio: orcamento.created_at,
        },
        storedFiles,
        orcamento.id,
      )

      const fileName = `orcamento-${orcamento.favorecido}-${new Date(orcamento.created_at).toLocaleDateString("pt-BR").replace(/\//g, "-")}.pdf`
      downloadPDF(pdfBlob, fileName)
    } catch (error) {
      console.error("Erro ao gerar PDF:", error)
      alert("Erro ao gerar PDF. Tente novamente.")
    } finally {
      setLoadingPdf(null)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Aprovado":
        return "bg-green-100 text-green-800"
      case "Rejeitado":
        return "bg-red-100 text-red-800"
      case "Em análise":
        return "bg-blue-100 text-blue-800"
      default:
        return "bg-yellow-100 text-yellow-800"
    }
  }

  return (
    <div className="space-y-6">
      {/* Filtros */}
      <Card className="border-green-200">
        <CardHeader>
          <CardTitle className="text-green-800 flex items-center">
            <Filter className="w-5 h-5 mr-2" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="dataInicio" className="text-green-800">
                Data Início
              </Label>
              <Input
                id="dataInicio"
                type="date"
                value={filters.dataInicio}
                onChange={(e) => setFilters((prev) => ({ ...prev, dataInicio: e.target.value }))}
                className="border-green-200 focus:border-green-500"
              />
            </div>
            <div>
              <Label htmlFor="dataFim" className="text-green-800">
                Data Fim
              </Label>
              <Input
                id="dataFim"
                type="date"
                value={filters.dataFim}
                onChange={(e) => setFilters((prev) => ({ ...prev, dataFim: e.target.value }))}
                className="border-green-200 focus:border-green-500"
              />
            </div>
            <div>
              <Label htmlFor="status" className="text-green-800">
                Status
              </Label>
              <Select
                value={filters.status}
                onValueChange={(value) => setFilters((prev) => ({ ...prev, status: value === "todos" ? "" : value }))}
              >
                <SelectTrigger className="border-green-200 focus:border-green-500">
                  <SelectValue placeholder="Todos os status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os status</SelectItem>
                  <SelectItem value="Pendente">Pendente</SelectItem>
                  <SelectItem value="Em análise">Em análise</SelectItem>
                  <SelectItem value="Aprovado">Aprovado</SelectItem>
                  <SelectItem value="Rejeitado">Rejeitado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="favorecido" className="text-green-800">
                Favorecido
              </Label>
              <Input
                id="favorecido"
                placeholder="Buscar por favorecido"
                value={filters.favorecido}
                onChange={(e) => setFilters((prev) => ({ ...prev, favorecido: e.target.value }))}
                className="border-green-200 focus:border-green-500"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-green-200">
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-green-800">{filteredOrcamentos.length}</p>
              <p className="text-sm text-green-600">Total de Orçamentos</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-green-200">
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-yellow-600">
                {filteredOrcamentos.filter((o) => o.status === "Pendente").length}
              </p>
              <p className="text-sm text-green-600">Pendentes</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-green-200">
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">
                {filteredOrcamentos.filter((o) => o.status === "Aprovado").length}
              </p>
              <p className="text-sm text-green-600">Aprovados</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-green-200">
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-green-800">
                {filteredOrcamentos
                  .reduce((sum, o) => sum + Number(o.valor), 0)
                  .toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
              </p>
              <p className="text-sm text-green-600">Valor Total</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Orçamentos */}
      <div className="grid gap-6">
        {filteredOrcamentos.length === 0 ? (
          <Card className="border-green-200">
            <CardContent className="p-8 text-center">
              <p className="text-green-600">Nenhum orçamento encontrado com os filtros aplicados.</p>
            </CardContent>
          </Card>
        ) : (
          filteredOrcamentos.map((orcamento) => (
            <Card key={orcamento.id} className="border-green-200">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-green-800 text-sm">ID: {orcamento.id.slice(0, 8)}...</CardTitle>
                    <p className="text-sm text-gray-500 flex items-center mt-1">
                      <Calendar className="w-4 h-4 mr-1" />
                      {new Date(orcamento.created_at).toLocaleDateString("pt-BR")}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    {editingId === orcamento.id ? (
                      <>
                        <Button size="sm" onClick={saveEditing} className="bg-green-600 text-white">
                          <Save className="w-4 h-4 mr-1" />
                          Salvar
                        </Button>
                        <Button size="sm" variant="outline" onClick={cancelEditing}>
                          <X className="w-4 h-4 mr-1" />
                          Cancelar
                        </Button>
                      </>
                    ) : (
                      <>
                        <Select
                          value={orcamento.status}
                          onValueChange={(value) => handleStatusChange(orcamento.id, value as Orcamento["status"])}
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Pendente">Pendente</SelectItem>
                            <SelectItem value="Em análise">Em análise</SelectItem>
                            <SelectItem value="Aprovado">Aprovado</SelectItem>
                            <SelectItem value="Rejeitado">Rejeitado</SelectItem>
                          </SelectContent>
                        </Select>
                        <Badge className={getStatusColor(orcamento.status)}>{orcamento.status}</Badge>
                        <Button size="sm" variant="outline" onClick={() => startEditing(orcamento)}>
                          <Edit className="w-4 h-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {editingId === orcamento.id ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Favorecido</Label>
                      <Input
                        value={editingData.favorecido || ""}
                        onChange={(e) => setEditingData((prev) => ({ ...prev, favorecido: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label>Solicitante</Label>
                      <Input
                        value={editingData.solicitante || ""}
                        onChange={(e) => setEditingData((prev) => ({ ...prev, solicitante: e.target.value }))}
                      />
                    </div>
                    <div className="md:col-span-2">
                      <Label>Serviço</Label>
                      <Input
                        value={editingData.servico || ""}
                        onChange={(e) => setEditingData((prev) => ({ ...prev, servico: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label>Valor</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={editingData.valor || ""}
                        onChange={(e) => setEditingData((prev) => ({ ...prev, valor: Number(e.target.value) }))}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                    <div>
                      <p className="text-sm font-medium text-green-800">Solicitante</p>
                      <p className="text-gray-600">{orcamento.solicitante || "N/A"}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-green-800">Favorecido</p>
                      <p className="text-gray-600">{orcamento.favorecido}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-green-800">Serviço</p>
                      <p className="text-gray-600 truncate" title={orcamento.servico}>
                        {orcamento.servico}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-green-800">Valor</p>
                      <p className="text-gray-600 font-semibold">
                        {Number(orcamento.valor).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                      </p>
                    </div>
                  </div>
                )}

                {editingId !== orcamento.id && (
                  <div className="flex space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-green-600 text-green-600 hover:bg-green-50"
                      onClick={() => handleDownloadPDF(orcamento)}
                      disabled={loadingPdf === orcamento.id}
                    >
                      {loadingPdf === orcamento.id ? (
                        <>
                          <Download className="w-4 h-4 mr-1 animate-spin" />
                          Gerando...
                        </>
                      ) : (
                        <>
                          <FileText className="w-4 h-4 mr-1" />
                          Baixar PDF
                        </>
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-red-600 text-red-600 hover:bg-red-50"
                      onClick={() => handleDelete(orcamento.id)}
                    >
                      <Trash2 className="w-4 h-4 mr-1" />
                      Excluir
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
