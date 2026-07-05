'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { getUser } from '@/lib/auth'

export interface ActionState {
  error?: string
  success?: boolean
  message?: string
}

async function requireSuperadmin() {
  const user = await getUser()
  if (!user || user.metadata.role !== 'SUPERADMIN') return null
  return user
}

export async function actualizarEmpresa(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const user = await requireSuperadmin()
  if (!user) return { error: 'No autorizado.' }

  const id = String(formData.get('id') ?? '')
  if (!id) return { error: 'Empresa no especificada.' }

  const name = String(formData.get('name') ?? '').trim()
  if (!name) return { error: 'El nombre es requerido.' }

  try {
    const existing = await prisma.company.findUnique({ where: { id } })
    if (!existing) return { error: 'Empresa no encontrada.' }

    await prisma.company.update({
      where: { id },
      data: {
        name,
        description: String(formData.get('description') ?? '').trim() || null,
        type: String(formData.get('type') ?? existing.type),
        email: String(formData.get('email') ?? '').trim() || null,
        telefono: String(formData.get('telefono') ?? '').trim() || null,
        direccion: String(formData.get('direccion') ?? '').trim() || null,
        ciudad: String(formData.get('ciudad') ?? '').trim() || null,
        categoria: String(formData.get('categoria') ?? '').trim() || null,
        website: String(formData.get('website') ?? '').trim() || null,
        logoUrl: String(formData.get('logoUrl') ?? '').trim() || null,
      },
    })

    revalidatePath('/superadmin/empresas')
    revalidatePath(`/superadmin/empresas/${id}`)
    return { success: true, message: 'Empresa actualizada.' }
  } catch (e) {
    console.error('[empresa]', e)
    return { error: 'Ocurrió un error. Intenta de nuevo.' }
  }
}

export async function toggleEmpresa(id: string, activate: boolean): Promise<ActionState> {
  const user = await requireSuperadmin()
  if (!user) return { error: 'No autorizado.' }

  try {
    const company = await prisma.company.findUnique({ where: { id } })
    if (!company) return { error: 'Empresa no encontrada.' }

    await prisma.company.update({
      where: { id },
      data: { isActive: activate },
    })

    revalidatePath('/superadmin/empresas')
    return { success: true, message: activate ? 'Empresa activada.' : 'Empresa suspendida.' }
  } catch (e) {
    console.error('[empresa]', e)
    return { error: 'Ocurrió un error. Intenta de nuevo.' }
  }
}

export async function eliminarEmpresa(id: string): Promise<ActionState> {
  const user = await requireSuperadmin()
  if (!user) return { error: 'No autorizado.' }

  try {
    const company = await prisma.company.findUnique({
      where: { id },
      include: { _count: { select: { clientes: true, users: true } } },
    })
    if (!company) return { error: 'Empresa no encontrada.' }

    if (company._count.clientes > 0 || company._count.users > 0) {
      return { error: 'No se puede eliminar una empresa con clientes o usuarios activos.' }
    }

    await prisma.company.delete({ where: { id } })

    revalidatePath('/superadmin/empresas')
    return { success: true, message: 'Empresa eliminada.' }
  } catch (e) {
    console.error('[empresa]', e)
    return { error: 'Ocurrió un error. Intenta de nuevo.' }
  }
}

export async function duplicarEmpresa(id: string): Promise<ActionState> {
  const user = await requireSuperadmin()
  if (!user) return { error: 'No autorizado.' }

  try {
    const company = await prisma.company.findUnique({ where: { id } })
    if (!company) return { error: 'Empresa no encontrada.' }

    const slug = `${company.slug}-copia-${Date.now().toString(36)}`

    await prisma.company.create({
      data: {
        name: `${company.name} (Copia)`,
        slug,
        type: company.type,
        description: company.description,
        email: company.email,
        telefono: company.telefono,
        direccion: company.direccion,
        ciudad: company.ciudad,
        categoria: company.categoria,
        website: company.website,
        isActive: false,
      },
    })

    revalidatePath('/superadmin/empresas')
    return { success: true, message: 'Empresa duplicada.' }
  } catch (e) {
    console.error('[empresa]', e)
    return { error: 'Ocurrió un error. Intenta de nuevo.' }
  }
}
