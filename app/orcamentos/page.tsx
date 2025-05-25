"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Logo } from "@/components/logo"
import { UserPresence } from "@/components/user-presence"
import { RealtimeOrcamentos } from "@/components/realtime-orcamentos"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { FolderPlus, Folder, Edit, Trash2, FolderOpen } from "lucide-react"
import { dbService } from "@/lib/database-service"
import { realtimeService } from "@/lib/realtime-service"
import type { Pasta } from "@/lib/supabase"

const CORES_DISPONIVEIS = [
  { nome: "Verde", valor: "bg-green-100 text-green-800 border-green-200" },
  { nome: "Azul", valor: "bg-blue-100 text-blue-800 border-blue-200" },
  { nome: "Roxo", valor: "bg-purple-100 text-purple-800 border-purple-200" },
  { nome: "Rosa", valor: "bg-pink-100 text-pink-800 border-pink-200" },
  { nome: "Amarelo", valor: "bg-yellow-100 text-yellow-800 border-yellow-200" },
  { nome: "Laranja", valor: "bg-orange-100 text-orange-800 border-orange-200" },
  { nome: "Vermelho", valor: "bg-red-100 text-red-800 border-red-200" },
  { nome: "Cinza", valor: "bg-gray-100 text-gray-800 border-gray-200" },
]

export default function ListarOrcamentos() {
  const [selectedPastaId, setSelectedPastaId] = useState<string | null>(null)
  const [pastas, setPastas] = useState<Pasta[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingPasta, setEditingPasta] = useState<Pasta | null>(null)
  const [formData, setFormData] = useState({
    nome: "",
    cor: CORES_DISPONIVEIS[0].valor,
    descricao: "",
  })

  useEffect(() => {
    loadPastas()

    // Subscrever mudanças em pastas
    const channel = realtimeService.subscribeToPastas((payload) => {
      console.log("Mudança em pastas:", payload)
      loadPastas()
    })

    return () => {
      realtimeService.unsubscribe("pastas")
    }
  }, [])

  const loadPastas = async () => {
    const data = await dbService.getPastas()
    setPastas(data)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.nome.trim()) {
      alert("Nome da pasta é obrigatório.")
      return
    }

    if (editingPasta) {
      // Atualizar pasta existente
      const success = await dbService.updatePasta(editingPasta.id, formData)
      if (success) {
        resetForm()
        setIsDialogOpen(false)
      } else {
        alert("Erro ao atualizar pasta.")
      }
    } else {
      // Criar nova pasta
      const pasta = await dbService.createPasta(formData)
      if (pasta) {
        resetForm()
        setIsDialogOpen(false)
      } else {
        alert("Erro ao criar pasta.")
      }
    }
  }

  const handleEdit = (pasta: Pasta) => {
    setEditingPasta(pasta)
    setFormData({
      nome: pasta.nome,
      cor: pasta.cor,
      descricao: pasta.descricao || "",
    })
    setIsDialogOpen(true)
  }

  const handleDelete = async (pasta: Pasta) => {
    const orcamentos = await dbService.getOrcamentos(pasta.id)

    if (orcamentos.length > 0) {
      alert(
        `Não é possível excluir a pasta "${pasta.nome}" pois ela contém ${orcamentos.length} orçamento(s). Mova ou exclua os orçamentos primeiro.`,
      )
      return
    }

    if (confirm(`Tem certeza que deseja excluir a pasta "${pasta.nome}"?`)) {
      const success = await dbService.deletePasta(pasta.id)
      if (success && selectedPastaId === pasta.id) {
        setSelectedPastaId(null)
      }
    }
  }

  const resetForm = () => {
    setFormData({
      nome: "",
      cor: CORES_DISPONIVEIS[0].valor,
      descricao: "",
    })
    setEditingPasta(null)
  }

  const handleDialogClose = () => {
    setIsDialogOpen(false)
    resetForm()
  }

  const getDisplayTitle = () => {
    if (selectedPastaId) {
      const pasta = pastas.find((p) => p.id === selectedPastaId)
      return pasta ? `Orçamentos - ${pasta.nome}` : "Orçamentos"
    }
    return "Todos os Orçamentos"
  }

  return (
    <div className="min-h-screen bg-green-50">
      <header className="bg-white border-b border-green-200 px-6 py-4">
        <div className="max-w-7xl mx-auto">
          <Logo />
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-12">
        {/* Presença de usuários */}
        <UserPresence currentPage="/orcamentos" />

        <div className="text-center mb-8 mt-6">
          <h1 className="text-3xl font-bold text-green-800 mb-4">{getDisplayTitle()}</h1>
          <p className="text-green-700">
            {selectedPastaId
              ? "Gerencie os orçamentos desta pasta"
              : "Gerencie e filtre todos os orçamentos do sistema"}
          </p>
          <p className="text-sm text-green-600 mt-2">🔄 Atualizações em tempo real ativas</p>
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
        <Card className="border-green-200 mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-green-800 flex items-center">
                <Folder className="w-5 h-5 mr-2" />
                Organização por Pastas
              </CardTitle>
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-green-600 hover:bg-green-700">
                    <FolderPlus className="w-4 h-4 mr-2" />
                    Nova Pasta
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{editingPasta ? "Editar Pasta" : "Criar Nova Pasta"}</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <Label htmlFor="nome">Nome da Pasta *</Label>
                      <Input
                        id="nome"
                        value={formData.nome}
                        onChange={(e) => setFormData((prev) => ({ ...prev, nome: e.target.value }))}
                        placeholder="Ex: IP4 Barcelos, IP4 Autazes..."
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="cor">Cor da Pasta</Label>
                      <Select
                        value={formData.cor}
                        onValueChange={(value) => setFormData((prev) => ({ ...prev, cor: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {CORES_DISPONIVEIS.map((cor) => (
                            <SelectItem key={cor.valor} value={cor.valor}>
                              <div className="flex items-center">
                                <div className={`w-4 h-4 rounded mr-2 ${cor.valor}`}></div>
                                {cor.nome}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="descricao">Descrição (opcional)</Label>
                      <Textarea
                        id="descricao"
                        value={formData.descricao}
                        onChange={(e) => setFormData((prev) => ({ ...prev, descricao: e.target.value }))}
                        placeholder="Descrição da pasta..."
                        rows={3}
                      />
                    </div>

                    <div className="flex justify-end space-x-2">
                      <Button type="button" variant="outline" onClick={handleDialogClose}>
                        Cancelar
                      </Button>
                      <Button type="submit" className="bg-green-600 hover:bg-green-700">
                        {editingPasta ? "Atualizar" : "Criar"} Pasta
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {/* Pasta "Todos os Orçamentos" */}
              <div
                className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                  selectedPastaId === null
                    ? "bg-green-100 border-green-300 ring-2 ring-green-200"
                    : "bg-gray-50 border-gray-200 hover:bg-gray-100"
                }`}
                onClick={() => setSelectedPastaId(null)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <FolderOpen className="w-5 h-5 mr-3 text-green-600" />
                    <div>
                      <span className="font-medium text-lg">Todos os Orçamentos</span>
                      <p className="text-sm text-gray-500">Visualizar todos os orçamentos do sistema</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge variant="outline" className="bg-green-50 text-green-700 text-lg px-3 py-1">
                      {/* Será atualizado dinamicamente */}
                    </Badge>
                    <p className="text-xs text-gray-500 mt-1">total</p>
                  </div>
                </div>
              </div>

              {/* Pastas criadas */}
              {pastas.map((pasta) => {
                const isSelected = selectedPastaId === pasta.id

                return (
                  <div
                    key={pasta.id}
                    className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                      isSelected
                        ? `${pasta.cor} border-opacity-50 ring-2 ring-opacity-30`
                        : "bg-gray-50 border-gray-200 hover:bg-gray-100"
                    }`}
                    onClick={() => setSelectedPastaId(pasta.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <Folder className="w-5 h-5 mr-3 text-gray-600" />
                        <div>
                          <span className="font-medium text-lg">{pasta.nome}</span>
                          {pasta.descricao && <p className="text-sm text-gray-500 mt-1">{pasta.descricao}</p>}
                          <p className="text-xs text-gray-400 mt-1">
                            Criada em {new Date(pasta.created_at).toLocaleDateString("pt-BR")}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className="text-right">
                          <Badge variant="outline" className="text-lg px-3 py-1">
                            {/* Será atualizado dinamicamente */}
                          </Badge>
                          <p className="text-xs text-gray-500 mt-1">orçamentos</p>
                        </div>
                        <div className="flex flex-col space-y-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleEdit(pasta)
                            }}
                            className="h-8 w-8 p-0"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDelete(pasta)
                            }}
                            className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}

              {pastas.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <Folder className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p className="text-lg font-medium">Nenhuma pasta criada ainda</p>
                  <p className="text-sm">Clique em "Nova Pasta" para começar a organizar seus orçamentos</p>
                  <p className="text-xs mt-2 text-gray-400">
                    Sugestão: Crie pastas para cada IP4 (ex: IP4 Barcelos, IP4 Autazes)
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Lista de Orçamentos em Tempo Real */}
        <RealtimeOrcamentos selectedPastaId={selectedPastaId} />
      </main>
    </div>
  )
}
