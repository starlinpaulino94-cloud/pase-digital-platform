import { cookies } from 'next/headers'
import { prisma } from '@/lib/prisma'
import { CANAL_COOKIE, sanitizarCanal } from './shared'

/**
 * Atribución de marketing · lado servidor. La cookie `mg_canal` la siembra el
 * middleware cuando el visitante llega con `?src=canal` (primer toque, 30
 * días); aquí se lee al REGISTRARSE y se guarda en la ficha del cliente.
 */

/** Canal atribuido al visitante actual (cookie), o null. */
export async function leerCanalCookie(): Promise<string | null> {
  try {
    const store = await cookies()
    return sanitizarCanal(store.get(CANAL_COOKIE)?.value)
  } catch {
    return null
  }
}

/**
 * Guarda el canal de la cookie en la ficha recién creada. NUNCA lanza y
 * tolera que la columna `canalOrigen` aún no exista en la BD (migración
 * 20260755 pendiente): el registro del cliente jamás se bloquea por esto.
 */
export async function capturarCanalRegistro(clienteId: string): Promise<void> {
  try {
    const canal = await leerCanalCookie()
    if (!canal) return
    await prisma.$executeRaw`UPDATE "clientes" SET "canalOrigen" = ${canal} WHERE "id" = ${clienteId} AND "canalOrigen" IS NULL`
  } catch (e) {
    console.error('[adquisicion] capturarCanalRegistro', e)
  }
}
