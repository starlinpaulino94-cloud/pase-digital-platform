'use client'

import { useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { regeneratePassAction } from '@/modules/clientes/actions'

export function RegeneratePassButton({ customerId }: { customerId: string }) {
  const [pending, startTransition] = useTransition()

  function handleRegenerate() {
    if (!confirm('¿Regenerar el Pase Digital? El QR anterior quedará inválido.')) return
    startTransition(async () => {
      await regeneratePassAction(customerId)
    })
  }

  return (
    <Button variant="outline" size="sm" onClick={handleRegenerate} disabled={pending}>
      {pending ? 'Regenerando...' : 'Regenerar Pase'}
    </Button>
  )
}
