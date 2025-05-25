"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Logo } from "@/components/logo"
import { FileUpload } from "@/components/file-upload"
import { UserPresence } from "@/components/user-presence"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle, AlertCircle } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { dbService } from "@/lib/database-service"
import { realtimeService } from "@/lib/realtime-service"
import { generateOrcamentoPDF, downloadPDF } from "@/lib/pdf-generator"
import type { FileWithPreview } from "@/components/file-upload"
import type { Pasta } from "@/lib/supabase"

export default function QuoteSystem() {
  const [formData, setFormData] = useState({
    ip4: "",
    solicitante: "",
    servico: "",
    favorecido: "",
    telefone: "",
    cpfCnpj: "",
    banco: "",
    agencia: "",
    conta: "",
    pix: "",
    valor: "",
  })

  const [alert, setAlert] = useState<{ type: "success" | "error"; message: string } | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [anexos, setAnexos] = useState<FileWithPreview[]>([])
  const [selectedPastaId, setSelectedPastaId] = useState<string | null>(null)
  const [pastas, setPastas] = useState<Pasta[]>([])

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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setAlert(null)

    // Validação básica
    if (!formData.servico || !formData.favorecido || !formData.valor) {
      setAlert({ type: "error", message: "Por favor, preencha pelo menos os campos: Serviço, Favorecido e Valor." })
      setIsSubmitting(false)
      return
    }

    const valor = Number.parseFloat(formData.valor.replace(/[^\d,]/g, "").replace(",", "."))
    if (isNaN(valor) || valor <= 0) {
      setAlert({ type: "error", message: "Por favor, insira um valor válido." })
      setIsSubmitting(false)
      return
    }

    try {
      // Criar orçamento no banco
      const orcamentoData = {
        pasta_id: selectedPastaId,
        ip4: formData.ip4,
        solicitante: formData.solicitante,
        servico: formData.servico,
        favorecido: formData.favorecido,
        telefone: formData.telefone,
        cpf_cnpj: formData.cpfCnpj,
        banco: formData.banco,
        agencia: formData.agencia,
        conta: formData.conta,
        pix: formData.pix,
        valor,
        valor_formatado: valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }),
        anexos: anexos.map((file) => file.name),
        status: "Pendente" as const,
      }

      const orcamento = await dbService.createOrcamento(orcamentoData)

      if (orcamento) {
        // Salvar arquivos anexados
        for (const file of anexos) {
          const dados = await fileToBase64(file)
          await dbService.createArquivo({
            orcamento_id: orcamento.id,
            nome: file.name,
            tipo: file.type,
            tamanho: file.size,
            dados,
            preview: file.type.startsWith("image/") ? dados : undefined,
          })
        }

        // Gerar PDF
        const arquivos = await dbService.getArquivos(orcamento.id)
        const storedFiles = arquivos.map((arquivo) => ({
          name: arquivo.nome,
          type: arquivo.tipo,
          size: arquivo.tamanho,
          data: arquivo.dados,
          preview: arquivo.preview,
        }))

        const pdfBlob = await generateOrcamentoPDF(orcamentoData, storedFiles, orcamento.id)
        const fileName = `orcamento-${orcamento.favorecido}-${new Date().toLocaleDateString("pt-BR").replace(/\//g, "-")}.pdf`
        downloadPDF(pdfBlob, fileName)

        setAlert({
          type: "success",
          message: `✅ Orçamento criado com sucesso! PDF gerado: ${fileName}. ${anexos.length > 0 ? `${anexos.length} arquivo(s) anexado(s).` : ""}`,
        })

        // Limpar formulário
        setFormData({
          ip4: "",
          solicitante: "",
          servico: "",
          favorecido: "",
          telefone: "",
          cpfCnpj: "",
          banco: "",
          agencia: "",
          conta: "",
          pix: "",
          valor: "",
        })
        setAnexos([])
      } else {
        setAlert({ type: "error", message: "Erro ao criar orçamento." })
      }
    } catch (error) {
      console.error("Erro ao criar orçamento:", error)
      setAlert({ type: "error", message: "Erro ao criar orçamento." })
    }

    setIsSubmitting(false)
  }

  return (
    <div className="min-h-screen bg-green-50">
      {/* Header */}
      <header className="bg-white border-b border-green-200 px-6 py-4">
        <div className="max-w-7xl mx-auto">
          <Logo />
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-6 py-12">
        {/* Presença de usuários */}
        <UserPresence currentPage="/" />

        <div className="text-center mb-12 mt-6">
          <h1 className="text-3xl font-bold text-green-800 mb-4">Sistema de Orçamentos Colaborativo</h1>
          <p className="text-green-700">Preencha os dados abaixo para criar um novo orçamento</p>
          <p className="text-sm text-green-600 mt-2">
            🔄 Sistema em tempo real - todas as alterações são sincronizadas automaticamente
          </p>
        </div>

        {alert && (
          <Alert
            className={`mb-6 ${alert.type === "success" ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}`}
          >
            {alert.type === "success" ? (
              <CheckCircle className="h-4 w-4 text-green-600" />
            ) : (
              <AlertCircle className="h-4 w-4 text-red-600" />
            )}
            <AlertDescription className={alert.type === "success" ? "text-green-800" : "text-red-800"}>
              {alert.message}
            </AlertDescription>
          </Alert>
        )}

        <div className="bg-white rounded-lg shadow-sm border border-green-200 p-8">
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-green-800 mb-2">Dados para Pagamento</h2>
            <p className="text-green-600 text-sm">Preencha todos os campos necessários para o orçamento</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label htmlFor="ip4" className="text-green-800 font-medium">
                IP4
              </Label>
              <Input
                id="ip4"
                name="ip4"
                value={formData.ip4}
                onChange={handleInputChange}
                placeholder="Ex: IP4 Barcelos"
                className="mt-1 border-green-200 focus:border-green-500 focus:ring-green-500"
              />
            </div>

            <div>
              <Label htmlFor="pasta" className="text-green-800 font-medium">
                Pasta (Organização)
              </Label>
              <Select
                value={selectedPastaId || "sem-pasta"}
                onValueChange={(value) => setSelectedPastaId(value === "sem-pasta" ? null : value)}
              >
                <SelectTrigger className="mt-1 border-green-200 focus:border-green-500 focus:ring-green-500">
                  <SelectValue placeholder="Selecione uma pasta (opcional)" />
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

            <div>
              <Label htmlFor="solicitante" className="text-green-800 font-medium">
                Solicitante
              </Label>
              <Input
                id="solicitante"
                name="solicitante"
                value={formData.solicitante}
                onChange={handleInputChange}
                placeholder="Ex: Nome do solicitante"
                className="mt-1 border-green-200 focus:border-green-500 focus:ring-green-500"
              />
            </div>

            <div>
              <Label htmlFor="servico" className="text-green-800 font-medium">
                Serviço *
              </Label>
              <Textarea
                id="servico"
                name="servico"
                value={formData.servico}
                onChange={handleInputChange}
                placeholder="Ex: Impressão dos termos de confidencialidade e Cessão de Imagem. (Para 9 funcionários)"
                rows={3}
                className="mt-1 border-green-200 focus:border-green-500 focus:ring-green-500"
                required
              />
            </div>

            <div>
              <Label htmlFor="favorecido" className="text-green-800 font-medium">
                Favorecido *
              </Label>
              <Input
                id="favorecido"
                name="favorecido"
                value={formData.favorecido}
                onChange={handleInputChange}
                placeholder="Ex: Nome do favorecido"
                className="mt-1 border-green-200 focus:border-green-500 focus:ring-green-500"
                required
              />
            </div>

            <div>
              <Label htmlFor="telefone" className="text-green-800 font-medium">
                Telefone
              </Label>
              <Input
                id="telefone"
                name="telefone"
                value={formData.telefone}
                onChange={handleInputChange}
                placeholder="Ex: (97) 98426-8411"
                className="mt-1 border-green-200 focus:border-green-500 focus:ring-green-500"
              />
            </div>

            <div>
              <Label htmlFor="cpfCnpj" className="text-green-800 font-medium">
                CPF/CNPJ
              </Label>
              <Input
                id="cpfCnpj"
                name="cpfCnpj"
                value={formData.cpfCnpj}
                onChange={handleInputChange}
                placeholder="Ex: 01555095275 ou 12345678000199"
                className="mt-1 border-green-200 focus:border-green-500 focus:ring-green-500"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="banco" className="text-green-800 font-medium">
                  Banco
                </Label>
                <Input
                  id="banco"
                  name="banco"
                  value={formData.banco}
                  onChange={handleInputChange}
                  placeholder="Ex: Banco do Brasil"
                  className="mt-1 border-green-200 focus:border-green-500 focus:ring-green-500"
                />
              </div>
              <div>
                <Label htmlFor="agencia" className="text-green-800 font-medium">
                  Agência
                </Label>
                <Input
                  id="agencia"
                  name="agencia"
                  value={formData.agencia}
                  onChange={handleInputChange}
                  placeholder="Ex: 1234"
                  className="mt-1 border-green-200 focus:border-green-500 focus:ring-green-500"
                />
              </div>
              <div>
                <Label htmlFor="conta" className="text-green-800 font-medium">
                  Conta
                </Label>
                <Input
                  id="conta"
                  name="conta"
                  value={formData.conta}
                  onChange={handleInputChange}
                  placeholder="Ex: 12345-6"
                  className="mt-1 border-green-200 focus:border-green-500 focus:ring-green-500"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="pix" className="text-green-800 font-medium">
                PIX
              </Label>
              <Input
                id="pix"
                name="pix"
                value={formData.pix}
                onChange={handleInputChange}
                placeholder="Ex: chave@pix.com"
                className="mt-1 border-green-200 focus:border-green-500 focus:ring-green-500"
              />
            </div>

            <div>
              <Label htmlFor="valor" className="text-green-800 font-medium">
                Valor *
              </Label>
              <Input
                id="valor"
                name="valor"
                value={formData.valor}
                onChange={handleInputChange}
                placeholder="Ex: 1500.00"
                className="mt-1 border-green-200 focus:border-green-500 focus:ring-green-500"
                required
              />
            </div>

            <FileUpload onFilesChange={setAnexos} />

            <div className="flex justify-end space-x-4 pt-6">
              <Button type="button" variant="outline" className="border-green-600 text-green-600 hover:bg-green-50">
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting} className="bg-green-600 hover:bg-green-700 text-white">
                {isSubmitting ? "Salvando..." : "Salvar Orçamento"}
              </Button>
            </div>
          </form>
        </div>
      </main>
    </div>
  )
}
