"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar, ArrowLeft, FileText, Download } from "lucide-react"
import { Logo } from "@/components/logo"
import { AnexosDisplay } from "@/components/anexos-display"
import { getOrcamentos, generatePDFFileName, type Orcamento } from "@/lib/orcamentos"
import { generateOrcamentoPDF, downloadPDF } from "@/lib/pdf-generator"
import { getStoredFiles } from "@/lib/file-storage"
import Link from "next/link"

export default function VisualizarOrcamento() {
  const params = useParams()
  const [orcamento, setOrcamento] = useState<Orcamento | null>(null)
  const [loadingPdf, setLoadingPdf] = useState(false)

  useEffect(() => {
    if (params.id) {
      const orcamentos = getOrcamentos()
      const found = orcamentos.find((orc) => orc.id === params.id)
      setOrcamento(found || null)
    }
  }, [params.id])

  const handleDownloadPDF = async () => {
    if (!orcamento) return

    setLoadingPdf(true)

    try {
      const storedFiles = getStoredFiles(orcamento.id)

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
      setLoadingPdf(false)
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

  if (!orcamento) {
    return (
      <div className="min-h-screen bg-green-50">
        <header className="bg-white border-b border-green-200 px-6 py-4">
          <div className="max-w-7xl mx-auto">
            <Logo />
          </div>
        </header>
        <main className="max-w-4xl mx-auto px-6 py-12">
          <Card className="border-red-200">
            <CardContent className="p-8 text-center">
              <h1 className="text-2xl font-bold text-red-600 mb-4">Orçamento não encontrado</h1>
              <p className="text-gray-600 mb-6">O orçamento solicitado não existe ou foi removido.</p>
              <Link href="/">
                <Button className="bg-green-600 hover:bg-green-700">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Voltar ao início
                </Button>
              </Link>
            </CardContent>
          </Card>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-green-50">
      <header className="bg-white border-b border-green-200 px-6 py-4">
        <div className="max-w-7xl mx-auto">
          <Logo />
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-12">
        <div className="mb-6">
          <Link href="/orcamentos">
            <Button variant="outline" className="border-green-600 text-green-600 hover:bg-green-50">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar aos orçamentos
            </Button>
          </Link>
        </div>

        <Card className="border-green-200">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-green-800">Orçamento: {orcamento.id}</CardTitle>
                <p className="text-sm text-gray-500 flex items-center mt-1">
                  <Calendar className="w-4 h-4 mr-1" />
                  {new Date(orcamento.dataEnvio).toLocaleDateString("pt-BR")}
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <Badge className={getStatusColor(orcamento.status)}>{orcamento.status}</Badge>
                <Button onClick={handleDownloadPDF} disabled={loadingPdf} className="bg-green-600 hover:bg-green-700">
                  {loadingPdf ? (
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
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <h3 className="text-lg font-semibold text-green-800 mb-4">Dados do Cliente</h3>
                <div className="space-y-2">
                  <div>
                    <span className="text-sm font-medium text-gray-600">Solicitante:</span>
                    <p className="text-gray-800">{orcamento.solicitante || "N/A"}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-600">Favorecido:</span>
                    <p className="text-gray-800">{orcamento.favorecido}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-600">Telefone:</span>
                    <p className="text-gray-800">{orcamento.telefone || "N/A"}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-600">CPF/CNPJ:</span>
                    <p className="text-gray-800">{orcamento.cpfCnpj || "N/A"}</p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-green-800 mb-4">Dados Bancários</h3>
                <div className="space-y-2">
                  <div>
                    <span className="text-sm font-medium text-gray-600">Banco:</span>
                    <p className="text-gray-800">{orcamento.banco || "N/A"}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-600">Agência:</span>
                    <p className="text-gray-800">{orcamento.agencia || "N/A"}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-600">Conta:</span>
                    <p className="text-gray-800">{orcamento.conta || "N/A"}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-600">PIX:</span>
                    <p className="text-gray-800">{orcamento.pix || "N/A"}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mb-6">
              <h3 className="text-lg font-semibold text-green-800 mb-2">Serviço</h3>
              <p className="text-gray-800 bg-gray-50 p-3 rounded-lg">{orcamento.servico}</p>
            </div>

            <div className="mb-6">
              <h3 className="text-lg font-semibold text-green-800 mb-2">Valor</h3>
              <p className="text-2xl font-bold text-green-600">
                {orcamento.valorFormatado ||
                  orcamento.valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-green-800 mb-4">Anexos</h3>
              <AnexosDisplay orcamentoId={orcamento.id} />
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
