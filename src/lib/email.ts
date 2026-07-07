/**
 * Envío de correo best-effort. Si existe RESEND_API_KEY se envía vía la API HTTP
 * de Resend (sin dependencias extra, usando fetch). Si no está configurada, el
 * correo se registra en consola y la función devuelve `false` sin lanzar, de modo
 * que las notificaciones internas siguen funcionando aunque no haya proveedor.
 *
 * No se usa WhatsApp API en ningún caso (requisito del módulo de soporte).
 */

export interface EmailPayload {
  to: string
  subject: string
  html?: string
  text?: string
}

export interface EmailResult {
  sent: boolean
  reason?: string
}

export async function sendEmail(payload: EmailPayload): Promise<EmailResult> {
  const apiKey = process.env.RESEND_API_KEY
  const from = process.env.EMAIL_FROM ?? 'MembeGo <onboarding@resend.dev>'

  if (!payload.to || !/.+@.+\..+/.test(payload.to)) {
    return { sent: false, reason: 'destinatario inválido' }
  }

  if (!apiKey) {
    console.warn('[email] (no RESEND_API_KEY) →', {
      to: payload.to,
      subject: payload.subject,
    })
    return { sent: false, reason: 'RESEND_API_KEY no configurada' }
  }

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from,
        to: payload.to,
        subject: payload.subject,
        html: payload.html ?? undefined,
        text: payload.text ?? (payload.html ? undefined : payload.subject),
      }),
    })
    if (!res.ok) {
      const detail = await res.text().catch(() => '')
      console.error('[email] Resend error', res.status, detail)
      return { sent: false, reason: `Resend ${res.status}` }
    }
    return { sent: true }
  } catch (e) {
    console.error('[email] error', e)
    return { sent: false, reason: e instanceof Error ? e.message : 'error' }
  }
}
