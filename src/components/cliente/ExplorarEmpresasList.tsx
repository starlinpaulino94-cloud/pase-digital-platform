'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Gift, MapPin, Plus, Check, Loader2, ArrowRight, Users } from 'lucide-react'
import { toast } from 'sonner'
import { toggleSeguirEmpresa } from '@/modules/social/actions'
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
  totalMembersCount: number
  activePromotionsCount: number
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
            className="group flex flex-col overflow-hidden rounded-2xl border border-border/70 bg-card shadow-card transition-all hover:-translate-y-0.5 hover:border-primary/20 hover:shadow-premium"
          >
            {/* Banner */}
            <div className="relative h-20 overflow-hidden bg-gradient-to-br from-primary/80 to-info/70">
              {company.bannerUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={company.bannerUrl}
                  alt=""
                  className="h-full w-full object-cover transition group-hover:scale-105"
                />
              )}
              {/* Gradient overlay for text legibility */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
            </div>

            <div className="flex flex-1 flex-col p-4 pt-0">
              {/* Logo — overlapping banner */}
              <div className="-mt-7 mb-3">
                {company.logoUrl ? (
                  <div className="relative h-14 w-14 overflow-hidden rounded-2xl border-[3px] border-card bg-card shadow-card">
                    <Image src={company.logoUrl} alt={company.name} fill className="object-cover" />
                  </div>
                ) : (
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl border-[3px] border-card bg-gradient-to-br from-primary to-info text-sm font-bold text-white shadow-card">
                    {initials}
                  </div>
                )}
              </div>

              {/* Company name */}
              <h3 className="text-base font-bold text-foreground">{company.name}</h3>

              {/* Type + location */}
              <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                <span className="rounded-lg bg-muted px-2 py-0.5 font-medium">
                  {TIPO_LABEL[company.type] ?? company.type}
                </span>
                {company.ciudad && (
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="h-3 w-3" /> {company.ciudad}
                  </span>
                )}
              </div>

              {/* Stats */}
              <div className="mt-3 flex items-center gap-4">
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-success/10">
                    <Gift className="h-3.5 w-3.5 text-success" />
                  </span>
                  <span className="font-medium">{company.activePromotionsCount}</span>
                  <span className="hidden sm:inline">promos</span>
                </div>
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-primary/10">
                    <Users className="h-3.5 w-3.5 text-primary" />
                  </span>
                  <span className="font-medium">{company.totalMembersCount}</span>
                  <span className="hidden sm:inline">miembros</span>
                </div>
              </div>

              {/* Actions */}
              <div className="mt-auto flex items-center gap-2 pt-4">
                <Button
                  onClick={() => toggleSeguir(company)}
                  disabled={pending}
                  variant={siguiendo ? 'outline' : 'default'}
                  size="sm"
                  className="flex-1"
                >
                  {pending ? (
                    <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                  ) : siguiendo ? (
                    <Check className="mr-1.5 h-3.5 w-3.5" />
                  ) : (
                    <Plus className="mr-1.5 h-3.5 w-3.5" />
                  )}
                  {siguiendo ? 'Siguiendo' : 'Seguir'}
                </Button>
                <Button asChild variant="ghost" size="sm" className="text-muted-foreground">
                  <Link href={`/cliente/empresas/${company.slug}`}>
                    Ver perfil <ArrowRight className="ml-1 h-3.5 w-3.5" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
