import { prisma } from '@/lib/prisma'
import type { NotificationTipo, Prisma } from '@prisma/client'

/**
 * Sistema de notificaciones.
 *
 * Arquitectura preparada para 3 canales: Push, WhatsApp y Email.
 * Esta función inserta la notificación en BD (para el bell icon del panel)
 * y dispara los stubs de cada canal. Las integraciones reales se activan
 * después configurando las variables de entorno correspondientes.
 *
 * Para activar email: configurar RESEND_API_KEY y descomentar el envío.
 * Para activar WhatsApp: configurar el provider y descomentar.
 * Para activar Push: configurar el service worker + FCM y descomentar.
 */

export interface SendNotificationInput {
  userId?: string
  clienteId?: string
  tipo: NotificationTipo
  titulo: string
  mensaje: string
  datos?: Prisma.JsonObject
  // Canales a activar (por defecto solo in-app)
  channels?: ('in_app' | 'email' | 'whatsapp' | 'push')[]
}

export async function sendNotification(input: SendNotificationInput) {
  const channels = input.channels ?? ['in_app']

  // 1. Siempre insertar en BD (canal in-app)
  if (channels.includes('in_app') || channels.length === 0) {
    try {
      await prisma.notification.create({
        data: {
          userId: input.userId,
          clienteId: input.clienteId,
          tipo: input.tipo,
          titulo: input.titulo,
          mensaje: input.mensaje,
          datos: input.datos ?? undefined,
        },
      })
    } catch (e) {
      console.error('[notifications] insert failed:', e)
    }
  }

  // 2. Email (stub — activar con RESEND_API_KEY)
  if (channels.includes('email')) {
    await sendEmailStub(input).catch(() => {})
  }

  // 3. WhatsApp (stub — activar con provider)
  if (channels.includes('whatsapp')) {
    await sendWhatsAppStub(input).catch(() => {})
  }

  // 4. Push (stub — activar con FCM)
  if (channels.includes('push')) {
    await sendPushStub(input).catch(() => {})
  }
}

// --- Stubs (se implementan cuando se configuren los proveedores) ---

async function sendEmailStub(input: SendNotificationInput) {
  // TODO: Activar cuando se configure RESEND_API_KEY
  // const resend = new Resend(process.env.RESEND_API_KEY)
  // await resend.emails.send({ from: ..., to: ..., subject: input.titulo, html: ... })
  if (process.env.NODE_ENV !== 'production') {
    console.warn(`[email stub] ${input.titulo} → ${input.clienteId ?? input.userId}`)
  }
}

async function sendWhatsAppStub(input: SendNotificationInput) {
  // TODO: Activar cuando se configure el provider de WhatsApp
  if (process.env.NODE_ENV !== 'production') {
    console.warn(`[whatsapp stub] ${input.titulo}`)
  }
}

async function sendPushStub(input: SendNotificationInput) {
  // TODO: Activar cuando se configure FCM + service worker
  if (process.env.NODE_ENV !== 'production') {
    console.warn(`[push stub] ${input.titulo}`)
  }
}

// --- Helpers específicos por evento ---

export async function notifyPagoAprobado(
  userId: string,
  clienteId: string,
  data: { plan: string; monto: number; metodo: string }
) {
  return sendNotification({
    userId,
    clienteId,
    tipo: 'PAGO_APROBADO',
    titulo: 'Pago aprobado',
    mensaje: `Tu pago de RD$${data.monto} para el plan ${data.plan} fue aprobado. Tu Pase Digital está activo.`,
    datos: data,
    channels: ['in_app', 'email'],
  })
}

export async function notifyPagoRechazado(
  userId: string,
  clienteId: string,
  data: { plan: string; motivo: string }
) {
  return sendNotification({
    userId,
    clienteId,
    tipo: 'PAGO_RECHAZADO',
    titulo: 'Pago rechazado',
    mensaje: `Tu pago para el plan ${data.plan} fue rechazado. Motivo: ${data.motivo}. Puedes reenviar el comprobante.`,
    datos: data,
    channels: ['in_app', 'email'],
  })
}

export async function notifyQrGenerado(
  userId: string,
  clienteId: string,
  data: { plan: string }
) {
  return sendNotification({
    userId,
    clienteId,
    tipo: 'QR_GENERADO',
    titulo: 'Tu Pase Digital está listo',
    mensaje: `Se generó tu código QR para el plan ${data.plan}. Presenta tu Pase en cada visita.`,
    datos: data,
    channels: ['in_app'],
  })
}

export async function notifyQrUtilizado(
  userId: string,
  clienteId: string,
  data: { servicio: string; sucursal: string; restantes: number }
) {
  return sendNotification({
    userId,
    clienteId,
    tipo: 'QR_UTILIZADO',
    titulo: 'Servicio utilizado',
    mensaje: `Usaste ${data.servicio} en ${data.sucursal}. Servicios restantes: ${data.restantes}.`,
    datos: data,
    channels: ['in_app', 'push'],
  })
}

export async function notifyMembresiaPorVencer(
  userId: string,
  clienteId: string,
  data: { plan: string; fechaVencimiento: string }
) {
  return sendNotification({
    userId,
    clienteId,
    tipo: 'MEMBRESIA_POR_VENCER',
    titulo: 'Tu membresía vence pronto',
    mensaje: `Tu plan ${data.plan} vence el ${data.fechaVencimiento}. Renueva para no perder tus beneficios.`,
    datos: data,
    channels: ['in_app', 'email', 'whatsapp'],
  })
}
