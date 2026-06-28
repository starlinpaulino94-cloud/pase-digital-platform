export const dynamic = 'force-dynamic'

import { requireSuperAdmin } from '@/lib/auth/guards'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default async function ConfiguracionGlobalPage() {
  await requireSuperAdmin()

  return (
    <div className="p-6 space-y-6 max-w-2xl">
      <h1 className="text-2xl font-semibold">Configuración Global</h1>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Plataforma PASE</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>Versión: MVP 1.0</p>
          <p>Entorno: {process.env.NODE_ENV}</p>
        </CardContent>
      </Card>
    </div>
  )
}
