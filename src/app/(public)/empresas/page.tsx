export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { listAllCompanies } from '@/modules/empresas/queries'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

export const metadata = {
  title: 'Empresas — PASE Digital',
  description: 'Descubre las empresas participantes en PASE Digital y sus promociones exclusivas.',
}

export default async function EmpresasPublicasPage() {
  const { items: empresas, total } = await listAllCompanies({ status: 'ACTIVE' })

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between gap-6">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-primary flex items-center justify-center shrink-0">
              <span className="text-[10px] font-bold text-primary-foreground">P</span>
            </div>
            <span className="font-semibold text-sm text-foreground">PASE Digital</span>
          </Link>
          <nav className="flex items-center gap-1">
            <Link href="/empresas" className="px-3 py-1.5 text-sm font-medium text-foreground bg-muted rounded-lg">Empresas</Link>
            <Link href="/faq" className="px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted transition-colors">FAQ</Link>
          </nav>
          <Button size="sm" asChild>
            <Link href="/login">Iniciar sesión</Link>
          </Button>
        </div>
      </header>

      <main className="flex-1 max-w-6xl mx-auto px-6 py-12 w-full">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-foreground">Empresas participantes</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {total} empresa{total !== 1 ? 's' : ''} con promociones activas
          </p>
        </div>

        {empresas.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center mb-4 text-2xl">🏢</div>
            <h3 className="text-base font-semibold text-foreground">Sin empresas disponibles</h3>
            <p className="mt-1 text-sm text-muted-foreground">Próximamente habrá empresas con promociones exclusivas.</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {empresas.map((empresa) => (
              <Link
                key={empresa.id}
                href={`/empresas/${empresa.id}`}
                className="group bg-card border border-border rounded-2xl p-5 hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-200"
              >
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center shrink-0">
                    <span className="text-sm font-bold text-muted-foreground">
                      {empresa.name[0].toUpperCase()}
                    </span>
                  </div>
                  <Badge variant="outline" className="text-xs shrink-0">{empresa.industry}</Badge>
                </div>
                <h3 className="font-semibold text-sm text-foreground group-hover:text-primary transition-colors">
                  {empresa.name}
                </h3>
                {empresa.city && (
                  <p className="mt-1 text-xs text-muted-foreground">{empresa.city}</p>
                )}
                <p className="mt-3 text-xs font-medium text-primary">Ver promociones →</p>
              </Link>
            ))}
          </div>
        )}
      </main>

      <footer className="border-t border-border py-6 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} PASE Digital. Todos los derechos reservados.
      </footer>
    </div>
  )
}
