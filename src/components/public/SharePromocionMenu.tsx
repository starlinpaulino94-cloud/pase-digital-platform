'use client'

import { recordPromotionShare } from '@/modules/marketplace/actions'
import { ShareMenu } from './ShareMenu'

interface SharePromocionMenuProps {
  promocionId: string
  titulo: string
  companyName: string
}

/**
 * Fase E8 · Compartir una promoción (acción primaria) registrando el contador
 * de compartidas. Delega la UI en el menú genérico `ShareMenu`.
 */
export function SharePromocionMenu({
  promocionId,
  titulo,
  companyName,
}: SharePromocionMenuProps) {
  return (
    <ShareMenu
      title={titulo}
      text={`${titulo} — promoción de ${companyName} en MembeGo.`}
      path={`/promocion/${promocionId}`}
      onShared={() => {
        recordPromotionShare(promocionId).catch(console.error)
      }}
    />
  )
}
