import Link from 'next/link'
import { SearchX } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'

/**
 * 404 DENTRO del shell del panel: antes un notFound() en /admin o /cliente
 * expulsaba al usuario al 404 global (fondo navy, fuera de contexto). Ahora
 * conserva sidebar/header y ofrece volver al inicio del panel.
 */
export function PanelNotFound({ homeHref, homeLabel }: { homeHref: string; homeLabel: string }) {
  return (
    <EmptyState
      icon={<SearchX className="h-7 w-7" />}
      title="No encontramos esta página"
      description="El enlace puede haber cambiado o el recurso ya no existe."
      action={
        <Button asChild>
          <Link href={homeHref}>{homeLabel}</Link>
        </Button>
      }
      className="py-24"
    />
  )
}
