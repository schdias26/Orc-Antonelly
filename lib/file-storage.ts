// Sistema de armazenamento de arquivos offline
export interface StoredFile {
  name: string
  type: string
  size: number
  data: string // base64
  preview?: string
}

export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

export async function storeFiles(orcamentoId: string, files: File[]): Promise<StoredFile[]> {
  const storedFiles: StoredFile[] = []

  for (const file of files) {
    try {
      const data = await fileToBase64(file)
      const storedFile: StoredFile = {
        name: file.name,
        type: file.type,
        size: file.size,
        data,
        preview: file.type.startsWith("image/") ? data : undefined,
      }
      storedFiles.push(storedFile)
    } catch (error) {
      console.error(`Erro ao armazenar arquivo ${file.name}:`, error)
    }
  }

  // Salvar no localStorage
  try {
    localStorage.setItem(`files_${orcamentoId}`, JSON.stringify(storedFiles))
  } catch (error) {
    console.error("Erro ao salvar arquivos no localStorage:", error)
  }

  return storedFiles
}

export function getStoredFiles(orcamentoId: string): StoredFile[] {
  try {
    const stored = localStorage.getItem(`files_${orcamentoId}`)
    return stored ? JSON.parse(stored) : []
  } catch (error) {
    console.error("Erro ao recuperar arquivos:", error)
    return []
  }
}

export function downloadStoredFile(file: StoredFile) {
  try {
    const link = document.createElement("a")
    link.href = file.data
    link.download = file.name
    link.style.display = "none"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  } catch (error) {
    console.error("Erro ao baixar arquivo:", error)
    alert("Erro ao baixar arquivo.")
  }
}

export function deleteStoredFiles(orcamentoId: string) {
  try {
    localStorage.removeItem(`files_${orcamentoId}`)
  } catch (error) {
    console.error("Erro ao deletar arquivos:", error)
  }
}
