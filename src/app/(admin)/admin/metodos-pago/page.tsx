import Link from 'next/link'
import { ADMIN_ROLES } from '@/types'
import { requireRole } from '@/lib/auth/guards'
import { companyFilter } from '@/modules/admin/queries'
import { prisma } from '@/lib/prisma'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { DeleteMetodoPagoButton } from '@/components/admin/DeleteMetodoPagoButton'
import { CreditCard, Building2, Plus, Pencil } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function MetodosPagoPage() {
  const user = await requireRole(ADMIN_ROLES)
  const companyId = companyFilter(user)

  let metodos: {
    id: string; nombre: string; tipo: string; titular: string | null;
    numeroCuenta: string | null; tipoCuenta: string | null;
    instrucciones: string | null; activo: boolean;
    company: { name: string }
  }[] = []
  try {
    metodos = await prisma.metodoPago.findMany({
      where: companyId ? { companyId } : {},
      include: { company: true },
      orderBy: { createdAt: 'asc' },
    })
  } catch (e) {
    console.error('[admin-metodos-pago]', e)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Métodos de pago</h1>
          <p className="text-slate-500">
            Los clientes verán estas instrucciones al enviar su comprobante.
          </p>
        </div>
        <Link href="/admin/metodos-pago/nuevo">
          <Button className="bg-sky-500 hover:bg-sky-400">
            <Plus className="mr-2 h-4 w-4" />
            Agregar método
          </Button>
        </Link>
      </div>

      {metodos.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center text-slate-500">
            <CreditCard className="mx-auto mb-3 h-10 w-10 text-slate-300" />
            <p className="font-medium">Sin métodos configurados</p>
            <p className="text-sm">
              Agrega cuentas bancarias o métodos presenciales para que tus
              clientes sepan cómo pagar.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {metodos.map((m) => (
            <Card key={m.id} className={m.activo ? '' : 'opacity-60'}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    {m.tipo === 'TRANSFERENCIA' ? (
                      <div className="rounded-lg bg-sky-100 p-2">
                        <CreditCard className="h-5 w-5 text-sky-600" />
                      </div>
                    ) : (
                      <div className="rounded-lg bg-amber-100 p-2">
                        <Building2 className="h-5 w-5 text-amber-600" />
                      </div>
                    )}
                    <div>
                      <p className="font-semibold text-slate-800">{m.nombre}</p>
                      <p className="text-xs text-slate-500">
                        {m.tipo === 'TRANSFERENCIA'
                          ? 'Transferencia bancaria'
                          : 'Pago presencial'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {!m.activo && (
                      <Badge variant="secondary" className="text-xs">
                        Inactivo
                      </Badge>
                    )}
                    <Link href={`/admin/metodos-pago/${m.id}/editar`}>
                      <Button size="icon" variant="ghost">
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </Link>
                    <DeleteMetodoPagoButton id={m.id} nombre={m.nombre} />
                  </div>
                </div>

                <div className="mt-4 space-y-1 text-sm text-slate-600">
                  {m.titular && <p><strong>Titular:</strong> {m.titular}</p>}
                  {m.numeroCuenta && (
                    <p>
                      <strong>Cuenta:</strong> {m.numeroCuenta}
                      {m.tipoCuenta ? ` (${m.tipoCuenta})` : ''}
                    </p>
                  )}
                  {m.instrucciones && (
                    <p className="whitespace-pre-line text-xs text-slate-500">
                      {m.instrucciones}
                    </p>
                  )}
                </div>

                {user.metadata.role === 'SUPERADMIN' && (
                  <p className="mt-3 text-xs text-slate-400">
                    {m.company.name}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
