import jsPDF from "jspdf"
import "jspdf-autotable"
import type { Orcamento } from "./orcamentos"

interface FileWithPreview extends File {
  preview?: string
}

export async function generateOrcamentoPDF(
  orcamento: Omit<Orcamento, "id" | "status">,
  anexos: FileWithPreview[],
): Promise<Blob> {
  const pdf = new jsPDF()

  // Configurar fundo verde claro
  pdf.setFillColor(240, 253, 244) // Verde claro
  pdf.rect(0, 0, pdf.internal.pageSize.width, pdf.internal.pageSize.height, "F")

  // Header com logo (simulado)
  pdf.setFillColor(34, 197, 94) // Verde mais escuro
  pdf.rect(0, 0, pdf.internal.pageSize.width, 30, "F")

  pdf.setTextColor(255, 255, 255)
  pdf.setFontSize(20)
  pdf.setFont("helvetica", "bold")
  pdf.text("ANTONELLY CONSTRUÇÕES E SERVIÇOS", 20, 20)

  pdf.setTextColor(0, 0, 0)
  pdf.setFontSize(16)
  pdf.setFont("helvetica", "bold")
  pdf.text("ORÇAMENTO", 20, 45)

  // Data de geração
  pdf.setFontSize(10)
  pdf.setFont("helvetica", "normal")
  pdf.text(`Gerado em: ${new Date().toLocaleDateString("pt-BR")} às ${new Date().toLocaleTimeString("pt-BR")}`, 20, 55)

  let yPosition = 70

  // Dados do orçamento
  const dados = [
    ["IP4", orcamento.ip4 || "N/A"],
    ["Solicitante", orcamento.solicitante || "N/A"],
    ["Serviço", orcamento.servico],
    ["Favorecido", orcamento.favorecido],
    ["Telefone", orcamento.telefone || "N/A"],
    ["CPF/CNPJ", orcamento.cpfCnpj || "N/A"],
    ["Banco", orcamento.banco || "N/A"],
    ["Agência", orcamento.agencia || "N/A"],
    ["Conta", orcamento.conta || "N/A"],
    ["PIX", orcamento.pix || "N/A"],
    ["Valor", `R$ ${orcamento.valor.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`],
  ]

  // Usar autoTable para criar tabela com os dados
  ;(pdf as any).autoTable({
    startY: yPosition,
    head: [["Campo", "Valor"]],
    body: dados,
    theme: "grid",
    headStyles: {
      fillColor: [34, 197, 94],
      textColor: [255, 255, 255],
      fontStyle: "bold",
    },
    bodyStyles: {
      fillColor: [248, 250, 252],
    },
    alternateRowStyles: {
      fillColor: [240, 253, 244],
    },
    margin: { left: 20, right: 20 },
  })

  yPosition = (pdf as any).lastAutoTable.finalY + 20

  // Seção de anexos
  if (anexos.length > 0) {
    pdf.setFontSize(14)
    pdf.setFont("helvetica", "bold")
    pdf.text("ANEXOS", 20, yPosition)
    yPosition += 10

    for (let i = 0; i < anexos.length; i++) {
      const file = anexos[i]

      // Verificar se precisa de nova página
      if (yPosition > pdf.internal.pageSize.height - 60) {
        pdf.addPage()
        // Aplicar fundo verde claro na nova página
        pdf.setFillColor(240, 253, 244)
        pdf.rect(0, 0, pdf.internal.pageSize.width, pdf.internal.pageSize.height, "F")
        yPosition = 20
      }

      pdf.setFontSize(12)
      pdf.setFont("helvetica", "bold")
      pdf.text(`Anexo ${i + 1}: ${file.name}`, 20, yPosition)
      yPosition += 10

      if (file.type.startsWith("image/") && file.preview) {
        try {
          // Adicionar imagem ao PDF
          const img = new Image()
          img.crossOrigin = "anonymous"

          await new Promise((resolve, reject) => {
            img.onload = () => {
              try {
                // Calcular dimensões mantendo proporção
                const maxWidth = 150
                const maxHeight = 100
                let { width, height } = img

                if (width > maxWidth) {
                  height = (height * maxWidth) / width
                  width = maxWidth
                }

                if (height > maxHeight) {
                  width = (width * maxHeight) / height
                  height = maxHeight
                }

                // Adicionar imagem
                pdf.addImage(img, "JPEG", 20, yPosition, width, height)
                yPosition += height + 10

                // Adicionar botão de download (texto)
                pdf.setFontSize(10)
                pdf.setTextColor(34, 197, 94)
                pdf.text("📎 Clique para baixar arquivo original", 20, yPosition)
                pdf.setTextColor(0, 0, 0)
                yPosition += 15

                resolve(true)
              } catch (error) {
                reject(error)
              }
            }
            img.onerror = reject
            img.src = file.preview
          })
        } catch (error) {
          console.error("Erro ao adicionar imagem:", error)
          pdf.setFontSize(10)
          pdf.setTextColor(220, 38, 38)
          pdf.text("Erro ao carregar imagem", 20, yPosition)
          pdf.setTextColor(0, 0, 0)
          yPosition += 15
        }
      } else {
        // Para PDFs e outros documentos
        pdf.setFontSize(10)
        pdf.setTextColor(100, 100, 100)
        pdf.text(`Tipo: ${file.type}`, 20, yPosition)
        pdf.text(`Tamanho: ${(file.size / 1024).toFixed(2)} KB`, 20, yPosition + 10)
        pdf.setTextColor(34, 197, 94)
        pdf.text("📎 Clique para baixar arquivo original", 20, yPosition + 20)
        pdf.setTextColor(0, 0, 0)
        yPosition += 35
      }
    }
  }

  // Rodapé
  const pageCount = pdf.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    pdf.setPage(i)
    pdf.setFontSize(8)
    pdf.setTextColor(100, 100, 100)
    pdf.text(`Página ${i} de ${pageCount} - Antonelly Construções e Serviços`, 20, pdf.internal.pageSize.height - 10)
  }

  return pdf.output("blob")
}

export function downloadFile(file: File, filename?: string) {
  const url = URL.createObjectURL(file)
  const a = document.createElement("a")
  a.href = url
  a.download = filename || file.name
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
