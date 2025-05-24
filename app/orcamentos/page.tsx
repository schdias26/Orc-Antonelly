"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Eye, Edit, Trash2, Calendar, Filter } from "lucide-react"
import { Logo } from "@/components/logo"
import { getOrcamentos, updateOrcamentoStatus, deleteOrcamento, type Orcamento } from "@/lib/orcamentos"

export default function ListarOrcamentos() {
  const [orcamentos, setOrcamentos] = useState<Orcamento[]>([])
  const [filteredOrcamentos, setFilteredOrcamentos] = useState<Orcamento[]>([])
  const [filters, setFilters] = useState({
    dataInicio: "",
    dataFim: "",
    status: "",
    favorecido: "",
  })

  useEffect(() => {
    loadOrcamentos()
  }, [])

  useEffect(() => {
    applyFilters()
  }, [orcamentos, filters])

  const loadOrcamentos = () => {
    const data = getOrcamentos()
    setOrcamentos(data)
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
    if (confirm("Tem certeza que deseja excluir este orçamento?")) {
      if (deleteOrcamento(id)) {
        loadOrcamentos()
      }
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

  return (
    <div className="min-h-screen bg-green-50">
      <header className="bg-white border-b border-green-200 px-6 py-4">
        <div className="max-w-7xl mx-auto">
          <Logo />
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-12">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-green-800 mb-4">Orçamentos Salvos</h1>
          <p className="text-green-700">Gerencie e filtre todos os orçamentos do sistema</p>
        </div>

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
                  onValueChange={(value) => setFilters((prev) => ({ ...prev, status: value }))}
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
                  R${" "}
                  {filteredOrcamentos
                    .reduce((sum, o) => sum + o.valor, 0)
                    .toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
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
                      <CardTitle className="text-green-800">ID: {orcamento.id}</CardTitle>
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
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-4">
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
                        R$ {orcamento.valor.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-green-800">Telefone</p>
                      <p className="text-gray-600">{orcamento.telefone || "N/A"}</p>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Button size="sm" variant="outline" className="border-green-600 text-green-600 hover:bg-green-50">
                      <Eye className="w-4 h-4 mr-1" />
                      Ver Detalhes
                    </Button>
                    <Button size="sm" variant="outline" className="border-blue-600 text-blue-600 hover:bg-blue-50">
                      <Edit className="w-4 h-4 mr-1" />
                      Editar
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
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </main>
    </div>
  )
}
