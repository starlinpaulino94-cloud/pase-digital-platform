import { requireRole } from '@/lib/auth/guards'
import { prisma } from '@/lib/prisma'
import { ScannerClient } from '@/components/scanner/ScannerClient'

export const dynamic = 'force-dynamic'

export default async function ScannerPage() {
  const user = await requireRole(['EMPLEADO', 'ADMIN_EMPRESA', 'SUPERADMIN'])

  const companyId = user.metadata.companyId ?? undefined
  const sucursales = companyId
    ? await prisma.sucursal.findMany({
        where: { companyId, activa: true },
        orderBy: { nombre: 'asc' },
      })
    : []

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Escáner de visitas</h1>
        <p className="text-slate-500">
          Escanea el QR del cliente para registrar su visita.
        </p>
      </div>
      <ScannerClient
        sucursales={sucursales.map((s) => ({ id: s.id, nombre: s.nombre }))}
      />
    </div>
  )
}
