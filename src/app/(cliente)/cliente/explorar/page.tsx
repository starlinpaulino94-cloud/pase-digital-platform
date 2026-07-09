import Link from 'next/link'
import { Search, Store } from 'lucide-react'
import { requireRole } from '@/lib/auth/guards'
import { getCompaniesPublic } from '@/modules/marketplace/queries'
import { getSeguidasIds } from '@/modules/social/queries'
import { ExplorarEmpresasList } from '@/components/cliente/ExplorarEmpresasList'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Explorar empresas',
}

/**
 * Directorio de todas las empresas DENTRO del portal del cliente (misma
 * navegación, sin salir a la landing pública). Desde aquí puede seguir
 * empresas y entrar a su perfil para afiliarse.
 */
export default async function ExplorarEmpresasPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const user = await requireRole('CLIENTE')
  const params = await searchParams
  const search = typeof params.q === 'string' ? params.q.trim() : ''

  const [companies, seguidas] = await Promise.all([
    getCompaniesPublic({ search: search || undefined, limit: 100 }),
    getSeguidasIds(user.metadata.dbUserId),
  ])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Explorar empresas</h1>
        <p className="text-slate-500">
          Descubre negocios afiliados, síguelos y únete a sus membresías, todo
          desde tu cuenta.
        </p>
      </div>

      {/* Búsqueda (GET: funciona sin JS y conserva el término en la URL) */}
      <form action="/cliente/explorar" className="flex max-w-md gap-2">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            name="q"
            defaultValue={search}
            placeholder="Buscar por nombre o descripción…"
            className="pl-9"
          />
        </div>
        <Button type="submit" variant="outline">
          Buscar
        </Button>
      </form>

      {companies.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center text-slate-500">
            <Store className="mx-auto mb-3 h-10 w-10 text-slate-300" />
            <p className="font-medium">
              {search
                ? `No encontramos empresas para “${search}”`
                : 'No hay empresas disponibles todavía'}
            </p>
            {search && (
              <Button asChild variant="outline" className="mt-4">
                <Link href="/cliente/explorar">Ver todas</Link>
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <ExplorarEmpresasList
          empresas={companies.map((c) => ({
            id: c.id,
            name: c.name,
            slug: c.slug,
            type: c.type,
            logoUrl: c.logoUrl,
            bannerUrl: c.bannerUrl,
            ciudad: c.ciudad,
            totalMembersCount: c.totalMembersCount,
            activePromotionsCount: c.activePromotionsCount,
          }))}
          seguidasIds={[...seguidas]}
        />
      )}
    </div>
  )
}
