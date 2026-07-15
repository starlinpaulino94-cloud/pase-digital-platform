'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Gift, MapPin, Plus, Check, Loader2, ArrowRight, Users } from 'lucide-react'
import { toast } from 'sonner'
import { toggleSeguirEmpresa } from '@/modules/social/actions'
import { formatMoney } from '@/lib/format'
import { Button } from '@/components/ui/button'

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
  descripcion?: string | null
  totalMembersCount: number
  activePromotionsCount: number
  /** Plan activo más barato: ancla "desde $X/mes" de la tarjeta. */
  desdePlan?: { nombre: string; precio: number } | null
}

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
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {empresas.map((company) => {
        const siguiendo = seguidas.has(company.id)
        const pending = pendingId === company.id
        const initials = company.name.slice(0, 2).toUpperCase()

        return (
          <div
            key={company.id}
            className="group flex flex-col rounded-3xl border border-border/60 bg-card p-5 shadow-card transition-all duration-300 hover:-translate-y-1 hover:border-primary/20 hover:shadow-premium"
          >
            {/* Cabecera: logo cuadrado en color + nombre + precio ancla */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                {company.logoUrl ? (
                  <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-2xl shadow-card">
                    <Image src={company.logoUrl} alt="" fill sizes="48px" className="object-cover" />
                  </div>
                ) : (
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-info text-sm font-bold text-white shadow-card">
                    {initials}
                  </div>
                )}
                <div className="min-w-0">
                  <h3 className="truncate text-[15px] font-bold text-foreground">
                    {company.name}
                  </h3>
                  <p className="mt-0.5 flex items-center gap-1.5 truncate text-xs text-muted-foreground">
                    {TIPO_LABEL[company.type] ?? company.type}
                    {company.ciudad && (
                      <>
                        <span aria-hidden>·</span>
                        <MapPin className="h-3 w-3" aria-hidden /> {company.ciudad}
                      </>
                    )}
                  </p>
                </div>
              </div>
              {company.desdePlan && (
                <div className="shrink-0 text-right">
                  <p className="text-base font-extrabold tabular-nums text-primary">
                    {formatMoney(company.desdePlan.precio)}
                  </p>
                  <p className="text-[10px] font-medium text-muted-foreground">desde / mes</p>
                </div>
              )}
            </div>

            {/* Plan de entrada + descripción */}
            <div className="mt-4 min-h-[3.5rem]">
              {company.desdePlan && (
                <p className="text-sm font-semibold text-foreground">
                  {company.desdePlan.nombre}
                </p>
              )}
              {company.descripcion && (
                <p className="mt-0.5 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                  {company.descripcion}
                </p>
              )}
            </div>

            {/* Prueba social compacta */}
            <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <Gift className="h-3.5 w-3.5 text-success" aria-hidden />
                {company.activePromotionsCount} promos
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5 text-primary" aria-hidden />
                {company.totalMembersCount} miembros
              </span>
            </div>

            {/* CTA gigante + seguir */}
            <div className="mt-auto flex items-center gap-2 pt-5">
              <Button
                asChild
                className="min-h-12 flex-1 rounded-2xl bg-gradient-to-r from-primary to-sky-500 text-sm font-bold text-white shadow-md transition hover:opacity-95"
              >
                <Link href={`/cliente/empresas/${company.slug}`}>
                  Ver membresías <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
              <Button
                onClick={() => toggleSeguir(company)}
                disabled={pending}
                variant="outline"
                aria-label={siguiendo ? `Dejar de seguir ${company.name}` : `Seguir a ${company.name}`}
                className="min-h-12 shrink-0 rounded-2xl px-4"
              >
                {pending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : siguiendo ? (
                  <Check className="h-4 w-4 text-success" />
                ) : (
                  <Plus className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        )
      })}
    </div>
  )
}
