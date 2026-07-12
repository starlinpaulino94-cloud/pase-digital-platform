'use client'

import { useActionState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Rocket } from 'lucide-react'
import { toast } from 'sonner'
import {
  publicarMiEmpresa,
  type PerfilState,
} from '@/modules/empresas/perfilActions'
import { Button } from '@/components/ui/button'

const init: PerfilState = {}

export function PublicarEmpresaButton({ habilitado }: { habilitado: boolean }) {
  const router = useRouter()
  const [state, action, pending] = useActionState(publicarMiEmpresa, init)

  useEffect(() => {
    if (state.success) {
      toast.success('¡Tu empresa ya está publicada en el marketplace!')
      router.refresh()
    }
    if (state.error) toast.error(state.error)
  }, [state.success, state.error, router])

  return (
    <form action={action}>
      <Button
        type="submit"
        disabled={!habilitado || pending}
        className="bg-primary hover:bg-primary/90"
      >
        {pending ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Rocket className="mr-2 h-4 w-4" />
        )}
        Publicar mi empresa
      </Button>
    </form>
  )
}
