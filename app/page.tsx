"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Logo } from "@/components/logo"
import { FileUpload } from "@/components/file-upload"
import {
  saveOrcamento,
  getOrcamentos,
  checkDuplicateOrcamento,
  formatCurrency,
  parseCurrency,
  generatePDFFileName,
  getPastas,
  type Pasta,
} from "@/lib/orcamentos"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle, AlertCircle, Wifi, WifiOff } from "lucide-react"
import { generateOrcamentoPDF } from "@/lib/pdf-generator"
import { storeFiles } from "@/lib/file-storage"
import type { FileWithPreview } from "@/components/file-upload"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

// Adicionar as instruções de uso no topo da página
import { InstrucoesUso } from "@/components/instrucoes-uso"

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

  // Registrar Service Worker para funcionamento offline
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .then((registration) => {
          console.log("SW registrado com sucesso:", registration)
        })
        .catch((error) => {
          console.log("Falha ao registrar SW:", error)
        })
    }
  }, [])

  useEffect(() => {
    const loadedPastas = getPastas()
    setPastas(loadedPastas)
  }, [])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target

    if (name === "valor") {
      // Formatação automática de moeda
      const numericValue = parseCurrency(value)
      const formattedValue = formatCurrency(numericValue)
      setFormData((prev) => ({ ...prev, [name]: formattedValue }))
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }))
    }
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

    const valor = parseCurrency(formData.valor)
    if (isNaN(valor) || valor <= 0) {
      setAlert({ type: "error", message: "Por favor, insira um valor válido." })
      setIsSubmitting(false)
      return
    }

    const dataEnvio = new Date().toISOString().split("T")[0]

    // Verificar duplicatas antes de salvar
    const existingOrcamentos = getOrcamentos()
    const duplicateCheck = checkDuplicateOrcamento(existingOrcamentos, formData.servico, formData.favorecido, dataEnvio)

    if (duplicateCheck.isDuplicate) {
      const existing = duplicateCheck.existingOrcamento!
      setAlert({
        type: "error",
        message: `❌ ORÇAMENTO BLOQUEADO! Já existe um orçamento idêntico (ID: ${existing.id}) criado em ${new Date(existing.dataEnvio).toLocaleDateString("pt-BR")}. Mesmo fornecedor e serviço não podem ser repetidos no mesmo dia.`,
      })
      setIsSubmitting(false)
      return
    }

    const orcamentoData = {
      ...formData,
      pastaId: selectedPastaId,
      valor,
      valorFormatado: formatCurrency(valor),
      anexos: anexos.map((file) => file.name),
      dataEnvio,
      status: "Pendente" as const,
    }

    try {
      // Salvar orçamento primeiro para obter ID
      const result = saveOrcamento(orcamentoData)

      if (result.success && result.id) {
        // Armazenar arquivos anexados
        const storedFiles = await storeFiles(result.id, anexos)

        // Gerar PDF com anexos
        const pdfBlob = await generateOrcamentoPDF(orcamentoData, storedFiles, result.id)

        // Gerar nome do arquivo
        const orcamentoCompleto = { ...orcamentoData, id: result.id }
        const fileName = generatePDFFileName(orcamentoCompleto)

        // Download do PDF
        const url = URL.createObjectURL(pdfBlob)
        const a = document.createElement("a")
        a.href = url
        a.download = fileName
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)

        setAlert({
          type: "success",
          message: `✅ ${result.message} PDF gerado: ${fileName}. ${anexos.length > 0 ? `${anexos.length} arquivo(s) anexado(s).` : ""}`,
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
        setAlert({ type: "error", message: result.message })
      }
    } catch (error) {
      setAlert({ type: "error", message: "Erro ao gerar PDF do orçamento." })
    }

    setIsSubmitting(false)
  }

  return (
    <div className="min-h-screen bg-green-50">
      {/* Header */}
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

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-6 py-12">
        <InstrucoesUso />

        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-green-800 mb-4">Sistema de Orçamentos</h1>
          <p className="text-green-700">Preencha os dados abaixo para enviar um novo orçamento</p>
          <p className="text-sm text-green-600 mt-2">
            💡 Funciona 100% offline - seus dados ficam salvos no dispositivo
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
                placeholder="Ex: R$ 1.500,00"
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
