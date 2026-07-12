import { requireRole } from '@/lib/auth/guards'
import { ADMIN_ROLES } from '@/types'
import { ScannerScreen } from '@/components/scanner/ScannerScreen'

export const dynamic = 'force-dynamic'

export default async function AdminScannerPage() {
  const user = await requireRole(ADMIN_ROLES)
  const companyId = user.metadata.companyId ?? undefined

  // El admin ve las visitas de hoy de toda la empresa.
  return <ScannerScreen companyId={companyId} />
}
