"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Download, FileText, ImageIcon, Eye } from "lucide-react"
import { getStoredFiles, downloadStoredFile, type StoredFile } from "@/lib/file-storage"

interface AnexosDisplayProps {
  orcamentoId: string
}

export function AnexosDisplay({ orcamentoId }: AnexosDisplayProps) {
  const [files, setFiles] = useState<StoredFile[]>([])
  const [previewFile, setPreviewFile] = useState<StoredFile | null>(null)

  useEffect(() => {
    const storedFiles = getStoredFiles(orcamentoId)
    setFiles(storedFiles)
  }, [orcamentoId])

  const handleDownload = (file: StoredFile) => {
    downloadStoredFile(file)
  }

  const handlePreview = (file: StoredFile) => {
    setPreviewFile(file)
  }

  const closePreview = () => {
    setPreviewFile(null)
  }

  if (files.length === 0) {
    return (
      <div className="text-sm text-gray-500">
        <p>Nenhum anexo</p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-green-800">Anexos ({files.length})</p>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {files.map((file, index) => (
          <Card key={index} className="border-green-200">
            <CardContent className="p-2">
              <div className="flex flex-col items-center space-y-2">
                {file.type.startsWith("image/") ? (
                  <div className="relative">
                    <img
                      src={file.preview || "/placeholder.svg"}
                      alt={file.name}
                      className="w-16 h-16 object-cover rounded cursor-pointer hover:opacity-80"
                      onClick={() => handlePreview(file)}
                    />
                    <ImageIcon className="absolute top-1 right-1 w-4 h-4 text-green-600 bg-white rounded-full p-0.5" />
                  </div>
                ) : (
                  <div className="w-16 h-16 bg-gray-100 rounded flex items-center justify-center">
                    <FileText className="w-8 h-8 text-green-600" />
                  </div>
                )}

                <div className="text-center">
                  <p className="text-xs font-medium truncate w-full" title={file.name}>
                    {file.name}
                  </p>
                  <p className="text-xs text-gray-500">{(file.size / 1024).toFixed(1)} KB</p>
                </div>

                <div className="flex space-x-1">
                  {file.type.startsWith("image/") && (
                    <Button size="sm" variant="outline" onClick={() => handlePreview(file)} className="h-6 px-2">
                      <Eye className="w-3 h-3" />
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDownload(file)}
                    className="h-6 px-2 border-green-600 text-green-600 hover:bg-green-50"
                  >
                    <Download className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Modal de Preview */}
      {previewFile && previewFile.type.startsWith("image/") && (
        <div
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50"
          onClick={closePreview}
        >
          <div className="max-w-4xl max-h-4xl p-4" onClick={(e) => e.stopPropagation()}>
            <div className="bg-white rounded-lg p-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">{previewFile.name}</h3>
                <div className="flex space-x-2">
                  <Button onClick={() => handleDownload(previewFile)} className="bg-green-600 text-white">
                    <Download className="w-4 h-4 mr-2" />
                    Baixar
                  </Button>
                  <Button onClick={closePreview} variant="outline">
                    Fechar
                  </Button>
                </div>
              </div>
              <img
                src={previewFile.preview || "/placeholder.svg"}
                alt={previewFile.name}
                className="max-w-full max-h-96 object-contain mx-auto"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
