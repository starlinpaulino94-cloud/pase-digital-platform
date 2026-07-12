import { requireRole } from '@/lib/auth/guards'
import { SCANNER_ROLES } from '@/types'
import { ScannerScreen } from '@/components/scanner/ScannerScreen'

export const dynamic = 'force-dynamic'

export default async function ScannerPage() {
  const user = await requireRole(SCANNER_ROLES)
  const companyId = user.metadata.companyId ?? undefined

  // El empleado ve solo las visitas que él registró hoy (Visit.empleadoId
  // guarda el dbUserId; ver confirmarVisita en modules/visitas/actions.ts).
  return <ScannerScreen companyId={companyId} empleadoId={user.metadata.dbUserId ?? undefined} />
}
