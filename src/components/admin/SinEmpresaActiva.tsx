import { Building2 } from 'lucide-react'
import { EmptyState } from '@/components/system/EmptyState'

/**
 * Estado unificado "no hay empresa activa" del panel (Auditoría · Fase C).
 *
 * Antes, ~15 módulos repetían a mano mensajes distintos ("Selecciona una
 * empresa", "Inicia sesión con una cuenta de empresa", "Crea o selecciona…")
 * para el mismo caso de borde: un superadmin sin empresa seleccionada en el
 * conmutador del panel. Este componente centraliza copy y aspecto en un solo
 * `EmptyState`, para que la experiencia sea consistente en todo el panel.
 *
 * `seccion` completa la frase: p. ej. "para gestionar tus **promociones**".
 * `mensaje` permite un texto propio en los pocos casos especiales (p. ej. una
 * cuenta sin empresa asignada que debe contactar a soporte).
 */
export function SinEmpresaActiva({
  seccion,
  mensaje,
}: {
  seccion?: string
  mensaje?: string
}) {
  return (
    <EmptyState
      icon={Building2}
      title="Elige una empresa"
      description={
        mensaje ??
        `Selecciona una empresa en el conmutador de la parte superior para gestionar ${seccion ?? 'esta sección'}.`
      }
    />
  )
}
