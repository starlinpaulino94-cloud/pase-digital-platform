'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Gift, MapPin, Plus, Check, Loader2, ExternalLink, Users } from 'lucide-react'
import { toast } from 'sonner'
import { toggleSeguirEmpresa } from '@/modules/social/actions'

const TIPO_LABEL: Record<string, string> = {
  carwash: 'Car Wash',
  restaurante: 'Restaurante',
  gimnasio: 'Gimnasio',
  salon: 'Salón',
}

export interface EmpresaExplorar {
  id: string
  name: string
  slug: string
  type: string
  logoUrl: string | null
  bannerUrl: string | null
  ciudad: string | null
  totalMembersCount: number
  activePromotionsCount: number
}

/**
 * Directorio de empresas DENTRO del portal del cliente: seguir/dejar de seguir
 * sin salir de la app. "Ver perfil" abre la mini-web de la empresa (planes y
 * registro) porque ahí vive la afiliación.
 */
export function ExplorarEmpresasList({
  empresas,
  seguidasIds,
}: {
  empresas: EmpresaExplorar[]
  seguidasIds: string[]
}) {
  const router = useRouter()
  const [seguidas, setSeguidas] = useState<Set<string>>(new Set(seguidasIds))
  const [pendingId, setPendingId] = useState<string | null>(null)
  const [, startTransition] = useTransition()

  function toggleSeguir(company: EmpresaExplorar) {
    setPendingId(company.id)
    startTransition(async () => {
      const res = await toggleSeguirEmpresa(company.id)
      setPendingId(null)
      if (res.error) {
        toast.error(res.error)
        return
      }
      setSeguidas((prev) => {
        const next = new Set(prev)
        if (res.following) next.add(company.id)
        else next.delete(company.id)
        return next
      })
      toast.success(
        res.following
          ? `Ahora sigues a ${company.name}. Recibirás sus promociones y novedades.`
          : `Dejaste de seguir ${company.name}.`
      )
      router.refresh()
    })
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {empresas.map((company) => {
        const siguiendo = seguidas.has(company.id)
        const pending = pendingId === company.id
        const initials = company.name.slice(0, 2).toUpperCase()
        return (
          <div
            key={company.id}
            className="flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white transition hover:border-blue-200 hover:shadow-sm"
          >
            <div className="relative h-16 bg-gradient-to-br from-blue-600 to-sky-500">
              {company.bannerUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={company.bannerUrl}
                  alt=""
                  className="h-full w-full object-cover"
                />
              )}
            </div>

            <div className="flex flex-1 flex-col p-4">
              <div className="-mt-10 mb-2">
                {company.logoUrl ? (
                  <div className="relative h-12 w-12 overflow-hidden rounded-xl border-2 border-white bg-white shadow">
                    <Image src={company.logoUrl} alt={company.name} fill className="object-cover" />
                  </div>
                ) : (
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl border-2 border-white bg-gradient-to-br from-blue-500 to-indigo-600 text-sm font-bold text-white shadow">
                    {initials}
                  </div>
                )}
              </div>

              <h3 className="font-semibold text-slate-900">{company.name}</h3>
              <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                <span className="rounded-full bg-slate-100 px-2 py-0.5">
                  {TIPO_LABEL[company.type] ?? company.type}
                </span>
                {company.ciudad && (
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="h-3 w-3" /> {company.ciudad}
                  </span>
                )}
              </div>

              <div className="mt-2 flex items-center gap-4 text-sm text-slate-600">
                <span className="inline-flex items-center gap-1.5">
                  <Gift className="h-4 w-4 text-rose-500" />
                  {company.activePromotionsCount} promos
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Users className="h-4 w-4 text-sky-500" />
                  {company.totalMembersCount} miembros
                </span>
              </div>

              <div className="mt-4 flex items-center gap-2 border-t border-slate-100 pt-3">
                <button
                  onClick={() => toggleSeguir(company)}
                  disabled={pending}
                  className={`inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold transition disabled:opacity-60 ${
                    siguiendo
                      ? 'border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  {pending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : siguiendo ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Plus className="h-4 w-4" />
                  )}
                  {siguiendo ? 'Siguiendo' : 'Seguir'}
                </button>
                <Link
                  href={`/empresas/${company.slug}`}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 transition hover:border-blue-200 hover:text-blue-700"
                >
                  Ver perfil <ExternalLink className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
