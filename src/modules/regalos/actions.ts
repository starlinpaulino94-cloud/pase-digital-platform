'use server'

import { prisma } from '@/lib/prisma'
import { getUser } from '@/lib/auth'
import { ensureCodigoCorto } from '@/lib/referidos'
import { createRateLimiter } from '@/lib/rate-limit'

/**
 * Regalos P2P · Fase R1 (docs/REGALOS-P2P.md).
 * - Mi ID MembeGo: el código corto del cliente, para recibir regalos.
 * - Buscador SEGURO de destinatarios: nunca expone listas de clientes.
 *
 * Reglas del buscador (§3.1 del doc):
 *  - Solo clientes autenticados, y solo dentro de SU misma empresa.
 *  - Por @código: coincidencia exacta (el código es identidad semipública).
 *  - Por texto: mínimo 4 caracteres, máximo 5 resultados, datos ENMASCARADOS
 *    (nombre + inicial, últimos 4 del teléfono) — suficiente para confirmar
 *    "¿es esta persona?", inútil para raspar la base de clientes.
 *  - Rate-limit por usuario contra enumeración.
 */

const busquedaLimiter = createRateLimiter({
  interval: 60 * 1000, // 1 minuto
  maxRequests: 10,
})

export interface DestinatarioResultado {
  /** Id opaco del cliente destino (cuid) — necesario para enviar el regalo. */
  clienteId: string
  /** "Juan P." — nombre de pila + inicial del apellido. */
  nombre: string
  /** "•••1234" o null si no tiene teléfono. */
  telefonoMask: string | null
  avatarUrl: string | null
  /** Su @ID (visible: es identidad semipública para regalos). */
  codigo: string | null
}

function enmascararNombre(nombre: string): string {
  const partes = nombre.trim().split(/\s+/)
  if (partes.length === 1) return partes[0]
  return `${partes[0]} ${partes[1][0]?.toUpperCase() ?? ''}.`
}

function enmascararTelefono(telefono: string | null): string | null {
  if (!telefono) return null
  const digits = telefono.replace(/\D/g, '')
  return digits.length >= 4 ? `•••${digits.slice(-4)}` : null
}

export async function buscarDestinatario(
  query: string
): Promise<{ error?: string; resultados?: DestinatarioResultado[] }> {
  const user = await getUser()
  if (!user || user.metadata.role !== 'CLIENTE') return { error: 'No autorizado.' }
  const { clienteId, companyId } = user.metadata
  if (!clienteId || !companyId) return { error: 'Tu cuenta no está vinculada a una empresa.' }

  if (!(await busquedaLimiter(`regalo-busca:${clienteId}`))) {
    return { error: 'Demasiadas búsquedas. Espera un momento.' }
  }

  const term = query.trim()

  // ── Por @código: exacto, sin mínimo de longitud ────────────────────────────
  const codigo = term.startsWith('@') ? term.slice(1) : term
  if (/^[A-Za-z0-9]{4,12}$/.test(codigo)) {
    const porCodigo = await prisma.cliente.findFirst({
      where: { codigoCorto: codigo.toUpperCase(), companyId },
      select: { id: true, nombre: true, telefono: true, avatarUrl: true, codigoCorto: true },
    })
    if (porCodigo && porCodigo.id !== clienteId) {
      return {
        resultados: [
          {
            clienteId: porCodigo.id,
            nombre: enmascararNombre(porCodigo.nombre),
            telefonoMask: enmascararTelefono(porCodigo.telefono),
            avatarUrl: porCodigo.avatarUrl,
            codigo: porCodigo.codigoCorto,
          },
        ],
      }
    }
    // Si parecía un código pero no existe, seguimos al texto libre (puede ser
    // un nombre corto como "Juan").
  }

  // ── Por texto: nombre / teléfono / correo exacto ───────────────────────────
  if (term.length < 4) {
    return { error: 'Escribe al menos 4 caracteres, o el @ID exacto de la persona.' }
  }

  const digits = term.replace(/\D/g, '')
  const clientes = await prisma.cliente.findMany({
    where: {
      companyId,
      id: { not: clienteId },
      OR: [
        { nombre: { contains: term, mode: 'insensitive' } },
        { email: { equals: term, mode: 'insensitive' } },
        ...(digits.length >= 7 ? [{ telefono: { contains: digits } }] : []),
      ],
    },
    select: { id: true, nombre: true, telefono: true, avatarUrl: true, codigoCorto: true },
    orderBy: { createdAt: 'asc' },
    take: 5,
  })

  return {
    resultados: clientes.map((c) => ({
      clienteId: c.id,
      nombre: enmascararNombre(c.nombre),
      telefonoMask: enmascararTelefono(c.telefono),
      avatarUrl: c.avatarUrl,
      codigo: c.codigoCorto,
    })),
  }
}

/**
 * Mi ID MembeGo (@código): lo genera la primera vez si no existe. Es la
 * identidad que el cliente comparte para RECIBIR regalos.
 */
export async function obtenerMiIdMembego(): Promise<{ error?: string; codigo?: string }> {
  const user = await getUser()
  if (!user || user.metadata.role !== 'CLIENTE') return { error: 'No autorizado.' }
  if (!user.metadata.clienteId) return { error: 'Tu cuenta no está vinculada a una empresa.' }
  try {
    const codigo = await ensureCodigoCorto(user.metadata.clienteId)
    return { codigo }
  } catch (e) {
    console.error('[regalos] obtenerMiIdMembego', e)
    return { error: 'No se pudo obtener tu ID. Intenta de nuevo.' }
  }
}
