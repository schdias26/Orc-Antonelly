import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"

export default function ContatoPage() {
  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-6">Entre em contato</h1>
      <div className="max-w-md mx-auto">
        <form className="space-y-4">
          <div>
            <label htmlFor="nome" className="block text-sm font-medium mb-1">
              Nome
            </label>
            <Input id="nome" placeholder="Seu nome" />
          </div>
          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-1">
              Email
            </label>
            <Input id="email" type="email" placeholder="seu@email.com" />
          </div>
          <div>
            <label htmlFor="mensagem" className="block text-sm font-medium mb-1">
              Mensagem
            </label>
            <Textarea id="mensagem" placeholder="Sua mensagem" rows={5} />
          </div>
          <Button type="submit" className="w-full">
            Enviar mensagem
          </Button>
        </form>
      </div>
    </div>
  )
}
