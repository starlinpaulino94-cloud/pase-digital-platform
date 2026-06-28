export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { getCustomerByUserId, getActivePass } from '@/modules/clientes/queries'
import { DigitalPassQR } from '@/components/customers/DigitalPassQR'
import { Badge } from '@/components/ui/badge'

export default async function PaseDigitalPage() {
  const session = await getSession()
  if (!session) redirect('/login')
  if (session.role !== 'CLIENTE') redirect('/dashboard')

  const customer = session.dbUserId
    ? await getCustomerByUserId(session.dbUserId)
    : null

  if (!customer) redirect('/profile')

  const pass = await getActivePass(customer.id)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-foreground">Mi Pase Digital</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">Muestra este código al empleado para validar tus beneficios</p>
      </div>

      {pass ? (
        <div className="relative overflow-hidden rounded-3xl bg-[oklch(0.155_0.028_264)] p-6 shadow-modal">
          {/* Decorative circles */}
          <div className="absolute -top-12 -right-12 w-40 h-40 rounded-full bg-[oklch(0.22_0.030_264)] opacity-60" />
          <div className="absolute -bottom-8 -left-8 w-28 h-28 rounded-full bg-[oklch(0.20_0.028_264)] opacity-40" />

          {/* Header */}
          <div className="relative flex items-center justify-between mb-8">
            <div>
              <p className="text-[oklch(0.55_0.012_264)] text-xs font-medium tracking-widest uppercase">PASE Digital</p>
              <p className="text-white text-xl font-bold mt-1">
                {customer.firstName} {customer.lastName}
              </p>
            </div>
            <Badge
              className={
                pass.isActive
                  ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                  : 'bg-red-500/20 text-red-400 border-red-500/30'
              }
            >
              {pass.isActive ? 'Activo' : 'Inactivo'}
            </Badge>
          </div>

          {/* QR */}
          <div className="relative flex justify-center mb-6">
            <div className="bg-white rounded-2xl p-4 shadow-modal">
              <DigitalPassQR token={pass.token} size={200} />
            </div>
          </div>

          {/* Footer info */}
          <div className="relative flex items-center justify-between text-[oklch(0.55_0.012_264)] text-xs">
            <div>
              <p className="font-medium text-[oklch(0.70_0.010_264)]">Token</p>
              <p className="font-mono mt-0.5">{pass.token.slice(0, 8).toUpperCase()}····</p>
            </div>
            <div className="text-right">
              <p className="font-medium text-[oklch(0.70_0.010_264)]">Desde</p>
              <p className="mt-0.5">{new Date(pass.createdAt).toLocaleDateString('es-DO', { month: 'short', year: 'numeric' })}</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center mb-4">
            <span className="text-2xl">🎟️</span>
          </div>
          <h3 className="text-base font-semibold text-foreground">Sin pase activo</h3>
          <p className="mt-1.5 text-sm text-muted-foreground max-w-xs">
            Todavía no tienes un pase digital. Contacta con la empresa para obtenerlo.
          </p>
        </div>
      )}

      {pass && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
          <p className="text-sm text-amber-800 font-medium">Consejo</p>
          <p className="text-xs text-amber-700 mt-0.5">
            Mantén la pantalla de tu dispositivo con brillo alto al mostrar el código QR.
          </p>
        </div>
      )}
    </div>
  )
}
