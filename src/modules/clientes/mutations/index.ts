import { randomBytes } from 'crypto'
import { prisma } from '@/lib/prisma'
import type { Customer, CustomerStatus, DigitalPass } from '../types'
import { writeAuditLog } from '@/modules/empresas/mutations'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = prisma as any

function placeholderSupabaseId(): string {
  return `00000000-0000-0000-0000-${randomBytes(6).toString('hex')}`
}

function generatePassToken(): string {
  return randomBytes(16).toString('hex') // 32-char hex
}

export async function createCustomer(params: {
  firstName: string
  lastName: string
  email: string
  phone?: string
  companyId?: string
  actorUserId?: string
}): Promise<Customer> {
  const { firstName, lastName, email, phone, companyId, actorUserId } = params

  const customer = await db.user.create({
    data: {
      supabaseId: placeholderSupabaseId(),
      email,
      name: `${firstName} ${lastName}`,
      phone: phone || null,
      role: 'CLIENTE',
      customer: {
        create: {
          firstName,
          lastName,
          phone: phone || null,
          status: 'ACTIVE',
        },
      },
    },
    include: {
      customer: {
        include: {
          user: { select: { id: true, email: true, name: true, phone: true, avatarUrl: true } },
          customerCompanies: {
            include: { company: { select: { id: true, name: true, industry: true } } },
          },
          digitalPasses: { where: { isActive: true }, take: 1 },
        },
      },
    },
  })

  const createdCustomer: Customer = customer.customer

  if (actorUserId) {
    await writeAuditLog({
      companyId,
      userId: actorUserId,
      event: 'CUSTOMER_CREATED',
      entityType: 'Customer',
      entityId: createdCustomer.id,
      payload: { email, firstName, lastName },
    })
  }

  // Auto-link to company if provided
  if (companyId) {
    await linkCustomerToCompany(createdCustomer.id, companyId, actorUserId)
  }

  // Auto-create digital pass
  await createDigitalPass(createdCustomer.id, actorUserId)

  return createdCustomer
}

export async function updateCustomer(
  customerId: string,
  data: { firstName?: string; lastName?: string; phone?: string },
  actorUserId?: string,
  companyId?: string
): Promise<Customer> {
  const updated = await db.$transaction(async (tx: typeof db) => {
    const customer = await tx.customer.update({
      where: { id: customerId },
      data: {
        ...(data.firstName !== undefined && { firstName: data.firstName }),
        ...(data.lastName !== undefined && { lastName: data.lastName }),
        ...(data.phone !== undefined && { phone: data.phone || null }),
      },
      include: {
        user: { select: { id: true, email: true, name: true, phone: true, avatarUrl: true } },
      },
    })

    if (data.firstName || data.lastName || data.phone) {
      const name = data.firstName || data.lastName
        ? `${data.firstName ?? customer.firstName} ${data.lastName ?? customer.lastName}`
        : undefined

      await tx.user.update({
        where: { id: customer.userId },
        data: {
          ...(name && { name }),
          ...(data.phone !== undefined && { phone: data.phone || null }),
        },
      })
    }

    return customer
  })

  if (actorUserId) {
    await writeAuditLog({
      companyId,
      userId: actorUserId,
      event: 'CUSTOMER_UPDATED',
      entityType: 'Customer',
      entityId: customerId,
      payload: data as Record<string, unknown>,
    })
  }

  return updated
}

export async function setCustomerStatus(
  customerId: string,
  status: CustomerStatus,
  actorUserId?: string,
  companyId?: string
): Promise<void> {
  await db.customer.update({ where: { id: customerId }, data: { status } })

  if (actorUserId) {
    await writeAuditLog({
      companyId,
      userId: actorUserId,
      event: `CUSTOMER_STATUS_CHANGED_TO_${status}`,
      entityType: 'Customer',
      entityId: customerId,
      payload: { status },
    })
  }
}

export async function linkCustomerToCompany(
  customerId: string,
  companyId: string,
  actorUserId?: string
): Promise<void> {
  await db.customerCompany.upsert({
    where: { customerId_companyId: { customerId, companyId } },
    create: { customerId, companyId, firstVisitAt: new Date() },
    update: {},
  })

  if (actorUserId) {
    await writeAuditLog({
      companyId,
      userId: actorUserId,
      event: 'CUSTOMER_LINKED_TO_COMPANY',
      entityType: 'CustomerCompany',
      entityId: `${customerId}:${companyId}`,
      payload: { customerId, companyId },
    })
  }
}

export async function createDigitalPass(
  customerId: string,
  actorUserId?: string
): Promise<DigitalPass> {
  // Deactivate any existing active pass first
  await db.digitalPass.updateMany({
    where: { customerId, isActive: true },
    data: { isActive: false, revokedAt: new Date(), revokedReason: 'regenerated' },
  })

  const pass = await db.digitalPass.create({
    data: {
      customerId,
      token: generatePassToken(),
      isActive: true,
      activatedAt: new Date(),
    },
  })

  if (actorUserId) {
    await writeAuditLog({
      userId: actorUserId,
      event: 'DIGITAL_PASS_CREATED',
      entityType: 'DigitalPass',
      entityId: pass.id,
      payload: { customerId },
    })
  }

  return pass
}

export async function revokeDigitalPass(
  passId: string,
  reason: string,
  actorUserId?: string
): Promise<void> {
  await db.digitalPass.update({
    where: { id: passId },
    data: { isActive: false, revokedAt: new Date(), revokedReason: reason },
  })

  if (actorUserId) {
    await writeAuditLog({
      userId: actorUserId,
      event: 'DIGITAL_PASS_BLOCKED',
      entityType: 'DigitalPass',
      entityId: passId,
      payload: { reason },
    })
  }
}

export async function regenerateDigitalPass(
  customerId: string,
  actorUserId?: string
): Promise<DigitalPass> {
  const pass = await createDigitalPass(customerId, actorUserId)

  if (actorUserId) {
    await writeAuditLog({
      userId: actorUserId,
      event: 'DIGITAL_PASS_REGENERATED',
      entityType: 'DigitalPass',
      entityId: pass.id,
      payload: { customerId },
    })
  }

  return pass
}
