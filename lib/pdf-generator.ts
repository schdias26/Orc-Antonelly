import jsPDF from "jspdf"
import "jspdf-autotable"
import type { Orcamento } from "./orcamentos"
import type { StoredFile } from "./file-storage"

export async function generateOrcamentoPDF(
  orcamento: Omit<Orcamento, "id" | "status">,
  anexos: StoredFile[] = [],
  orcamentoId?: string,
): Promise<Blob> {
  const pdf = new jsPDF()

  try {
    // Configurar fundo verde claro
    pdf.setFillColor(240, 253, 244)
    pdf.rect(0, 0, pdf.internal.pageSize.width, pdf.internal.pageSize.height, "F")

    // Header com fundo verde
    pdf.setFillColor(34, 197, 94)
    pdf.rect(0, 0, pdf.internal.pageSize.width, 35, "F")

    // Título principal
    pdf.setTextColor(255, 255, 255)
    pdf.setFontSize(18)
    pdf.setFont("helvetica", "bold")
    pdf.text("ANTONELLY CONSTRUÇÕES E SERVIÇOS", 20, 15)

    // Título simplificado
    pdf.setFontSize(14)
    pdf.text("ORÇAMENTO", 20, 25)

    // Resetar cor do texto
    pdf.setTextColor(0, 0, 0)

    // Informações do documento
    pdf.setFontSize(10)
    pdf.setFont("helvetica", "normal")
    const dataAtual = new Date()
    const dataFormatadaHora = dataAtual.toLocaleTimeString("pt-BR")
    const dataFormatada = dataAtual.toLocaleDateString("pt-BR")
    pdf.text(`Documento gerado em: ${dataFormatada} às ${dataFormatadaHora}`, 20, 45)

    // ID do orçamento
    if (orcamentoId) {
      pdf.setFontSize(12)
      pdf.setFont("helvetica", "bold")
      pdf.setTextColor(34, 197, 94)
      pdf.text(`ID: ${orcamentoId}`, 20, 55)
      pdf.setTextColor(0, 0, 0)
    }

    let yPosition = 70

    // Título da seção de dados
    pdf.setFontSize(14)
    pdf.setFont("helvetica", "bold")
    pdf.setTextColor(34, 197, 94)
    pdf.text("DADOS DO ORÇAMENTO", 20, yPosition)
    yPosition += 10

    // Resetar cor
    pdf.setTextColor(0, 0, 0)

    // Preparar dados para a tabela
    const dados = [
      ["IP4", orcamento.ip4 || "Não informado"],
      ["Solicitante", orcamento.solicitante || "Não informado"],
      ["Serviço", orcamento.servico || "Não informado"],
      ["Favorecido", orcamento.favorecido || "Não informado"],
      ["Telefone", orcamento.telefone || "Não informado"],
      ["CPF/CNPJ", orcamento.cpfCnpj || "Não informado"],
      ["Banco", orcamento.banco || "Não informado"],
      ["Agência", orcamento.agencia || "Não informado"],
      ["Conta", orcamento.conta || "Não informado"],
      ["PIX", orcamento.pix || "Não informado"],
      [
        "Valor",
        orcamento.valorFormatado || `R$ ${orcamento.valor.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
      ],
      ["Data de Envio", new Date(orcamento.dataEnvio).toLocaleDateString("pt-BR")],
    ]

    // Criar tabela com os dados
    ;(pdf as any).autoTable({
      startY: yPosition,
      head: [["Campo", "Informação"]],
      body: dados,
      theme: "grid",
      headStyles: {
        fillColor: [34, 197, 94],
        textColor: [255, 255, 255],
        fontStyle: "bold",
        fontSize: 11,
      },
      bodyStyles: {
        fillColor: [248, 250, 252],
        fontSize: 10,
        cellPadding: 4,
      },
      alternateRowStyles: {
        fillColor: [240, 253, 244],
      },
      columnStyles: {
        0: { fontStyle: "bold", cellWidth: 40 },
        1: { cellWidth: 130 },
      },
      margin: { left: 20, right: 20 },
      tableWidth: "auto",
    })

    // Rodapé em todas as páginas
    const pageCount = pdf.getNumberOfPages()
    const dataRodape = new Date()
    const dataFormatadaRodape = dataRodape.toLocaleDateString("pt-BR")

    for (let i = 1; i <= pageCount; i++) {
      pdf.setPage(i)

      // Linha separadora do rodapé
      pdf.setDrawColor(34, 197, 94)
      pdf.setLineWidth(0.5)
      pdf.line(
        20,
        pdf.internal.pageSize.height - 20,
        pdf.internal.pageSize.width - 20,
        pdf.internal.pageSize.height - 20,
      )

      // Texto do rodapé
      pdf.setFontSize(8)
      pdf.setTextColor(100, 100, 100)
      pdf.text(`Antonelly Construções e Serviços - Página ${i} de ${pageCount}`, 20, pdf.internal.pageSize.height - 10)

      // Data/hora no rodapé direito
      pdf.text(`Gerado em ${dataFormatadaRodape}`, pdf.internal.pageSize.width - 60, pdf.internal.pageSize.height - 10)
    }

    return pdf.output("blob")
  } catch (error) {
    console.error("Erro ao gerar PDF:", error)

    // Criar PDF de erro como fallback
    const errorPdf = new jsPDF()
    errorPdf.setFillColor(240, 253, 244)
    errorPdf.rect(0, 0, errorPdf.internal.pageSize.width, errorPdf.internal.pageSize.height, "F")

    errorPdf.setFontSize(16)
    errorPdf.setTextColor(220, 38, 38)
    errorPdf.text("Erro ao gerar PDF", 20, 50)

    errorPdf.setFontSize(12)
    errorPdf.setTextColor(0, 0, 0)
    errorPdf.text("Tente novamente ou contate o suporte.", 20, 70)

    return errorPdf.output("blob")
  }
}

export function downloadPDF(blob: Blob, filename: string) {
  try {
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = filename
    a.style.display = "none"
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  } catch (error) {
    console.error("Erro ao baixar PDF:", error)
    alert("Erro ao baixar o PDF. Tente novamente.")
  }
}

// Expor função globalmente para os links do PDF
if (typeof window !== "undefined") {
  ;(window as any).downloadFileFromPDF = (orcamentoId: string, fileName: string) => {
    import("./file-storage").then(({ getStoredFiles, downloadStoredFile }) => {
      const files = getStoredFiles(orcamentoId)
      const file = files.find((f) => f.name === fileName)
      if (file) {
        downloadStoredFile(file)
      } else {
        alert("Arquivo não encontrado.")
      }
    })
  }
}
