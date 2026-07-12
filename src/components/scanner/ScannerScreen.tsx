import { Suspense } from 'react'
import { prisma } from '@/lib/prisma'
import { ScannerClient } from '@/components/scanner/ScannerClient'
import { ScannerErrorBoundary } from '@/components/scanner/ScannerErrorBoundary'
import { VisitasDeHoy } from '@/components/scanner/VisitasDeHoy'
import { Skeleton } from '@/components/ui/skeleton'

/**
 * Pantalla completa del escáner (server component compartido por el panel
 * admin y el del empleado — antes eran dos páginas duplicadas).
 *
 * - `empleadoId`: si se pasa, la vista "Hoy" muestra solo las visitas
 *   registradas por ese usuario (caso empleado); sin él, las de la empresa.
 */
export async function ScannerScreen({
  companyId,
  empleadoId,
}: {
  companyId?: string
  empleadoId?: string
}) {
  let sucursales: { id: string; nombre: string }[] = []
  try {
    if (companyId) {
      sucursales = await prisma.sucursal.findMany({
        where: { companyId, activa: true },
        orderBy: { nombre: 'asc' },
        select: { id: true, nombre: true },
      })
    }
  } catch (e) {
    console.error('[scanner] sucursales error:', e)
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

      {companyId && (
        <Suspense fallback={<Skeleton className="h-32 w-full rounded-2xl" />}>
          <VisitasDeHoy companyId={companyId} empleadoId={empleadoId} />
        </Suspense>
      )}
    </div>
  )
}
