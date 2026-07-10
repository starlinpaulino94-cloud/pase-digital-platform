import Link from 'next/link'
import { Store, AlertCircle, Search } from 'lucide-react'
import { requireRole } from '@/lib/auth/guards'
import { getMisEmpresas } from '@/modules/social/queries'
import { MisEmpresasList } from '@/components/cliente/MisEmpresasList'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export const dynamic = 'force-dynamic'

export default async function MisEmpresasPage() {
  const user = await requireRole('CLIENTE')

  let empresas: Awaited<ReturnType<typeof getMisEmpresas>> = []
  let loadError = false
  try {
    empresas = await getMisEmpresas(user.metadata.dbUserId)
  } catch (e) {
    loadError = true
    console.error('[cliente-empresas]', e)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Mis empresas</h1>
          <p className="text-slate-500">
            Las empresas que sigues. Sus promociones y novedades llegan a ti
            automáticamente.
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href="/cliente/descubrir">
            <Search className="mr-2 h-4 w-4" /> Descubrir empresas
          </Link>
        </Button>
      </div>

      {loadError ? (
        <Card className="border-destructive/30 bg-destructive/5">
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <AlertCircle className="h-8 w-8 text-destructive" />
            <p className="font-medium text-foreground">
              No pudimos cargar tus empresas.
            </p>
            <Button asChild variant="outline">
              <Link href="/cliente/empresas">Reintentar</Link>
            </Button>
          </CardContent>
        </Card>
      ) : empresas.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center text-slate-500">
            <Store className="mx-auto mb-3 h-10 w-10 text-slate-300" />
            <p className="font-medium">Aún no sigues ninguna empresa</p>
            <p className="text-sm">
              Sigue empresas para recibir sus promociones, beneficios y
              novedades sin buscarlas.
            </p>
            <Button asChild className="mt-4">
              <Link href="/cliente/descubrir">Explorar empresas</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <MisEmpresasList empresas={empresas} />
      )}
    </div>
  )
}
