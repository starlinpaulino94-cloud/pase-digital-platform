import Link from 'next/link'
import { ADMIN_ROLES } from '@/types'
import { requireRole } from '@/lib/auth/guards'
import { prisma } from '@/lib/prisma'
import { ALL_PLAYBOOKS, type AutomationPlaybook, type PlaybookCategory } from '@/lib/automation'
import {
  CATEGORIA_LABELS,
  CATEGORIA_DESCRIPCION,
  CATEGORIAS_ORDEN,
  COMPLEJIDAD_LABELS,
  ESTADO_LABELS,
  ESTADO_BADGE,
} from '@/modules/admin/estrategiasUi'
import {
  PublicarEstrategiaButton,
  PausarEstrategiaButton,
  ArchivarEstrategiaButton,
} from '@/components/admin/EstrategiaAcciones'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Sparkles,
  CheckCircle2,
  ChevronRight,
  AlertCircle,
  Zap,
  Target,
} from 'lucide-react'

export const dynamic = 'force-dynamic'

/**
 * Marketplace de Estrategias: biblioteca de los 180 Automation Playbooks
 * (E1.1–E1.10) instalables por la empresa sin escribir código. La pestaña
 * "Instaladas" administra las automatizaciones creadas desde la biblioteca
 * (activar/pausar/desinstalar) sobre el Automation Engine real.
 */
export default async function EstrategiasPage({
  searchParams,
}: {
  searchParams: Promise<{ categoria?: string; vista?: string }>
}) {
  const user = await requireRole(ADMIN_ROLES)
  const companyId = user.metadata.companyId
  const { categoria, vista } = await searchParams

  if (!companyId) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-slate-900">Estrategias</h1>
        <Card>
          <CardContent className="py-12 text-center text-slate-500">
            <AlertCircle className="mx-auto mb-3 h-8 w-8 text-slate-300" />
            Esta vista es por empresa. Selecciona una empresa activa para usar el
            marketplace de estrategias.
          </CardContent>
        </Card>
      </div>
    )
  }

  // Instalaciones vivas de esta empresa (las archivadas no cuentan).
  const instaladas = await prisma.automation.findMany({
    where: {
      companyId,
      templateKey: { startsWith: 'playbook.' },
      status: { not: 'ARCHIVED' },
    },
    select: { id: true, nombre: true, templateKey: true, status: true, createdAt: true },
    orderBy: { createdAt: 'desc' },
  })
  const instaladaPorPlaybook = new Map(
    instaladas.map((a) => [a.templateKey!.replace('playbook.', ''), a])
  )
  const activas = instaladas.filter((a) => a.status === 'PUBLISHED').length

  const categoriaActiva = (CATEGORIAS_ORDEN as string[]).includes(categoria ?? '')
    ? (categoria as PlaybookCategory)
    : null
  const visibles = categoriaActiva
    ? ALL_PLAYBOOKS.filter((p) => p.category === categoriaActiva)
    : ALL_PLAYBOOKS
  const mostrarInstaladas = vista === 'instaladas'

  return (
    <div className="space-y-6">
      {/* Encabezado + métricas */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-slate-900">
            <Sparkles className="h-6 w-6 text-primary" />
            Estrategias
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Biblioteca de estrategias comerciales listas para instalar: elige una,
            actívala y el sistema la ejecuta por ti.
          </p>
        </div>
        <div className="flex gap-3">
          <div className="rounded-lg border bg-white px-4 py-2 text-center">
            <p className="text-lg font-bold text-slate-900">{ALL_PLAYBOOKS.length}</p>
            <p className="text-xs text-slate-500">disponibles</p>
          </div>
          <div className="rounded-lg border bg-white px-4 py-2 text-center">
            <p className="text-lg font-bold text-slate-900">{instaladas.length}</p>
            <p className="text-xs text-slate-500">instaladas</p>
          </div>
          <div className="rounded-lg border bg-white px-4 py-2 text-center">
            <p className="text-lg font-bold text-emerald-600">{activas}</p>
            <p className="text-xs text-slate-500">activas</p>
          </div>
        </div>
      </div>

      {/* Pestañas: Biblioteca / Instaladas */}
      <div className="flex gap-2 border-b">
        <Link
          href="/admin/estrategias"
          className={`-mb-px border-b-2 px-3 py-2 text-sm font-medium ${
            !mostrarInstaladas
              ? 'border-primary text-primary'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          Biblioteca
        </Link>
        <Link
          href="/admin/estrategias?vista=instaladas"
          className={`-mb-px border-b-2 px-3 py-2 text-sm font-medium ${
            mostrarInstaladas
              ? 'border-primary text-primary'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          Instaladas ({instaladas.length})
        </Link>
      </div>

      {mostrarInstaladas ? (
        <InstaladasLista instaladas={instaladas} />
      ) : (
        <>
          {/* Filtro por categoría */}
          <div className="flex flex-wrap gap-2">
            <Link href="/admin/estrategias">
              <Badge
                variant={categoriaActiva === null ? 'default' : 'outline'}
                className="cursor-pointer"
              >
                Todas ({ALL_PLAYBOOKS.length})
              </Badge>
            </Link>
            {CATEGORIAS_ORDEN.map((cat) => {
              const n = ALL_PLAYBOOKS.filter((p) => p.category === cat).length
              return (
                <Link key={cat} href={`/admin/estrategias?categoria=${cat}`}>
                  <Badge
                    variant={categoriaActiva === cat ? 'default' : 'outline'}
                    className="cursor-pointer"
                  >
                    {CATEGORIA_LABELS[cat]} ({n})
                  </Badge>
                </Link>
              )
            })}
          </div>

          {categoriaActiva ? (
            <p className="text-sm text-slate-500">{CATEGORIA_DESCRIPCION[categoriaActiva]}</p>
          ) : null}

          {/* Grid de playbooks */}
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {visibles.map((p) => (
              <PlaybookCard
                key={p.id}
                playbook={p}
                instalada={instaladaPorPlaybook.get(p.id)?.status ?? null}
              />
            ))}
          </div>
        </>
      )}
    </div>
  )
}

function PlaybookCard({
  playbook,
  instalada,
}: {
  playbook: AutomationPlaybook
  instalada: string | null
}) {
  return (
    <Link href={`/admin/estrategias/${playbook.id}`} className="group">
      <Card className="h-full transition-shadow hover:shadow-md">
        <CardContent className="flex h-full flex-col gap-3 p-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="font-mono text-[10px]">
                {playbook.id}
              </Badge>
              <Badge variant="secondary" className="text-[10px]">
                {CATEGORIA_LABELS[playbook.category]}
              </Badge>
            </div>
            {instalada ? (
              <span
                className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${ESTADO_BADGE[instalada] ?? ''}`}
              >
                <CheckCircle2 className="h-3 w-3" />
                {ESTADO_LABELS[instalada] ?? instalada}
              </span>
            ) : null}
          </div>

          <div className="flex-1">
            <h3 className="font-semibold text-slate-900 group-hover:text-primary">
              {playbook.name}
            </h3>
            <p className="mt-1 line-clamp-2 text-sm text-slate-500">{playbook.objective}</p>
          </div>

          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="inline-flex items-center gap-1">
              <Target className="h-3.5 w-3.5" />
              {COMPLEJIDAD_LABELS[playbook.complexity]}
            </span>
            <span className="inline-flex items-center gap-1">
              <Zap className="h-3.5 w-3.5" />
              {playbook.engines.length} motores
            </span>
            <span className="inline-flex items-center gap-1 font-medium text-primary">
              Ver detalle <ChevronRight className="h-3.5 w-3.5" />
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}

function InstaladasLista({
  instaladas,
}: {
  instaladas: {
    id: string
    nombre: string
    templateKey: string | null
    status: string
    createdAt: Date
  }[]
}) {
  if (instaladas.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-slate-500">
          <Sparkles className="mx-auto mb-3 h-8 w-8 text-slate-300" />
          Aún no has instalado ninguna estrategia. Explora la biblioteca y elige la
          primera.
        </CardContent>
      </Card>
    )
  }

  const fmt = new Intl.DateTimeFormat('es-DO', {
    timeZone: 'America/Santo_Domingo',
    dateStyle: 'medium',
  })

  return (
    <div className="space-y-3">
      {instaladas.map((a) => {
        const playbookId = a.templateKey?.replace('playbook.', '') ?? ''
        return (
          <Card key={a.id}>
            <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="font-mono text-[10px]">
                    {playbookId}
                  </Badge>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${ESTADO_BADGE[a.status] ?? ''}`}
                  >
                    {ESTADO_LABELS[a.status] ?? a.status}
                  </span>
                </div>
                <p className="mt-1 truncate font-medium text-slate-900">{a.nombre}</p>
                <p className="text-xs text-slate-400">
                  Instalada el {fmt.format(new Date(a.createdAt))}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {a.status !== 'PUBLISHED' ? (
                  <PublicarEstrategiaButton id={a.id} nombre={a.nombre} />
                ) : (
                  <PausarEstrategiaButton id={a.id} nombre={a.nombre} />
                )}
                <ArchivarEstrategiaButton id={a.id} nombre={a.nombre} />
                {playbookId ? (
                  <Link
                    href={`/admin/estrategias/${playbookId}`}
                    className="text-xs font-medium text-primary hover:underline"
                  >
                    Ver detalle
                  </Link>
                ) : null}
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
