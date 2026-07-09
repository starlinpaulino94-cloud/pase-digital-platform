/**
 * Limpieza de base de datos: elimina TODOS los datos excepto el superadmin.
 *
 * Uso:
 *   npx tsx scripts/cleanup-all-except-superadmin.ts
 *
 * Requiere: DATABASE_URL en .env o .env.local
 */
import { PrismaClient } from '@prisma/client'

const SUPERADMIN_EMAIL = 'starlin.eltanquemotors@gmail.com'

async function main() {
  const prisma = new PrismaClient()

  try {
    const superadmin = await prisma.user.findFirst({
      where: { email: SUPERADMIN_EMAIL, role: 'SUPERADMIN' },
    })

    if (!superadmin) {
      console.error(`ERROR: Superadmin ${SUPERADMIN_EMAIL} no encontrado. Abortando.`)
      process.exit(1)
    }

    console.log(`Superadmin encontrado: ${superadmin.name} (${superadmin.id})`)
    console.log(`Company asociada: ${superadmin.companyId ?? 'ninguna'}`)
    console.log('')

    const usersBefore = await prisma.user.count()
    const companiesBefore = await prisma.company.count()
    const clientesBefore = await prisma.cliente.count()

    console.log(`Estado actual:`)
    console.log(`  Usuarios: ${usersBefore}`)
    console.log(`  Empresas: ${companiesBefore}`)
    console.log(`  Clientes: ${clientesBefore}`)
    console.log('')
    console.log('Iniciando limpieza...')

    await prisma.$transaction(async (tx) => {
      // 1. Tablas sin dependencias descendentes (hojas del árbol)
      console.log('  Eliminando user_intereses...')
      await tx.userInteres.deleteMany({})

      console.log('  Eliminando promociones_guardadas...')
      await tx.promocionGuardada.deleteMany({})

      console.log('  Eliminando company_follows...')
      await tx.companyFollow.deleteMany({})

      console.log('  Eliminando company_ratings...')
      await tx.companyRating.deleteMany({})

      console.log('  Eliminando company_to_categories...')
      await tx.companyToCategory.deleteMany({})

      console.log('  Eliminando notificaciones...')
      await tx.notificacion.deleteMany({})

      console.log('  Eliminando audit_logs...')
      await tx.auditLog.deleteMany({})

      console.log('  Eliminando invitaciones...')
      await tx.invitacion.deleteMany({})

      console.log('  Eliminando cliente_notas...')
      await tx.clienteNota.deleteMany({})

      console.log('  Eliminando referral_events...')
      await tx.referralEvent.deleteMany({})

      console.log('  Eliminando referidos...')
      await tx.referido.deleteMany({})

      console.log('  Eliminando reglas_recompensa...')
      await tx.reglaRecompensa.deleteMany({})

      console.log('  Eliminando faq_items...')
      await tx.faqItem.deleteMany({})

      // 2. Tickets (mensajes → tickets)
      console.log('  Eliminando ticket_mensajes...')
      await tx.ticketMensaje.deleteMany({})

      console.log('  Eliminando support_tickets...')
      await tx.supportTicket.deleteMany({})

      // 3. Visitas y comprobantes
      console.log('  Eliminando comprobantes...')
      await tx.comprobante.deleteMany({})

      console.log('  Eliminando visits...')
      await tx.visit.deleteMany({})

      // 4. QR tokens
      console.log('  Eliminando qr_tokens...')
      await tx.qrToken.deleteMany({})

      // 5. Membresías
      console.log('  Eliminando memberships...')
      await tx.membership.deleteMany({})

      // 6. Vehículos
      console.log('  Eliminando vehiculos...')
      await tx.vehiculo.deleteMany({})

      // 7. Clientes
      console.log('  Eliminando clientes...')
      await tx.cliente.deleteMany({})

      // 8. Promociones y publicaciones
      console.log('  Eliminando promociones...')
      await tx.promocion.deleteMany({})

      console.log('  Eliminando company_posts...')
      await tx.companyPost.deleteMany({})

      console.log('  Eliminando campanas...')
      await tx.campana.deleteMany({})

      // 9. Planes
      console.log('  Eliminando plans...')
      await tx.plan.deleteMany({})

      // 10. Configuraciones de empresa
      console.log('  Eliminando whatsapp_config...')
      await tx.whatsAppConfig.deleteMany({})

      console.log('  Eliminando metodos_pago...')
      await tx.metodoPago.deleteMany({})

      console.log('  Eliminando sucursales...')
      await tx.sucursal.deleteMany({})

      // 11. Usuarios (todos excepto superadmin)
      console.log('  Eliminando usuarios (excepto superadmin)...')
      await tx.user.deleteMany({
        where: { NOT: { id: superadmin.id } },
      })

      // 12. Empresas (todas)
      console.log('  Eliminando empresas...')
      // Desasociar superadmin de empresa antes de borrar
      await tx.user.update({
        where: { id: superadmin.id },
        data: { companyId: null },
      })
      await tx.company.deleteMany({})
    })

    // Verificación
    const usersAfter = await prisma.user.count()
    const companiesAfter = await prisma.company.count()
    const clientesAfter = await prisma.cliente.count()
    const membershipsAfter = await prisma.membership.count()

    console.log('')
    console.log('=== RESULTADO ===')
    console.log(`  Usuarios restantes: ${usersAfter}`)
    console.log(`  Empresas restantes: ${companiesAfter}`)
    console.log(`  Clientes restantes: ${clientesAfter}`)
    console.log(`  Membresías restantes: ${membershipsAfter}`)

    if (usersAfter === 1) {
      const remaining = await prisma.user.findFirst()
      console.log(`  Usuario: ${remaining?.email} (${remaining?.role})`)
      console.log('')
      console.log('Limpieza completada exitosamente.')
    } else {
      console.error('ERROR: Se esperaba exactamente 1 usuario.')
      process.exit(1)
    }
  } finally {
    await prisma.$disconnect()
  }
}

main().catch((err) => {
  console.error('Error fatal:', err)
  process.exit(1)
})
