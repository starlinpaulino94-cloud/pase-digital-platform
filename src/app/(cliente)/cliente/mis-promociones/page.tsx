import Link from 'next/link'
import { ChevronRight, Ticket, Clock, History, Sparkles } from 'lucide-react'
import { requireRole } from '@/lib/auth/guards'
import { prisma } from '@/lib/prisma'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { compraEstadoUi } from '@/components/cliente/compra-estado'

export const dynamic = 'force-dynamic'

const PENDIENTES = ['SOLICITADA', 'PENDIENTE_PAGO', 'EN_VALIDACION', 'APROBADA', 'RECHAZADA']

function fmtFecha(d: Date) {
  return new Intl.DateTimeFormat('es-DO', { dateStyle: 'medium' }).format(d)
}

interface CompraItem {
  id: string
  estado: string
  usosRestantes: number
  createdAt: Date
  promocion: { titulo: string; imagenUrl: string | null; tipo: string } | null
  company: { name: string }
}

function Item({ compra }: { compra: CompraItem }) {
  const ui = compraEstadoUi(compra.estado)
  return (
    <Link
      href={`/cliente/mis-promociones/${compra.id}`}
      className="flex items-center gap-3 px-5 py-4 transition-colors hover:bg-muted/50"
    >
      {compra.promocion?.imagenUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={compra.promocion.imagenUrl}
          alt=""
          className="h-12 w-12 shrink-0 rounded-lg object-cover"
        />
      ) : (
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary/10">
          <Ticket className="h-5 w-5 text-primary" />
        </div>
      )}
      <div className="min-w-0 flex-1">
        <p className="truncate font-semibold text-foreground">
          {compra.promocion?.titulo ?? 'Promoción'}
        </p>
        <p className="text-xs text-muted-foreground">
          {compra.company.name} · {fmtFecha(compra.createdAt)}
          {compra.estado === 'ACTIVA' && (
            <> · {compra.usosRestantes} uso{compra.usosRestantes !== 1 ? 's' : ''} restante{compra.usosRestantes !== 1 ? 's' : ''}</>
          )}
        </p>
      </div>
      <Badge variant={ui.badge} className="shrink-0 text-[10px]">
        {ui.label}
      </Badge>
      <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
    </Link>
  )
}

function Section({
  titulo,
  icon: Icon,
  items,
}: {
  titulo: string
  icon: typeof Ticket
  items: CompraItem[]
}) {
  if (items.length === 0) return null
  return (
    <div className="space-y-2">
      <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
        <Icon className="h-4 w-4" /> {titulo}
      </h2>
      <Card>
        <CardContent className="p-0">
          <div className="divide-y divide-border/60">
            {items.map((c) => (
              <Item key={c.id} compra={c} />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default async function MisPromocionesPage() {
  const user = await requireRole('CLIENTE')
  const clienteId = user.metadata.clienteId
  if (!clienteId) return <p className="text-muted-foreground">No autorizado.</p>

  const compras = await prisma.productoCompra
    .findMany({
      where: { clienteId },
      include: {
        promocion: { select: { titulo: true, imagenUrl: true, tipo: true } },
        company: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    })
    .catch(() => [])

  const activas = compras.filter((c) => c.estado === 'ACTIVA')
  const pendientes = compras.filter((c) => PENDIENTES.includes(c.estado))
  const historial = compras.filter(
    (c) => !PENDIENTES.includes(c.estado) && c.estado !== 'ACTIVA'
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Mis promociones</h1>
        <p className="text-muted-foreground">
          Tus promociones adquiridas: activas, pendientes de pago e historial.
        </p>
      </div>

      {compras.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center text-muted-foreground">
            <Sparkles className="mx-auto mb-3 h-10 w-10 text-muted-foreground/40" />
            <p className="font-medium">Aún no has adquirido promociones</p>
            <p className="mt-1 text-sm">
              Explora las promociones disponibles y adquiere la que te convenga.
            </p>
            <Button asChild className="mt-5">
              <Link href="/cliente/promociones">Ver promociones</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <Section titulo="Activas" icon={Ticket} items={activas} />
          <Section titulo="Pendientes" icon={Clock} items={pendientes} />
          <Section titulo="Historial" icon={History} items={historial} />
        </>
      )}
    </div>
  )
}
