import Image from "next/image"
import Link from "next/link"
import { Navigation } from "./navigation"

export function Logo() {
  return (
    <div className="flex items-center justify-between w-full">
      <Link href="/" className="flex items-center">
        <Image
          src="/logo-antonelly.png"
          alt="Antonelly Construções e Serviços"
          width={280}
          height={80}
          className="h-16 w-auto"
          priority
        />
      </Link>
      <Navigation />
    </div>
  )
}
