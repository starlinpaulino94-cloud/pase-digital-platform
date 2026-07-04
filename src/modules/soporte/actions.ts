'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { getUser } from '@/lib/auth'
import { sendEmail } from '@/lib/email'
import { crearNotificacion, notificarAdmins } from '@/modules/notificaciones/actions'
import {
  normalizarCodigoPais,
  normalizarNumero,
  estadoLabel,
  TICKET_CATEGORIAS,
  TICKET_ESTADOS,
} from '@/lib/soporte'
import type { SessionUser } from '@/types'

export interface ActionState {
  error?: string
  success?: boolean
  message?: string
}

const OK: ActionState = { success: true }

async function requireAdmin(): Promise<SessionUser | null> {
  const user = await getUser()
  if (!user || !['ADMIN_EMPRESA', 'SUPERADMIN'].includes(user.metadata.role)) {
    return null
  }
  return user
}

/** companyId efectivo para un admin/superadmin a partir del form. */
function resolveCompanyId(user: SessionUser, formData: FormData): string {
  return user.metadata.role === 'SUPERADMIN'
    ? String(formData.get('companyId') ?? '').trim()
    : (user.metadata.companyId ?? '')
}

/** Encuentra el User (para notificar) a partir del supabaseId de un cliente. */
async function findUserIdBySupabase(supabaseId: string): Promise<string | null> {
  const u = await prisma.user.findFirst({
    where: { supabaseId },
    select: { id: true },
  })
  return u?.id ?? null
}

// ── SECCIÓN 1-5: Configuración de Comunicación y Soporte ─────────────────────

export async function guardarComunicacionConfig(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const user = await requireAdmin()
  if (!user) return { error: 'No autorizado.' }

  const companyId = resolveCompanyId(user, formData)
  if (!companyId) return { error: 'Selecciona una empresa para guardar la configuración.' }

  const codigoPais = normalizarCodigoPais(String(formData.get('codigoPais') ?? ''))
  const numero = normalizarNumero(String(formData.get('numero') ?? ''))
  const mensajePlantilla = String(formData.get('mensajePlantilla') ?? '').trim()
  const activo = formData.get('activo') !== 'false'
  const correoSoporte = String(formData.get('correoSoporte') ?? '').trim()
  const horaInicio = String(formData.get('horaInicio') ?? '').trim()
  const horaCierre = String(formData.get('horaCierre') ?? '').trim()
  const diasLaborales = String(formData.get('diasLaborales') ?? '').trim()

  if (!codigoPais || codigoPais.length < 2) {
    return { error: 'Ingresa un código de país válido (ej: +52).' }
  }
  if (!numero || numero.length < 7) {
    return { error: 'Ingresa un número de WhatsApp válido (solo dígitos).' }
  }
  if (correoSoporte && !/.+@.+\..+/.test(correoSoporte)) {
    return { error: 'El correo de soporte no tiene un formato válido.' }
  }

  await prisma.whatsAppConfig.upsert({
    where: { companyId },
    create: {
      companyId,
      codigoPais,
      numero,
      mensajePlantilla: mensajePlantilla || undefined,
      activo,
      correoSoporte: correoSoporte || null,
      horaInicio: horaInicio || null,
      horaCierre: horaCierre || null,
      diasLaborales: diasLaborales || null,
    },
    update: {
      codigoPais,
      numero,
      mensajePlantilla: mensajePlantilla || undefined,
      activo,
      correoSoporte: correoSoporte || null,
      horaInicio: horaInicio || null,
      horaCierre: horaCierre || null,
      diasLaborales: diasLaborales || null,
    },
  })

  revalidatePath('/admin/comunicacion')
  revalidatePath('/cliente/ayuda')
  return OK
}

export async function enviarCorreoPrueba(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const user = await requireAdmin()
  if (!user) return { error: 'No autorizado.' }

  const correo = String(formData.get('correoSoporte') ?? '').trim()
  if (!correo || !/.+@.+\..+/.test(correo)) {
    return { error: 'Ingresa un correo de soporte válido antes de probar.' }
  }

  const result = await sendEmail({
    to: correo,
    subject: 'Correo de prueba · MembreGo',
    html: `<p>Este es un correo de prueba enviado desde el módulo de Comunicación y Soporte de MembreGo.</p>
           <p>Si lo recibes, tu correo de soporte está configurado correctamente.</p>`,
  })

  if (result.sent) {
    return { success: true, message: `Correo de prueba enviado a ${correo}.` }
  }
  return {
    error:
      result.reason === 'RESEND_API_KEY no configurada'
        ? 'No hay proveedor de correo configurado (RESEND_API_KEY). El correo de soporte se guardará, pero el envío automático está deshabilitado.'
        : `No se pudo enviar el correo de prueba: ${result.reason ?? 'error'}.`,
  }
}

// ── SECCIÓN 6 (admin): FAQ CRUD ──────────────────────────────────────────────

export async function crearFaq(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const user = await requireAdmin()
  if (!user) return { error: 'No autorizado.' }
  const companyId = resolveCompanyId(user, formData)
  if (!companyId) return { error: 'Selecciona una empresa.' }

  const pregunta = String(formData.get('pregunta') ?? '').trim()
  const respuesta = String(formData.get('respuesta') ?? '').trim()
  const orden = Number(formData.get('orden') ?? 0) || 0
  if (!pregunta || !respuesta) {
    return { error: 'La pregunta y la respuesta son obligatorias.' }
  }

  await prisma.faqItem.create({
    data: { companyId, pregunta, respuesta, orden },
  })
  revalidatePath('/admin/comunicacion')
  revalidatePath('/cliente/ayuda')
  return OK
}

export async function actualizarFaq(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const user = await requireAdmin()
  if (!user) return { error: 'No autorizado.' }
  const id = String(formData.get('id') ?? '')
  const pregunta = String(formData.get('pregunta') ?? '').trim()
  const respuesta = String(formData.get('respuesta') ?? '').trim()
  const orden = Number(formData.get('orden') ?? 0) || 0
  if (!id || !pregunta || !respuesta) return { error: 'Datos incompletos.' }

  const faq = await prisma.faqItem.findUnique({ where: { id } })
  if (!faq) return { error: 'Pregunta no encontrada.' }
  if (user.metadata.role !== 'SUPERADMIN' && faq.companyId !== user.metadata.companyId) {
    return { error: 'No autorizado.' }
  }

  await prisma.faqItem.update({
    where: { id },
    data: { pregunta, respuesta, orden },
  })
  revalidatePath('/admin/comunicacion')
  revalidatePath('/cliente/ayuda')
  return OK
}

export async function eliminarFaq(id: string): Promise<ActionState> {
  const user = await requireAdmin()
  if (!user) return { error: 'No autorizado.' }
  const faq = await prisma.faqItem.findUnique({ where: { id } })
  if (!faq) return { error: 'Pregunta no encontrada.' }
  if (user.metadata.role !== 'SUPERADMIN' && faq.companyId !== user.metadata.companyId) {
    return { error: 'No autorizado.' }
  }
  await prisma.faqItem.delete({ where: { id } })
  revalidatePath('/admin/comunicacion')
  revalidatePath('/cliente/ayuda')
  return OK
}

export async function toggleFaq(id: string, activo: boolean): Promise<ActionState> {
  const user = await requireAdmin()
  if (!user) return { error: 'No autorizado.' }
  const faq = await prisma.faqItem.findUnique({ where: { id } })
  if (!faq) return { error: 'Pregunta no encontrada.' }
  if (user.metadata.role !== 'SUPERADMIN' && faq.companyId !== user.metadata.companyId) {
    return { error: 'No autorizado.' }
  }
  await prisma.faqItem.update({ where: { id }, data: { activo } })
  revalidatePath('/admin/comunicacion')
  revalidatePath('/cliente/ayuda')
  return OK
}

// ── SECCIÓN 6 (cliente): crear ticket ────────────────────────────────────────

export async function crearTicket(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const user = await getUser()
  if (!user || user.metadata.role !== 'CLIENTE') return { error: 'No autorizado.' }

  const clienteId = user.metadata.clienteId
  const companyId = user.metadata.companyId
  if (!clienteId || !companyId) {
    return { error: 'No se pudo identificar tu cuenta de cliente.' }
  }

  const asunto = String(formData.get('asunto') ?? '').trim()
  const descripcion = String(formData.get('descripcion') ?? '').trim()
  const categoriaRaw = String(formData.get('categoria') ?? 'OTRO').trim()
  const adjuntoUrl = String(formData.get('adjuntoUrl') ?? '').trim()
  const categoria = (TICKET_CATEGORIAS as readonly string[]).includes(categoriaRaw)
    ? categoriaRaw
    : 'OTRO'

  if (!asunto || !descripcion) {
    return { error: 'El asunto y la descripción son obligatorios.' }
  }

  const cliente = await prisma.cliente.findUnique({
    where: { id: clienteId },
    select: { nombre: true },
  })

  const ticket = await prisma.supportTicket.create({
    data: {
      companyId,
      clienteId,
      asunto,
      categoria: categoria as never,
      adjuntoUrl: adjuntoUrl || null,
      mensajes: {
        create: {
          autorTipo: 'CLIENTE',
          autorNombre: cliente?.nombre ?? 'Cliente',
          cuerpo: descripcion,
        },
      },
    },
  })

  // Notificar a los administradores de la empresa (interno + correo best-effort).
  await notificarAdmins(companyId, {
    tipo: 'TICKET_NUEVO',
    titulo: 'Nuevo ticket de soporte',
    mensaje: `${cliente?.nombre ?? 'Un cliente'}: ${asunto}`,
    href: `/admin/tickets/${ticket.id}`,
  })

  const config = await prisma.whatsAppConfig.findUnique({
    where: { companyId },
    select: { correoSoporte: true },
  })
  if (config?.correoSoporte) {
    await sendEmail({
      to: config.correoSoporte,
      subject: `Nuevo ticket: ${asunto}`,
      html: `<p>Se recibió un nuevo ticket de soporte.</p>
             <p><strong>Cliente:</strong> ${cliente?.nombre ?? 'Cliente'}<br/>
             <strong>Asunto:</strong> ${asunto}<br/>
             <strong>Descripción:</strong> ${descripcion}</p>`,
    })
  }

  revalidatePath('/cliente/ayuda')
  revalidatePath('/admin/tickets')
  return { success: true, message: 'Ticket enviado. Te avisaremos cuando haya respuesta.' }
}

// ── SECCIÓN 7 (admin): gestión de tickets ────────────────────────────────────

async function loadTicketForAdmin(user: SessionUser, ticketId: string) {
  const ticket = await prisma.supportTicket.findUnique({
    where: { id: ticketId },
    include: { cliente: { select: { supabaseId: true, nombre: true } } },
  })
  if (!ticket) return null
  if (user.metadata.role !== 'SUPERADMIN' && ticket.companyId !== user.metadata.companyId) {
    return null
  }
  return ticket
}

export async function responderTicket(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const user = await requireAdmin()
  if (!user) return { error: 'No autorizado.' }

  const ticketId = String(formData.get('ticketId') ?? '')
  const cuerpo = String(formData.get('cuerpo') ?? '').trim()
  const nuevoEstado = String(formData.get('estado') ?? '').trim()
  if (!ticketId || !cuerpo) return { error: 'Escribe una respuesta.' }

  const ticket = await loadTicketForAdmin(user, ticketId)
  if (!ticket) return { error: 'Ticket no encontrado.' }

  const estado =
    nuevoEstado && (TICKET_ESTADOS as readonly string[]).includes(nuevoEstado)
      ? nuevoEstado
      : 'ESPERANDO_CLIENTE'

  await prisma.$transaction([
    prisma.ticketMensaje.create({
      data: {
        ticketId,
        autorTipo: 'ADMIN',
        autorNombre: user.email,
        cuerpo,
      },
    }),
    prisma.supportTicket.update({
      where: { id: ticketId },
      data: { estado: estado as never },
    }),
  ])

  // Notificar al cliente (interno + correo).
  const clienteUserId = await findUserIdBySupabase(ticket.cliente.supabaseId)
  if (clienteUserId) {
    await crearNotificacion({
      userId: clienteUserId,
      tipo: 'TICKET_RESPUESTA',
      titulo: 'Respuesta a tu ticket',
      mensaje: ticket.asunto,
      href: `/cliente/ayuda/${ticketId}`,
    })
  }

  revalidatePath(`/admin/tickets/${ticketId}`)
  revalidatePath('/admin/tickets')
  revalidatePath(`/cliente/ayuda/${ticketId}`)
  return OK
}

export async function agregarNotaInterna(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const user = await requireAdmin()
  if (!user) return { error: 'No autorizado.' }

  const ticketId = String(formData.get('ticketId') ?? '')
  const cuerpo = String(formData.get('cuerpo') ?? '').trim()
  if (!ticketId || !cuerpo) return { error: 'Escribe la nota interna.' }

  const ticket = await loadTicketForAdmin(user, ticketId)
  if (!ticket) return { error: 'Ticket no encontrado.' }

  await prisma.ticketMensaje.create({
    data: {
      ticketId,
      autorTipo: 'ADMIN',
      autorNombre: user.email,
      cuerpo,
      esNotaInterna: true,
    },
  })
  revalidatePath(`/admin/tickets/${ticketId}`)
  return OK
}

export async function cambiarEstadoTicket(
  ticketId: string,
  estado: string
): Promise<ActionState> {
  const user = await requireAdmin()
  if (!user) return { error: 'No autorizado.' }
  if (!(TICKET_ESTADOS as readonly string[]).includes(estado)) {
    return { error: 'Estado inválido.' }
  }
  const ticket = await loadTicketForAdmin(user, ticketId)
  if (!ticket) return { error: 'Ticket no encontrado.' }

  await prisma.$transaction([
    prisma.supportTicket.update({
      where: { id: ticketId },
      data: { estado: estado as never },
    }),
    prisma.ticketMensaje.create({
      data: {
        ticketId,
        autorTipo: 'SISTEMA',
        autorNombre: 'Sistema',
        cuerpo: `Estado cambiado a "${estadoLabel(estado)}".`,
      },
    }),
  ])

  const clienteUserId = await findUserIdBySupabase(ticket.cliente.supabaseId)
  if (clienteUserId) {
    await crearNotificacion({
      userId: clienteUserId,
      tipo: 'TICKET_ACTUALIZADO',
      titulo: 'Tu ticket cambió de estado',
      mensaje: `${ticket.asunto} → ${estadoLabel(estado)}`,
      href: `/cliente/ayuda/${ticketId}`,
    })
  }

  revalidatePath(`/admin/tickets/${ticketId}`)
  revalidatePath('/admin/tickets')
  return OK
}

// ── Cliente responde a su propio ticket ──────────────────────────────────────

export async function responderTicketCliente(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const user = await getUser()
  if (!user || user.metadata.role !== 'CLIENTE') return { error: 'No autorizado.' }

  const ticketId = String(formData.get('ticketId') ?? '')
  const cuerpo = String(formData.get('cuerpo') ?? '').trim()
  if (!ticketId || !cuerpo) return { error: 'Escribe tu mensaje.' }

  const ticket = await prisma.supportTicket.findUnique({
    where: { id: ticketId },
    include: { cliente: { select: { id: true, nombre: true } } },
  })
  if (!ticket || ticket.clienteId !== user.metadata.clienteId) {
    return { error: 'Ticket no encontrado.' }
  }

  await prisma.$transaction([
    prisma.ticketMensaje.create({
      data: {
        ticketId,
        autorTipo: 'CLIENTE',
        autorNombre: ticket.cliente.nombre,
        cuerpo,
      },
    }),
    prisma.supportTicket.update({
      where: { id: ticketId },
      data: { estado: 'EN_PROCESO' },
    }),
  ])

  await notificarAdmins(ticket.companyId, {
    tipo: 'TICKET_ACTUALIZADO',
    titulo: 'Respuesta del cliente en un ticket',
    mensaje: `${ticket.cliente.nombre}: ${ticket.asunto}`,
    href: `/admin/tickets/${ticketId}`,
  })

  revalidatePath(`/cliente/ayuda/${ticketId}`)
  revalidatePath(`/admin/tickets/${ticketId}`)
  return OK
}
