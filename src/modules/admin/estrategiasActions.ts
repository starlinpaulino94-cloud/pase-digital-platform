'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { requireSection } from '@/lib/auth/guards'
import { resolveCompanyId } from '@/lib/auth/company-context'
import {
  AutomationService,
  PrismaAutomationRepository,
  getPlaybook,
  playbookToCreateData,
} from '@/lib/automation'
import type { SessionUser } from '@/types'

/**
 * Marketplace de Estrategias (Automation Playbooks). Instala/publica/pausa/
 * archiva automatizaciones de la biblioteca (180 playbooks) para la empresa
 * activa. Reutiliza el Automation Engine real (tablas automations/…): instalar
 * crea la automatización en DRAFT; publicarla la deja lista para el bus de
 * eventos. Multi-tenant por companyId; superadmin usa la empresa activa.
 */

export interface EstrategiaState {
  error?: string
  success?: boolean
}

function service() {
  return new AutomationService(new PrismaAutomationRepository(prisma))
}

function revalidateEstrategias() {
  revalidatePath('/admin/estrategias')
}

/** La automatización existe y pertenece a la empresa del usuario (o superadmin). */
async function automatizacionDeMiEmpresa(id: string, user: SessionUser) {
  const auto = await prisma.automation.findUnique({
    where: { id },
    select: { id: true, companyId: true, status: true, templateKey: true },
  })
  if (!auto) return null
  if (user.metadata.role !== 'SUPERADMIN' && auto.companyId !== user.metadata.companyId) {
    return null
  }
  return auto
}

/** Instala un playbook de la biblioteca como automatización (DRAFT). */
export async function instalarEstrategia(
  _prev: EstrategiaState,
  formData: FormData
): Promise<EstrategiaState> {
  const user = await requireSection('estrategias')
  if (!user) return { error: 'No autorizado.' }

  const companyId = await resolveCompanyId(user, formData)
  if (!companyId) return { error: 'Empresa requerida.' }

  const playbookId = String(formData.get('playbookId') ?? '').trim()
  const playbook = getPlaybook(playbookId)
  if (!playbook) return { error: 'Estrategia no encontrada.' }

  try {
    // Evitar duplicados: una instalación activa (no archivada) por playbook.
    const existente = await prisma.automation.findFirst({
      where: {
        companyId,
        templateKey: `playbook.${playbook.id}`,
        status: { not: 'ARCHIVED' },
      },
      select: { id: true },
    })
    if (existente) return { error: 'Esta estrategia ya está instalada.' }

    await service().createAutomation(playbookToCreateData(playbook, companyId))
    revalidateEstrategias()
    return { success: true }
  } catch (e) {
    console.error('[estrategias] instalar', e)
    return { error: 'No se pudo instalar la estrategia. Intenta de nuevo.' }
  }
}

/** Publica (activa) una automatización instalada. */
export async function publicarEstrategia(
  _prev: EstrategiaState,
  formData: FormData
): Promise<EstrategiaState> {
  const user = await requireSection('estrategias')
  if (!user) return { error: 'No autorizado.' }

  const id = String(formData.get('id') ?? '').trim()
  const auto = await automatizacionDeMiEmpresa(id, user)
  if (!auto) return { error: 'Automatización no encontrada.' }

  try {
    await service().publishAutomation(id)
    revalidateEstrategias()
    return { success: true }
  } catch (e) {
    console.error('[estrategias] publicar', e)
    return { error: 'No se pudo activar. Intenta de nuevo.' }
  }
}

/** Pausa una automatización publicada. */
export async function pausarEstrategia(
  _prev: EstrategiaState,
  formData: FormData
): Promise<EstrategiaState> {
  const user = await requireSection('estrategias')
  if (!user) return { error: 'No autorizado.' }

  const id = String(formData.get('id') ?? '').trim()
  const auto = await automatizacionDeMiEmpresa(id, user)
  if (!auto) return { error: 'Automatización no encontrada.' }

  try {
    await service().pauseAutomation(id)
    revalidateEstrategias()
    return { success: true }
  } catch (e) {
    console.error('[estrategias] pausar', e)
    return { error: 'No se pudo pausar. Intenta de nuevo.' }
  }
}

/** Archiva (desinstala) una automatización; el historial de runs se conserva. */
export async function archivarEstrategia(
  _prev: EstrategiaState,
  formData: FormData
): Promise<EstrategiaState> {
  const user = await requireSection('estrategias')
  if (!user) return { error: 'No autorizado.' }

  const id = String(formData.get('id') ?? '').trim()
  const auto = await automatizacionDeMiEmpresa(id, user)
  if (!auto) return { error: 'Automatización no encontrada.' }

  try {
    await service().archiveAutomation(id)
    revalidateEstrategias()
    return { success: true }
  } catch (e) {
    console.error('[estrategias] archivar', e)
    return { error: 'No se pudo desinstalar. Intenta de nuevo.' }
  }
}
