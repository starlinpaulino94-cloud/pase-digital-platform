'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { requireAdminUser } from '@/lib/auth/guards'

// F4.1: la empresa administra su propio perfil público del marketplace.
// Solo puede tocar campos de presentación — nunca isActive/isPublished/
// isFeatured (eso es del superadmin) ni datos de otra empresa.

export interface PerfilState {
  error?: string
  success?: boolean
}

const val = (formData: FormData, key: string) =>
  String(formData.get(key) ?? '').trim() || null

const num = (formData: FormData, key: string) => {
  const raw = String(formData.get(key) ?? '').trim()
  if (!raw) return null
  const n = Number(raw)
  return Number.isFinite(n) ? n : null
}

export async function actualizarPerfilPublico(
  _prev: PerfilState,
  formData: FormData
): Promise<PerfilState> {
  const user = await requireAdminUser()
  if (!user) return { error: 'No autorizado.' }

  // El superadmin no depende de la empresa de su sesión (puede no tener o
  // apuntar a una borrada): edita la empresa elegida en el formulario.
  const esSuper = user.metadata.role === 'SUPERADMIN'
  const companyId = esSuper
    ? String(formData.get('companyId') ?? '').trim()
    : user.metadata.companyId
  if (!companyId) {
    return { error: 'Empresa requerida.' }
  }
  if (esSuper) {
    const existe = await prisma.company.findUnique({
      where: { id: companyId },
      select: { id: true },
    })
    if (!existe) return { error: 'Empresa no encontrada.' }
  }

  const galleryImages = formData
    .getAll('galleryImages')
    .map(String)
    .filter(Boolean)
    .slice(0, 8)

  const categoryIds = formData
    .getAll('categoryIds')
    .map(String)
    .filter(Boolean)

  try {
    await prisma.$transaction([
      prisma.company.update({
        where: { id: companyId },
        data: {
          description: val(formData, 'description'),
          horario: val(formData, 'horario'),
          logoUrl: val(formData, 'logoUrl'),
          bannerUrl: val(formData, 'bannerUrl'),
          galleryImages,
          direccion: val(formData, 'direccion'),
          ciudad: val(formData, 'ciudad'),
          provincia: val(formData, 'provincia'),
          pais: val(formData, 'pais'),
          codigoPostal: val(formData, 'codigoPostal'),
          razonSocial: val(formData, 'razonSocial'),
          zonaCobertura: val(formData, 'zonaCobertura'),
          latitud: num(formData, 'latitud'),
          longitud: num(formData, 'longitud'),
          // Paso 4: configuración regional/marca/políticas. moneda/idioma/
          // zonaHoraria son NOT NULL: si vinieran vacíos se conserva el default.
          moneda: val(formData, 'moneda') ?? undefined,
          idioma: val(formData, 'idioma') ?? undefined,
          zonaHoraria: val(formData, 'zonaHoraria') ?? undefined,
          colorPrimario: val(formData, 'colorPrimario'),
          politicaCancelacion: val(formData, 'politicaCancelacion'),
          politicaPrivacidad: val(formData, 'politicaPrivacidad'),
          terminosEmpresa: val(formData, 'terminosEmpresa'),
          telefono: val(formData, 'telefono'),
          whatsapp: val(formData, 'whatsapp'),
          email: val(formData, 'email'),
          website: val(formData, 'website'),
          instagram: val(formData, 'instagram'),
          facebook: val(formData, 'facebook'),
          tiktok: val(formData, 'tiktok'),
          googleMapsUrl: val(formData, 'googleMapsUrl'),
        },
      }),
      prisma.companyToCategory.deleteMany({ where: { companyId } }),
      ...(categoryIds.length > 0
        ? [
            prisma.companyToCategory.createMany({
              data: categoryIds.map((categoryId) => ({ companyId, categoryId })),
              skipDuplicates: true,
            }),
          ]
        : []),
    ])

    revalidatePath('/admin/perfil')
    revalidatePath('/empresas', 'layout')
    revalidatePath('/')
    return { success: true }
  } catch (e) {
    console.error('[perfil-empresa]', e)
    return { error: 'No se pudo guardar. Intenta de nuevo.' }
  }
}

/**
 * F5.1: publica la empresa en el marketplace. Requiere el checklist de
 * onboarding completo — evita perfiles vacíos que resten confianza.
 */
export async function publicarMiEmpresa(
  _prev: PerfilState,
  _formData: FormData
): Promise<PerfilState> {
  const user = await requireAdminUser()
  if (!user) return { error: 'No autorizado.' }

  const companyId = user.metadata.companyId
  if (!companyId) return { error: 'Esta función es del panel de empresa.' }

  try {
    const { getOnboardingEmpresa } = await import('./onboarding')
    const onboarding = await getOnboardingEmpresa(companyId)
    if (!onboarding) return { error: 'Empresa no encontrada.' }
    if (onboarding.publicado) return { error: 'Tu empresa ya está publicada.' }
    if (!onboarding.listoParaPublicar) {
      const faltan = onboarding.items.filter((i) => !i.done).map((i) => i.label)
      return { error: `Completa antes: ${faltan.join(', ')}.` }
    }

    await prisma.company.update({
      where: { id: companyId },
      data: { isPublished: true },
    })

    revalidatePath('/admin/dashboard')
    revalidatePath('/empresas', 'layout')
    revalidatePath('/')
    return { success: true }
  } catch (e) {
    console.error('[publicar-empresa]', e)
    return { error: 'No se pudo publicar. Intenta de nuevo.' }
  }
}
