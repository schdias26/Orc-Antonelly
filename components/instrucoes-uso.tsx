"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Info, Users, Globe, Smartphone, Folder, FileText } from "lucide-react"

export function InstrucoesUso() {
  return (
    <Card className="border-blue-200 bg-blue-50 mb-6">
      <CardHeader>
        <CardTitle className="text-blue-800 flex items-center">
          <Info className="w-5 h-5 mr-2" />
          Como usar este sistema
          <Badge className="ml-2 bg-blue-100 text-blue-800">Público</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <div className="flex items-start space-x-3">
              <Globe className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-blue-800">Acesso Público</h4>
                <p className="text-sm text-blue-700">
                  Compartilhe o link deste sistema com qualquer pessoa. Todos podem criar, visualizar e gerenciar
                  orçamentos.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <Smartphone className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-blue-800">Funciona Offline</h4>
                <p className="text-sm text-blue-700">
                  O sistema funciona mesmo sem internet. Os dados ficam salvos no dispositivo.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <Folder className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-blue-800">Organize por Pastas</h4>
                <p className="text-sm text-blue-700">
                  Crie pastas para cada IP4 ou departamento. Exemplo: "IP4 Barcelos", "IP4 Autazes".
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-start space-x-3">
              <Users className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-blue-800">Colaborativo</h4>
                <p className="text-sm text-blue-700">
                  Múltiplas pessoas podem usar simultaneamente. Ideal para chefes de diferentes IP4s.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <FileText className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-blue-800">PDF Automático</h4>
                <p className="text-sm text-blue-700">
                  Cada orçamento gera automaticamente um PDF profissional para download.
                </p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
