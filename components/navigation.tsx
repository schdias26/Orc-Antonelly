"use client"

import { Button } from "@/components/ui/button"
import { FileText, List } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"

export function Navigation() {
  const pathname = usePathname()

  return (
    <div className="flex space-x-4">
      <Link href="/">
        <Button
          variant={pathname === "/" ? "default" : "outline"}
          className={pathname === "/" ? "bg-green-600 text-white" : "border-green-600 text-green-600 hover:bg-green-50"}
        >
          <FileText className="w-4 h-4 mr-2" />
          Novo Orçamento
        </Button>
      </Link>
      <Link href="/orcamentos">
        <Button
          variant={pathname === "/orcamentos" ? "default" : "outline"}
          className={
            pathname === "/orcamentos" ? "bg-green-600 text-white" : "border-green-600 text-green-600 hover:bg-green-50"
          }
        >
          <List className="w-4 h-4 mr-2" />
          Orçamentos Salvos
        </Button>
      </Link>
    </div>
  )
}
