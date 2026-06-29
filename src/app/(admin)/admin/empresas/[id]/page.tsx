export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { notFound } from 'next/navigation'
import { requireSuperAdmin } from '@/lib/auth/guards'
import { getCompanyById, listBranchesByCompany } from '@/modules/empresas/queries'
import { setCompanyStatusAction } from '@/modules/empresas/actions'
import { CompanyStatusBadge } from '@/components/companies/CompanyStatusBadge'
import { BranchStatusBadge } from '@/components/companies/BranchStatusBadge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'

interface Props {
  params: Promise<{ id: string }>
}

export default async function EmpresaDetailPage({ params }: Props) {
  await requireSuperAdmin()
  const { id } = await params

  const [company, branches] = await Promise.all([
    getCompanyById(id),
    listBranchesByCompany(id),
  ])

  if (!company) notFound()

  async function suspend() {
    'use server'
    await setCompanyStatusAction(id, 'SUSPENDED')
  }

  async function activate() {
    'use server'
    await setCompanyStatusAction(id, 'ACTIVE')
  }

  return (
    <div className="p-6 space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/admin/empresas">← Volver</Link>
          </Button>
          <div>
            <h1 className="text-2xl font-semibold">{company.name}</h1>
            {company.legalName && (
              <p className="text-sm text-muted-foreground">{company.legalName}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <CompanyStatusBadge status={company.status} />
          <Button variant="outline" size="sm" asChild>
            <Link href={`/admin/empresas/${id}/editar`}>Editar</Link>
          </Button>
          {company.status !== 'SUSPENDED' ? (
            <form action={suspend}>
              <Button variant="destructive" size="sm" type="submit">Suspender</Button>
            </form>
          ) : (
            <form action={activate}>
              <Button variant="default" size="sm" type="submit">Activar</Button>
            </form>
          )}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-base">Información</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <Row label="Industria" value={company.industry} />
            <Row label="Email" value={company.email} />
            <Row label="Teléfono" value={company.phone} />
            <Row label="Ciudad" value={company.city} />
            <Row label="Dirección" value={company.address} />
            {company.description && (
              <>
                <Separator />
                <p className="text-muted-foreground">{company.description}</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Estadísticas</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <Row label="Sucursales" value={String(company._count?.branches ?? 0)} />
            <Row label="Empleados" value={String(company._count?.employees ?? 0)} />
            <Row label="País" value={company.country} />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Sucursales ({branches.length})</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {branches.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sin sucursales registradas.</p>
          ) : (
            <div className="divide-y">
              {branches.map((b) => (
                <div key={b.id} className="py-2 flex items-center justify-between text-sm">
                  <div>
                    <span className="font-medium">{b.name}</span>
                    {b.address && <span className="ml-2 text-muted-foreground">{b.address}</span>}
                  </div>
                  <BranchStatusBadge status={b.status} />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div className="flex justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span>{value ?? ''}</span>
    </div>
  )
}
