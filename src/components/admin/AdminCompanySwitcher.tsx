'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Building2, Check, ChevronsUpDown, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { cambiarEmpresaActiva } from '@/modules/admin/empresaActivaActions'
import { cn } from '@/lib/utils'

interface EmpresaOption {
  id: string
  name: string
}

/**
 * Selector de empresa activa para staff multi-empresa (y superadmin). Cambia
 * el contexto de TODO el panel: al confirmar, el servidor actualiza la
 * empresa activa y se refresca la vista sin recargar.
 */
export function AdminCompanySwitcher({
  empresas,
  activaId,
}: {
  empresas: EmpresaOption[]
  activaId: string | null
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()

  if (empresas.length < 2) return null

  const activa = empresas.find((e) => e.id === activaId)

  function seleccionar(id: string) {
    setOpen(false)
    if (id === activaId) return
    startTransition(async () => {
      const res = await cambiarEmpresaActiva(id)
      if (res.error) {
        toast.error(res.error)
        return
      }
      const nombre = empresas.find((e) => e.id === id)?.name ?? 'la empresa'
      toast.success(`Ahora administras ${nombre}.`)
      router.refresh()
    })
  }

  return (
    <div className="relative mb-4">
      <button
        onClick={() => setOpen((o) => !o)}
        disabled={pending}
        className="flex w-full items-center justify-between gap-2 rounded-xl border border-border/60 bg-white px-3.5 py-2.5 text-sm shadow-sm transition hover:border-blue-200 disabled:opacity-60 sm:w-80"
      >
        <span className="flex min-w-0 items-center gap-2">
          {pending ? (
            <Loader2 className="h-4 w-4 shrink-0 animate-spin text-slate-400" />
          ) : (
            <Building2 className="h-4 w-4 shrink-0 text-slate-400" />
          )}
          <span className="truncate font-medium text-slate-900">
            {activa?.name ?? 'Elegir empresa'}
          </span>
        </span>
        <ChevronsUpDown className="h-3.5 w-3.5 shrink-0 text-slate-400" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-12 z-50 max-h-72 w-full overflow-y-auto rounded-xl border border-border/60 bg-white py-1 shadow-lg sm:w-80">
            {empresas.map((e) => (
              <button
                key={e.id}
                onClick={() => seleccionar(e.id)}
                className={cn(
                  'flex w-full items-center justify-between px-3.5 py-2 text-left text-sm transition hover:bg-slate-50',
                  e.id === activaId ? 'font-semibold text-blue-700' : 'text-slate-700'
                )}
              >
                <span className="truncate">{e.name}</span>
                {e.id === activaId && <Check className="h-4 w-4 shrink-0" />}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
