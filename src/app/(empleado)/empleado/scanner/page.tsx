import { requireRole } from '@/lib/auth/guards'
import { prisma } from '@/lib/prisma'
import { SCANNER_ROLES } from '@/types'
import { ScannerClient } from '@/components/scanner/ScannerClient'
import { ScannerErrorBoundary } from '@/components/scanner/ScannerErrorBoundary'

export const dynamic = 'force-dynamic'

export default async function ScannerPage() {
  const user = await requireRole(SCANNER_ROLES)

  const companyId = user.metadata.companyId ?? undefined
  let sucursales: { id: string; nombre: string }[] = []
  try {
    if (companyId) {
      const rows = await prisma.sucursal.findMany({
        where: { companyId, activa: true },
        orderBy: { nombre: 'asc' },
        select: { id: true, nombre: true },
      })
      sucursales = rows
    }
  } catch (e) {
    console.error('[empleado-scanner] sucursales error:', e)
  }

  return (
    <div className="space-y-6 animate-fade-up">
      <div>
        <h1 className="text-h1 text-foreground">Escáner de visitas</h1>
        <p className="mt-1 text-small text-muted-foreground">
          Escanea el QR del cliente para registrar su visita.
        </p>
      </div>
      <ScannerErrorBoundary>
        <ScannerClient sucursales={sucursales} />
      </ScannerErrorBoundary>
    </div>
  )
}
