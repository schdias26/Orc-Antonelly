"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Upload, X, FileText, ImageIcon } from "lucide-react"
import { Label } from "@/components/ui/label"

export interface FileWithPreview extends File {
  preview?: string
}

interface FileUploadProps {
  onFilesChange?: (files: FileWithPreview[]) => void
  initialFiles?: FileWithPreview[]
}

export function FileUpload({ onFilesChange, initialFiles = [] }: FileUploadProps) {
  const [files, setFiles] = useState<FileWithPreview[]>(initialFiles)

  useEffect(() => {
    if (onFilesChange) {
      onFilesChange(files)
    }
  }, [files, onFilesChange])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return

    const newFiles = Array.from(e.target.files).map((file) => {
      // Adicionar preview para imagens
      if (file.type.startsWith("image/")) {
        const fileWithPreview = file as FileWithPreview
        fileWithPreview.preview = URL.createObjectURL(file)
        return fileWithPreview
      }
      return file
    })

    setFiles((prevFiles) => [...prevFiles, ...newFiles])
  }

  const removeFile = (index: number) => {
    setFiles((prevFiles) => {
      const updatedFiles = [...prevFiles]
      // Revogar URL do objeto se for uma imagem com preview
      if (updatedFiles[index].preview) {
        URL.revokeObjectURL(updatedFiles[index].preview!)
      }
      updatedFiles.splice(index, 1)
      return updatedFiles
    })
  }

  // Cleanup URLs when component unmounts
  useEffect(() => {
    return () => {
      files.forEach((file) => {
        if (file.preview) {
          URL.revokeObjectURL(file.preview)
        }
      })
    }
  }, [])

  return (
    <div>
      <Label className="text-green-800 font-medium">Anexos</Label>
      <div className="mt-2 border-2 border-dashed border-green-300 rounded-lg p-6">
        <div className="space-y-2 text-center">
          <div className="flex items-center justify-center">
            <Upload className="h-10 w-10 text-green-500" />
          </div>
          <div className="flex flex-col items-center text-sm text-gray-600">
            <label
              htmlFor="file-upload"
              className="relative cursor-pointer rounded-md bg-white font-medium text-green-600 focus-within:outline-none focus-within:ring-2 focus-within:ring-green-500 focus-within:ring-offset-2 hover:text-green-500"
            >
              <span>Arraste arquivos aqui</span>
              <input
                id="file-upload"
                name="file-upload"
                type="file"
                className="sr-only"
                multiple
                accept="image/*,.pdf"
                onChange={handleFileChange}
              />
            </label>
            <p className="pl-1">ou clique para selecionar</p>
          </div>
          <p className="text-xs text-gray-500">Suporta imagens (PNG, JPG, GIF) e documentos PDF</p>
        </div>

        {files.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {files.map((file, index) => (
              <div key={index} className="relative bg-gray-100 rounded p-2 flex items-center">
                {file.type.startsWith("image/") ? (
                  <>
                    <ImageIcon className="h-4 w-4 text-green-600 mr-2" />
                    {file.preview && (
                      <div className="absolute -top-2 -left-2 w-8 h-8 rounded-full overflow-hidden border border-white">
                        <img
                          src={file.preview || "/placeholder.svg"}
                          alt="Preview"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                  </>
                ) : (
                  <FileText className="h-4 w-4 text-green-600 mr-2" />
                )}
                <span className="text-sm">{file.name}</span>
                <button
                  type="button"
                  className="ml-2 text-gray-500 hover:text-red-500"
                  onClick={() => removeFile(index)}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
