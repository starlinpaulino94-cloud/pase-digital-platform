import Link from 'next/link'
import { requireRole } from '@/lib/auth/guards'
import { getRegalosCliente } from '@/modules/regalos/queries'
import { RegaloRecibidoCard, RegaloEnviadoCard } from '@/components/regalos/RegaloCards'
import { EmptyState } from '@/components/ui/empty-state'
import { Button } from '@/components/ui/button'
import { Gift, Send } from 'lucide-react'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Regalos' }

/**
 * Regalos P2P · Fase R2 — centro de regalos del cliente: recibidos (aceptar/
 * rechazar antes de que expiren) y enviados (con cancelar si sigue pendiente).
 */
export default async function RegalosPage() {
  const user = await requireRole('CLIENTE')
  const clienteId = user.metadata.clienteId
  if (!clienteId) {
    return (
      <p className="text-muted-foreground">Tu cuenta no está vinculada a una empresa.</p>
    )
  }

  const { recibidos, enviados } = await getRegalosCliente(clienteId).catch(() => ({
    recibidos: [],
    enviados: [],
    pendientesRecibidos: 0,
  }))

  return (
    <div className="space-y-6 animate-fade-up">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-h1 text-foreground">Regalos</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Envía lavados a tus amigos o acepta los que te enviaron.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline" className="gap-2">
            <Link href="/cliente/regalos/regalar">
              <Gift className="h-4 w-4" /> Regalar promo o membresía
            </Link>
          </Button>
          <Button asChild className="gap-2">
            <Link href="/cliente/regalos/enviar">
              <Send className="h-4 w-4" /> Transferir mis usos
            </Link>
          </Button>
        </div>
      </header>

      {recibidos.length === 0 && enviados.length === 0 ? (
        <EmptyState
          icon={<Gift className="h-7 w-7" />}
          title="Aún no tienes regalos"
          description="Comparte tu @ID MembeGo (está en tu perfil) para recibir, o envía tus usos a un amigo."
        />
      ) : (
        <>
          {recibidos.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                Recibidos
              </h2>
              {recibidos.map((r) => (
                <RegaloRecibidoCard key={r.id} regalo={r} />
              ))}
            </section>
          )}
          {enviados.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                Enviados
              </h2>
              {enviados.map((r) => (
                <RegaloEnviadoCard key={r.id} regalo={r} />
              ))}
            </section>
          )}
        </>
      )}
    </div>
  )
}
