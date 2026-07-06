import { notFound, redirect } from 'next/navigation'
import { getUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import Image from 'next/image'

export const metadata = {
  title: 'Detalles de Membresía',
}

export default async function MembershipDetail({ params }: { params: Promise<{ membresiaId: string }> }) {
  const { membresiaId } = await params
  const user = await getUser()
  if (!user || user.metadata.role !== 'CLIENTE') {
    redirect('/auth/login')
  }

  let membership = null
  try {
    membership = await prisma.membership.findUnique({
      where: { id: membresiaId },
      include: {
        cliente: {
          include: { company: true },
        },
        plan: true,
      },
    })
  } catch (error) {
    console.error('[membresia-detail] Error loading membership:', error)
    notFound()
  }

  if (!membership) {
    notFound()
  }

  // Verify ownership
  if (membership.cliente.supabaseId !== user.supabaseId) {
    notFound()
  }

  const now = new Date()
  const isActive = membership.estado === 'ACTIVA' && (!membership.fechaVencimiento || membership.fechaVencimiento > now)
  const estadoVariant = isActive ? 'default' : membership.estado === 'VENCIDA' ? 'destructive' : 'secondary'

  // Load visits for this membership
  const visits = await prisma.visit.findMany({
    where: { membershipId: membresiaId },
    include: { vehiculo: true },
    orderBy: { fechaVisita: 'desc' },
    take: 20,
  })

  // Load active QR
  const qrToken = await prisma.qrToken.findFirst({
    where: { membresiaId: membresiaId, activo: true },
    orderBy: { createdAt: 'desc' },
  })

  return (
    <main className="container max-w-2xl py-8">
      {/* Header */}
      <div className="mb-8">
        <Link href="/mis-membresias" className="text-sm text-muted-foreground hover:underline mb-4 block">
          ← Volver a mis membresías
        </Link>

        <div className="flex items-start gap-4 mb-6">
          {membership.cliente.company.logoUrl ? (
            <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded">
              <Image
                src={membership.cliente.company.logoUrl}
                alt={membership.cliente.company.name}
                fill
                className="object-cover"
              />
            </div>
          ) : (
            <div className="h-16 w-16 flex-shrink-0 rounded bg-muted flex items-center justify-center text-sm font-semibold">
              {membership.cliente.company.name.slice(0, 2).toUpperCase()}
            </div>
          )}
          <div>
            <h1 className="text-3xl font-bold">{membership.cliente.company.name}</h1>
            <p className="text-lg text-muted-foreground">{membership.plan.nombre}</p>
          </div>
        </div>

        {/* Estado */}
        <div className="flex items-center gap-4">
          <Badge variant={estadoVariant}>{membership.estado}</Badge>
          {membership.fechaVencimiento && (
            <span className="text-sm text-muted-foreground">
              {isActive ? 'Vence' : 'Venció'} el{' '}
              {format(membership.fechaVencimiento, 'd \'de\' MMMM \'de\' yyyy', { locale: es })}
            </span>
          )}
        </div>
      </div>

      {/* QR Section */}
      {qrToken && (
        <div className="border rounded-lg p-6 mb-8">
          <h2 className="font-semibold mb-4">Tu Código QR</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Muestra este código en la empresa para acceder a tus servicios
          </p>
          <div className="text-center p-4 bg-muted rounded">
            <code className="text-sm font-mono break-all">{qrToken.token}</code>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Se actualiza cada vez que usas tu membresía
          </p>
        </div>
      )}

      {/* Beneficios */}
      {membership.plan.beneficios && membership.plan.beneficios.length > 0 && (
        <div className="border rounded-lg p-6 mb-8">
          <h2 className="font-semibold mb-4">Beneficios del Plan</h2>
          <ul className="space-y-2">
            {membership.plan.beneficios.map((benefit, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="text-green-600 mt-1">✓</span>
                <span>{benefit}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Detalles */}
      <div className="border rounded-lg p-6 mb-8">
        <h2 className="font-semibold mb-4">Detalles de la Membresía</h2>
        <div className="space-y-3">
          {membership.fechaInicio && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Fecha de Inicio:</span>
              <span>{format(membership.fechaInicio, 'd \'de\' MMMM \'de\' yyyy', { locale: es })}</span>
            </div>
          )}
          {membership.fechaVencimiento && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Fecha de Vencimiento:</span>
              <span>{format(membership.fechaVencimiento, 'd \'de\' MMMM \'de\' yyyy', { locale: es })}</span>
            </div>
          )}
          {!membership.plan.esIlimitado && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Usos Restantes:</span>
              <span className="font-semibold">{membership.lavadosRestantes}</span>
            </div>
          )}
          {membership.plan.esIlimitado && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Tipo:</span>
              <span>Ilimitado</span>
            </div>
          )}
        </div>
      </div>

      {/* Historial de Visitas */}
      {visits.length > 0 && (
        <div className="border rounded-lg p-6">
          <h2 className="font-semibold mb-4">Historial de Visitas</h2>
          <div className="space-y-3">
            {visits.map((visit) => (
              <div key={visit.id} className="flex justify-between items-center text-sm border-b pb-3 last:border-b-0">
                <div>
                  <p className="font-medium">{visit.servicio}</p>
                  {visit.vehiculo && (
                    <p className="text-xs text-muted-foreground">
                      {visit.vehiculo.marca} {visit.vehiculo.modelo}
                    </p>
                  )}
                </div>
                <span className="text-muted-foreground">
                  {format(visit.fechaVisita, 'd/M/yyyy HH:mm', { locale: es })}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {visits.length === 0 && (
        <div className="border rounded-lg p-6 text-center text-muted-foreground">
          No hay visitas registradas aún
        </div>
      )}
    </main>
  )
}
