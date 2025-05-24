"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Trash2, Calendar, Filter, FileText, Download, Wifi, WifiOff } from "lucide-react"
import { Logo } from "@/components/logo"
import { AnexosDisplay } from "@/components/anexos-display"
import {
  getOrcamentos,
  updateOrcamentoStatus,
  deleteOrcamento,
  generatePDFFileName,
  type Orcamento,
  getOrcamentosByPasta,
  moveOrcamentoToPasta,
  getPastas,
  type Pasta,
} from "@/lib/orcamentos"
import { generateOrcamentoPDF, downloadPDF } from "@/lib/pdf-generator"
import { getStoredFiles, deleteStoredFiles } from "@/lib/file-storage"
import { PastaManager } from "@/components/pasta-manager"
// Adicionar as instruções de uso e melhorar a navegação
import { InstrucoesUso } from "@/components/instrucoes-uso"

export default function ListarOrcamentos() {
  const [orcamentos, setOrcamentos] = useState<Orcamento[]>([])
  const [filteredOrcamentos, setFilteredOrcamentos] = useState<Orcamento[]>([])
  const [filters, setFilters] = useState({
    dataInicio: "",
    dataFim: "",
    status: "",
    favorecido: "",
  })
  const [loadingPdf, setLoadingPdf] = useState<string | null>(null)
  const [isOnline, setIsOnline] = useState(true)
  const [selectedPastaId, setSelectedPastaId] = useState<string | null>(null)
  const [pastas, setPastas] = useState<Pasta[]>([])

  // Monitorar status de conexão
  useEffect(() => {
    const updateOnlineStatus = () => {
      setIsOnline(navigator.onLine)
    }

    window.addEventListener("online", updateOnlineStatus)
    window.addEventListener("offline", updateOnlineStatus)

    return () => {
      window.removeEventListener("online", updateOnlineStatus)
      window.removeEventListener("offline", updateOnlineStatus)
    }
  }, [])

  useEffect(() => {
    loadOrcamentos()
    const loadedPastas = getPastas()
    setPastas(loadedPastas)
  }, [selectedPastaId])

  useEffect(() => {
    applyFilters()
  }, [orcamentos, filters])

  // Atualizar para mostrar melhor as estatísticas por pasta
  const loadOrcamentos = () => {
    const data = selectedPastaId ? getOrcamentosByPasta(selectedPastaId) : getOrcamentos()
    setOrcamentos(data)
  }

  // Adicionar função para obter título da exibição
  const getDisplayTitle = () => {
    if (selectedPastaId) {
      const pasta = pastas.find((p) => p.id === selectedPastaId)
      return pasta ? `Orçamentos - ${pasta.nome}` : "Orçamentos"
    }
    return "Todos os Orçamentos"
  }

  const applyFilters = () => {
    let filtered = [...orcamentos]

    if (filters.dataInicio) {
      filtered = filtered.filter((orc) => orc.dataEnvio >= filters.dataInicio)
    }

    if (filters.dataFim) {
      filtered = filtered.filter((orc) => orc.dataEnvio <= filters.dataFim)
    }

    if (filters.status) {
      filtered = filtered.filter((orc) => orc.status === filters.status)
    }

    if (filters.favorecido) {
      filtered = filtered.filter((orc) => orc.favorecido.toLowerCase().includes(filters.favorecido.toLowerCase()))
    }

    setFilteredOrcamentos(filtered)
  }

  const handleStatusChange = (id: string, newStatus: Orcamento["status"]) => {
    if (updateOrcamentoStatus(id, newStatus)) {
      loadOrcamentos()
    }
  }

  const handleDelete = (id: string) => {
    if (confirm("Tem certeza que deseja excluir este orçamento? Esta ação não pode ser desfeita.")) {
      if (deleteOrcamento(id)) {
        // Deletar também os arquivos anexados
        deleteStoredFiles(id)
        loadOrcamentos()
      }
    }
  }

  const handleDownloadPDF = async (orcamento: Orcamento) => {
    setLoadingPdf(orcamento.id)

    try {
      // Buscar arquivos anexados
      const storedFiles = getStoredFiles(orcamento.id)

      // Regenerar PDF com anexos
      const pdfBlob = await generateOrcamentoPDF(
        {
          ip4: orcamento.ip4,
          solicitante: orcamento.solicitante,
          servico: orcamento.servico,
          favorecido: orcamento.favorecido,
          telefone: orcamento.telefone,
          cpfCnpj: orcamento.cpfCnpj,
          banco: orcamento.banco,
          agencia: orcamento.agencia,
          conta: orcamento.conta,
          pix: orcamento.pix,
          valor: orcamento.valor,
          valorFormatado: orcamento.valorFormatado,
          anexos: orcamento.anexos,
          dataEnvio: orcamento.dataEnvio,
        },
        storedFiles,
        orcamento.id,
      )

      const fileName = generatePDFFileName(orcamento)
      downloadPDF(pdfBlob, fileName)
    } catch (error) {
      console.error("Erro ao gerar PDF:", error)
      alert("Erro ao gerar PDF. Tente novamente.")
    } finally {
      setLoadingPdf(null)
    }
  }

  const clearFilters = () => {
    setFilters({
      dataInicio: "",
      dataFim: "",
      status: "",
      favorecido: "",
    })
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

  const handleMoveToPasta = (orcamentoId: string, novaPastaId: string | null) => {
    if (moveOrcamentoToPasta(orcamentoId, novaPastaId)) {
      loadOrcamentos()
    }
  }

  return (
    <div className="min-h-screen bg-green-50">
      <header className="bg-white border-b border-green-200 px-6 py-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <Logo />
            <div className="flex items-center space-x-2">
              {isOnline ? (
                <div className="flex items-center text-green-600">
                  <Wifi className="w-4 h-4 mr-1" />
                  <span className="text-sm">Online</span>
                </div>
              ) : (
                <div className="flex items-center text-orange-600">
                  <WifiOff className="w-4 h-4 mr-1" />
                  <span className="text-sm">Offline</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* No JSX, atualizar a seção principal */}
      <main className="max-w-7xl mx-auto px-6 py-12">
        <InstrucoesUso />

        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-green-800 mb-4">{getDisplayTitle()}</h1>
          <p className="text-green-700">
            {selectedPastaId
              ? "Gerencie os orçamentos desta pasta"
              : "Gerencie e filtre todos os orçamentos do sistema"}
          </p>
          <p className="text-sm text-green-600 mt-2">📱 Funciona 100% offline - dados salvos localmente</p>
          {selectedPastaId && (
            <Button
              onClick={() => setSelectedPastaId(null)}
              variant="outline"
              className="mt-2 border-green-600 text-green-600"
            >
              ← Voltar para todos os orçamentos
            </Button>
          )}
        </div>

        {/* Gerenciador de Pastas */}
        <PastaManager onPastaSelect={setSelectedPastaId} selectedPastaId={selectedPastaId} />

        {/* Filtros */}
        <Card className="mb-8 border-green-200">
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
            <div className="flex justify-end mt-4">
              <Button onClick={clearFilters} variant="outline" className="border-green-600 text-green-600">
                Limpar Filtros
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
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
                    .reduce((sum, o) => sum + o.valor, 0)
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
                      <CardTitle className="text-green-800 text-sm">ID: {orcamento.id}</CardTitle>
                      <p className="text-sm text-gray-500 flex items-center mt-1">
                        <Calendar className="w-4 h-4 mr-1" />
                        {new Date(orcamento.dataEnvio).toLocaleDateString("pt-BR")}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
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
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
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
                        {orcamento.valorFormatado ||
                          orcamento.valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                      </p>
                    </div>
                  </div>

                  {/* Seção de Anexos */}
                  <div className="mb-4">
                    <AnexosDisplay orcamentoId={orcamento.id} />
                  </div>

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

                  <div className="mt-2">
                    <Label className="text-sm text-green-800">Mover para pasta:</Label>
                    <Select
                      value={orcamento.pastaId || "sem-pasta"}
                      onValueChange={(value) => handleMoveToPasta(orcamento.id, value === "sem-pasta" ? null : value)}
                    >
                      <SelectTrigger className="w-full mt-1">
                        <SelectValue placeholder="Selecione uma pasta" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="sem-pasta">Sem pasta</SelectItem>
                        {pastas.map((pasta) => (
                          <SelectItem key={pasta.id} value={pasta.id}>
                            {pasta.nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </main>
    </div>
  )
}
