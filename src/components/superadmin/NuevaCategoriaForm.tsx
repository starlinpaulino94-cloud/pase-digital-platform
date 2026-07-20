'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Plus } from 'lucide-react'
import { toast } from 'sonner'
import { crearCategoria } from '@/modules/empresas/actions'
import { Button } from '@/components/ui/button'

/**
 * Alta rápida de una categoría del directorio (solo superadmin). Se usa al
 * incorporar una empresa cuyo rubro aún no existe como categoría. Vive DENTRO
 * del formulario de la empresa, por eso no usa <form> (evita anidarlos):
 * invoca la server action directamente.
 */
export function NuevaCategoriaForm() {
  const router = useRouter()
  const [nombre, setNombre] = useState('')
  const [pending, startTransition] = useTransition()

  function crear() {
    const valor = nombre.trim()
    if (valor.length < 2) {
      toast.error('Escribe el nombre de la categoría.')
      return
    }
    startTransition(async () => {
      const fd = new FormData()
      fd.set('nombre', valor)
      const res = await crearCategoria({}, fd)
      if (res.success) {
        toast.success(res.message ?? 'Categoría creada.')
        setNombre('')
        router.refresh()
      } else if (res.error) {
        toast.error(res.error)
      }
    })
  }

  return (
    <div className="flex items-center gap-2 pt-1">
      <input
        value={nombre}
        onChange={(e) => setNombre(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault()
            crear()
          }
        }}
        placeholder="Nueva categoría (ej. Barbería)"
        className="h-9 flex-1 rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
      />
      <Button
        type="button"
        size="sm"
        variant="outline"
        disabled={pending}
        onClick={crear}
        className="gap-1.5"
      >
        {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
        Crear
      </Button>
    </div>
  )
}
