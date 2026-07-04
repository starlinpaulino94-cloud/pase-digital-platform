import Link from 'next/link'
import { Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#0f172a] px-4 py-12 text-center text-white">
      <Link
        href="/"
        className="mb-8 flex items-center gap-2 text-2xl font-bold"
      >
        <Sparkles className="h-7 w-7 text-sky-400" />
        MembreGo
      </Link>
      <p className="text-6xl font-bold text-sky-400">404</p>
      <h1 className="mt-4 text-2xl font-bold">Página no encontrada</h1>
      <p className="mt-2 max-w-md text-slate-400">
        La página que buscas no existe o fue movida.
      </p>
      <Button asChild className="mt-8 bg-sky-500 hover:bg-sky-400">
        <Link href="/">Volver al inicio</Link>
      </Button>
    </div>
  )
}
