import { PrismaClient, UserRole, CompanyStatus, PromotionType, PromotionStatus, AssignmentStatus } from '@prisma/client'
import { randomBytes } from 'crypto'

const prisma = new PrismaClient()

function generateToken(): string {
  return randomBytes(16).toString('hex') // 32 hex chars
}

function fakeSupabaseId(): string {
  // Placeholder UUIDs — replace with real Supabase auth.users IDs in production
  return `00000000-0000-0000-0000-${randomBytes(6).toString('hex')}`
}

async function main() {
  console.log('🌱 Seeding PASE Digital Platform...')

  // ─── Clean existing data (dev only) ─────────────────────────
  await prisma.auditLog.deleteMany()
  await prisma.receipt.deleteMany()
  await prisma.validation.deleteMany()
  await prisma.promotionAssignment.deleteMany()
  await prisma.promotion.deleteMany()
  await prisma.digitalPass.deleteMany()
  await prisma.customerCompany.deleteMany()
  await prisma.companySettings.deleteMany()
  await prisma.employee.deleteMany()
  await prisma.customer.deleteMany()
  await prisma.branch.deleteMany()
  await prisma.company.deleteMany()
  await prisma.user.deleteMany()

  // ─── 1. Superadmin ──────────────────────────────────────────
  const superadmin = await prisma.user.create({
    data: {
      supabaseId: fakeSupabaseId(),
      email: 'superadmin@pasedigital.do',
      name: 'Super Admin',
      role: UserRole.SUPERADMIN,
    },
  })
  console.log('✅ Superadmin:', superadmin.email)

  // ─── 2. Companies ───────────────────────────────────────────
  const carwash = await prisma.company.create({
    data: {
      name: 'AutoSpa Premium',
      legalName: 'AutoSpa Premium SRL',
      industry: 'carwash',
      description: 'Servicio de lavado de autos premium',
      phone: '809-555-0101',
      email: 'info@autospa.do',
      address: 'Av. Winston Churchill 1234',
      city: 'Santo Domingo',
      status: CompanyStatus.ACTIVE,
      settings: {
        create: {
          requirePaymentConfirmation: false,
          allowMultipleActiveAssignments: true,
          defaultAssignmentDurationDays: 365,
        },
      },
    },
  })

  const restaurante = await prisma.company.create({
    data: {
      name: 'Sabor Criollo',
      legalName: 'Sabor Criollo SAS',
      industry: 'restaurante',
      description: 'Restaurante de comida típica dominicana',
      phone: '809-555-0202',
      email: 'info@saborcriollo.do',
      address: 'Calle El Conde 45',
      city: 'Santo Domingo',
      status: CompanyStatus.ACTIVE,
      settings: {
        create: {
          requirePaymentConfirmation: true,
          allowMultipleActiveAssignments: false,
          defaultAssignmentDurationDays: 180,
        },
      },
    },
  })
  console.log('✅ Companies:', carwash.name, '|', restaurante.name)

  // ─── 3. Branches ────────────────────────────────────────────
  const carwashBranch = await prisma.branch.create({
    data: {
      companyId: carwash.id,
      name: 'Sucursal Churchill',
      address: 'Av. Winston Churchill 1234, Santo Domingo',
      phone: '809-555-0101',
    },
  })

  const restauranteBranch = await prisma.branch.create({
    data: {
      companyId: restaurante.id,
      name: 'Sucursal El Conde',
      address: 'Calle El Conde 45, Zona Colonial',
      phone: '809-555-0202',
    },
  })
  console.log('✅ Branches created')

  // ─── 4. Admin users ─────────────────────────────────────────
  const adminCarwash = await prisma.user.create({
    data: {
      supabaseId: fakeSupabaseId(),
      email: 'admin@autospa.do',
      name: 'Admin AutoSpa',
      role: UserRole.ADMIN_EMPRESA,
      employee: {
        create: {
          companyId: carwash.id,
          branchId: carwashBranch.id,
          role: UserRole.ADMIN_EMPRESA,
        },
      },
    },
  })

  const adminRestaurante = await prisma.user.create({
    data: {
      supabaseId: fakeSupabaseId(),
      email: 'admin@saborcriollo.do',
      name: 'Admin Sabor Criollo',
      role: UserRole.ADMIN_EMPRESA,
      employee: {
        create: {
          companyId: restaurante.id,
          branchId: restauranteBranch.id,
          role: UserRole.ADMIN_EMPRESA,
        },
      },
    },
  })
  console.log('✅ Admins:', adminCarwash.email, '|', adminRestaurante.email)

  // ─── 5. Employees ───────────────────────────────────────────
  const empleadoCarwash = await prisma.user.create({
    data: {
      supabaseId: fakeSupabaseId(),
      email: 'empleado@autospa.do',
      name: 'Juan Empleado',
      role: UserRole.EMPLEADO,
      employee: {
        create: {
          companyId: carwash.id,
          branchId: carwashBranch.id,
          role: UserRole.EMPLEADO,
        },
      },
    },
  })

  const empleadoRestaurante = await prisma.user.create({
    data: {
      supabaseId: fakeSupabaseId(),
      email: 'empleado@saborcriollo.do',
      name: 'Maria Empleada',
      role: UserRole.EMPLEADO,
      employee: {
        create: {
          companyId: restaurante.id,
          branchId: restauranteBranch.id,
          role: UserRole.EMPLEADO,
        },
      },
    },
  })
  console.log('✅ Employees:', empleadoCarwash.email, '|', empleadoRestaurante.email)

  // ─── 6. Customers ───────────────────────────────────────────
  const userCliente1 = await prisma.user.create({
    data: {
      supabaseId: fakeSupabaseId(),
      email: 'cliente1@example.com',
      name: 'Carlos Martínez',
      phone: '809-555-1001',
      role: UserRole.CLIENTE,
      customer: {
        create: {
          firstName: 'Carlos',
          lastName: 'Martínez',
          phone: '809-555-1001',
        },
      },
    },
    include: { customer: true },
  })

  const userCliente2 = await prisma.user.create({
    data: {
      supabaseId: fakeSupabaseId(),
      email: 'cliente2@example.com',
      name: 'Ana Rodríguez',
      phone: '809-555-1002',
      role: UserRole.CLIENTE,
      customer: {
        create: {
          firstName: 'Ana',
          lastName: 'Rodríguez',
          phone: '809-555-1002',
        },
      },
    },
    include: { customer: true },
  })

  const cliente1 = userCliente1.customer!
  const cliente2 = userCliente2.customer!
  console.log('✅ Customers:', userCliente1.email, '|', userCliente2.email)

  // ─── 7. CustomerCompany relationships ───────────────────────
  await prisma.customerCompany.createMany({
    data: [
      { customerId: cliente1.id, companyId: carwash.id, totalVisits: 5 },
      { customerId: cliente1.id, companyId: restaurante.id, totalVisits: 2 },
      { customerId: cliente2.id, companyId: carwash.id, totalVisits: 1 },
    ],
  })
  console.log('✅ CustomerCompany relations created')

  // ─── 8. Digital Passes ──────────────────────────────────────
  const pass1 = await prisma.digitalPass.create({
    data: {
      customerId: cliente1.id,
      token: generateToken(),
      isActive: true,
      activatedAt: new Date(),
    },
  })

  const pass2 = await prisma.digitalPass.create({
    data: {
      customerId: cliente2.id,
      token: generateToken(),
      isActive: true,
      activatedAt: new Date(),
    },
  })
  console.log('✅ Digital Passes created')

  // ─── 9. Promotions ──────────────────────────────────────────
  // Carwash: plan + visit-based
  const planCarwash = await prisma.promotion.create({
    data: {
      companyId: carwash.id,
      name: 'Plan Mensual Oro',
      description: 'Lavados ilimitados por un mes',
      type: PromotionType.PLAN,
      status: PromotionStatus.ACTIVE,
      config: {
        durationDays: 30,
        maxWashesPerMonth: null, // unlimited
        price: 1500,
        currency: 'DOP',
      },
      startsAt: new Date(),
      createdById: adminCarwash.id,
    },
  })

  const visitasCarwash = await prisma.promotion.create({
    data: {
      companyId: carwash.id,
      name: 'Tarjeta de 10 Lavados',
      description: 'Compra 10 lavados y el 11vo es gratis',
      type: PromotionType.VISIT_BASED,
      status: PromotionStatus.ACTIVE,
      config: {
        visitsRequired: 10,
        rewardDescription: 'Lavado gratis',
        price: 1200,
        currency: 'DOP',
      },
      createdById: adminCarwash.id,
    },
  })

  // Restaurante: discount + membership
  const descuentoRestaurante = await prisma.promotion.create({
    data: {
      companyId: restaurante.id,
      name: '20% en Almuerzo',
      description: '20% de descuento en todos los platos del almuerzo',
      type: PromotionType.DISCOUNT,
      status: PromotionStatus.ACTIVE,
      config: {
        discountPercent: 20,
        applicableTo: 'lunch',
        maxDiscountAmount: 500,
        currency: 'DOP',
      },
      startsAt: new Date(),
      createdById: adminRestaurante.id,
    },
  })

  const membresiaRestaurante = await prisma.promotion.create({
    data: {
      companyId: restaurante.id,
      name: 'Club VIP Sabor Criollo',
      description: 'Membresía anual con beneficios exclusivos',
      type: PromotionType.MEMBERSHIP,
      status: PromotionStatus.ACTIVE,
      config: {
        durationDays: 365,
        benefits: ['descuento_20', 'postre_gratis', 'reserva_prioritaria'],
        price: 3000,
        currency: 'DOP',
      },
      createdById: adminRestaurante.id,
    },
  })
  console.log('✅ Promotions created (4 total)')

  // ─── 10. Promotion Assignments ──────────────────────────────
  const now = new Date()
  const oneYearLater = new Date(now.getFullYear() + 1, now.getMonth(), now.getDate())
  const thirtyDaysLater = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)

  const assignmentPlanCliente1 = await prisma.promotionAssignment.create({
    data: {
      customerId: cliente1.id,
      promotionId: planCarwash.id,
      companyId: carwash.id,
      status: AssignmentStatus.ACTIVE,
      paymentConfirmed: true,
      paymentConfirmedAt: now,
      paymentAmount: 1500,
      startedAt: now,
      expiresAt: thirtyDaysLater,
    },
  })

  const assignmentVisitasCliente1 = await prisma.promotionAssignment.create({
    data: {
      customerId: cliente1.id,
      promotionId: visitasCarwash.id,
      companyId: carwash.id,
      status: AssignmentStatus.ACTIVE,
      usesAllowed: 10,
      usesConsumed: 3,
      progress: 3,
      progressTarget: 10,
      paymentConfirmed: true,
      paymentConfirmedAt: now,
      paymentAmount: 1200,
      startedAt: now,
    },
  })

  await prisma.promotionAssignment.create({
    data: {
      customerId: cliente1.id,
      promotionId: membresiaRestaurante.id,
      companyId: restaurante.id,
      status: AssignmentStatus.PENDING_PAYMENT,
      paymentConfirmed: false,
    },
  })

  await prisma.promotionAssignment.create({
    data: {
      customerId: cliente2.id,
      promotionId: descuentoRestaurante.id,
      companyId: restaurante.id,
      status: AssignmentStatus.ACTIVE,
      paymentConfirmed: true,
      paymentConfirmedAt: now,
      startedAt: now,
      expiresAt: oneYearLater,
    },
  })
  console.log('✅ Promotion Assignments created (4 total)')

  // ─── 11. Sample Validation (confirmed) ──────────────────────
  const empleadoRecord = await prisma.employee.findFirst({
    where: { companyId: carwash.id, role: UserRole.EMPLEADO },
  })

  const validation = await prisma.validation.create({
    data: {
      digitalPassId: pass1.id,
      customerId: cliente1.id,
      promotionAssignmentId: assignmentVisitasCliente1.id,
      companyId: carwash.id,
      branchId: carwashBranch.id,
      employeeId: empleadoCarwash.id,
      employeeRecordId: empleadoRecord?.id,
      status: 'CONFIRMED',
      scannedAt: now,
      evaluatedAt: now,
      confirmedAt: now,
    },
  })

  await prisma.receipt.create({
    data: {
      validationId: validation.id,
      customerId: cliente1.id,
      promotionAssignmentId: assignmentVisitasCliente1.id,
      companyId: carwash.id,
      status: 'ISSUED',
      issuedAt: now,
    },
  })
  console.log('✅ Sample validation + receipt created')

  // ─── 12. Audit log entries ───────────────────────────────────
  await prisma.auditLog.createMany({
    data: [
      {
        companyId: carwash.id,
        userId: adminCarwash.id,
        event: 'PROMOTION_CREATED',
        entityType: 'Promotion',
        entityId: planCarwash.id,
        payload: { name: planCarwash.name, type: planCarwash.type },
      },
      {
        companyId: carwash.id,
        userId: empleadoCarwash.id,
        event: 'VALIDATION_CONFIRMED',
        entityType: 'Validation',
        entityId: validation.id,
        payload: { customerId: cliente1.id, assignmentId: assignmentVisitasCliente1.id },
      },
    ],
  })
  console.log('✅ Audit logs created')

  console.log('\n🎉 Seed complete!')
  console.log('─'.repeat(50))
  console.log(`  Superadmin : ${superadmin.email}`)
  console.log(`  Admin (carwash): ${adminCarwash.email}`)
  console.log(`  Admin (rest.)  : ${adminRestaurante.email}`)
  console.log(`  Cliente 1  : ${userCliente1.email}  pass: ${pass1.token.slice(0, 8)}...`)
  console.log(`  Cliente 2  : ${userCliente2.email}  pass: ${pass2.token.slice(0, 8)}...`)
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
