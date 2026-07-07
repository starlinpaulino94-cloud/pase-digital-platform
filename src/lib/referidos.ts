import { prisma } from '@/lib/prisma'
import type { ReferralEventTipo } from '@prisma/client'

/**
 * Motor del programa de referidos (Referidos 2.0).
 * Puntos, niveles de embajador, logros y utilidades de tracking.
 * Todo aislado por empresa: los puntos/niveles/ranking de un cliente solo
 * consideran eventos de SU empresa.
 */

/** Puntos por cada evento del embudo. */
export const PUNTOS: Record<ReferralEventTipo, number> = {
  SHARE: 2,
  CLICK: 5,
  REGISTRO: 20,
  MEMBRESIA: 200,
}

export interface NivelEmbajador {
  id: string
  nombre: string
  emoji: string
  minPuntos: number
  descripcion: string
}

/** Niveles de embajador, en orden ascendente por puntos. */
export const NIVELES: NivelEmbajador[] = [
  { id: 'explorador', nombre: 'Explorador', emoji: '🌱', minPuntos: 0, descripcion: 'Tus primeros pasos como promotor.' },
  { id: 'promotor', nombre: 'Promotor', emoji: '🤝', minPuntos: 100, descripcion: 'Ya estás generando interés real.' },
  { id: 'embajador', nombre: 'Embajador', emoji: '⭐', minPuntos: 400, descripcion: 'Refieres clientes de forma constante.' },
  { id: 'premium', nombre: 'Embajador Premium', emoji: '💎', minPuntos: 1000, descripcion: 'Alta conversión y constancia.' },
  { id: 'elite', nombre: 'Embajador Elite', emoji: '👑', minPuntos: 2500, descripcion: 'Uno de los mejores promotores de la empresa.' },
]

export function calcularNivel(puntos: number): {
  nivel: NivelEmbajador
  siguiente: NivelEmbajador | null
  progresoPct: number
} {
  let nivel = NIVELES[0]
  for (const n of NIVELES) {
    if (puntos >= n.minPuntos) nivel = n
  }
  const idx = NIVELES.indexOf(nivel)
  const siguiente = NIVELES[idx + 1] ?? null
  const progresoPct = siguiente
    ? Math.min(
        100,
        Math.round(
          ((puntos - nivel.minPuntos) / (siguiente.minPuntos - nivel.minPuntos)) * 100
        )
      )
    : 100
  return { nivel, siguiente, progresoPct }
}

export interface Logro {
  id: string
  nombre: string
  emoji: string
  descripcion: string
  desbloqueado: boolean
}

export function calcularLogros(stats: {
  registros: number
  membresias: number
  clicks: number
  recompensas: number
  nivelId: string
}): Logro[] {
  const conversion = stats.clicks >= 10 ? stats.membresias / stats.clicks : 0
  return [
    { id: 'primero', nombre: 'Primer referido', emoji: '🏅', descripcion: 'Tu primer amigo registrado.', desbloqueado: stats.registros >= 1 },
    { id: 'primera-membresia', nombre: 'Primera conversión', emoji: '🎯', descripcion: 'Un referido activó su membresía.', desbloqueado: stats.membresias >= 1 },
    { id: 'diez', nombre: '10 referidos', emoji: '🔥', descripcion: '10 amigos registrados con tu enlace.', desbloqueado: stats.registros >= 10 },
    { id: 'cincuenta', nombre: '50 referidos', emoji: '🚀', descripcion: '50 registros. Imparable.', desbloqueado: stats.registros >= 50 },
    { id: 'conversion', nombre: 'Conversión +30%', emoji: '🧲', descripcion: 'Más del 30% de tus clics se convierten (mín. 10 clics).', desbloqueado: conversion >= 0.3 },
    { id: 'recompensado', nombre: 'Recompensado', emoji: '🎁', descripcion: 'Obtuviste tu primera recompensa.', desbloqueado: stats.recompensas >= 1 },
    { id: 'elite', nombre: 'Embajador Elite', emoji: '👑', descripcion: 'Alcanzaste el nivel máximo.', desbloqueado: stats.nivelId === 'elite' },
  ]
}

// Alfabeto sin caracteres confundibles (0/O, 1/I/L).
const CODE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'

function randomCode(len = 6): string {
  let out = ''
  for (let i = 0; i < len; i++) {
    out += CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)]
  }
  return out
}

/**
 * Devuelve el código corto del cliente para /r/XXXXXX, generándolo la primera
 * vez (con reintentos ante colisión).
 */
export async function ensureCodigoCorto(clienteId: string): Promise<string> {
  const cliente = await prisma.cliente.findUnique({
    where: { id: clienteId },
    select: { codigoCorto: true },
  })
  if (cliente?.codigoCorto) return cliente.codigoCorto

  for (let intento = 0; intento < 5; intento++) {
    const code = randomCode(6)
    try {
      await prisma.cliente.update({
        where: { id: clienteId },
        data: { codigoCorto: code },
      })
      return code
    } catch {
      // Colisión con el unique: reintenta con otro código.
    }
  }
  throw new Error('No se pudo generar el código corto de referido.')
}

/**
 * Registra un evento del embudo con sus puntos. Nunca lanza: el tracking jamás
 * debe romper el flujo principal (registro, activación, compartir).
 */
export async function logReferralEvent(params: {
  clienteId: string
  companyId: string
  tipo: ReferralEventTipo
  canal?: string | null
  meta?: Record<string, unknown>
}): Promise<void> {
  try {
    await prisma.referralEvent.create({
      data: {
        clienteId: params.clienteId,
        companyId: params.companyId,
        tipo: params.tipo,
        puntos: PUNTOS[params.tipo],
        canal: params.canal ?? null,
        meta: (params.meta ?? {}) as object,
      },
    })
  } catch (e) {
    console.error('[referidos] logReferralEvent error:', e)
  }
}
