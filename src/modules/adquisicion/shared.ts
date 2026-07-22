/**
 * Atribución de marketing (docs/ADQUISICION.md) · helpers PUROS.
 * Sin Prisma ni next/headers: este archivo lo importa también el middleware
 * edge (src/proxy.ts), que no puede cargar dependencias de Node.
 */

/** Cookie de primer toque: canal que trajo al visitante (?src=facebook). */
export const CANAL_COOKIE = 'mg_canal'

/** Vigencia de la atribución: 30 días desde el primer clic. */
export const CANAL_COOKIE_MAX_AGE = 60 * 60 * 24 * 30

/**
 * Normaliza el valor de ?src= a un slug seguro (minúsculas, letras/números/
 * guiones, máx. 40). Devuelve null si no queda nada usable.
 */
export function sanitizarCanal(raw: string | null | undefined): string | null {
  if (!raw) return null
  const slug = raw
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40)
  return slug || null
}

/** Canales predefinidos que se ofrecen en el generador de enlaces. */
export const CANALES_PREDEFINIDOS = [
  'facebook',
  'instagram',
  'tiktok',
  'whatsapp',
  'tarjeta',
] as const

/**
 * Opciones del selector "¿Cómo nos conociste?" del formulario de registro.
 * El valor coincide con los canales de los enlaces ?src= para que todo caiga
 * en el mismo reporte de /admin/adquisicion.
 */
export const OPCIONES_COMO_CONOCISTE: { value: string; label: string }[] = [
  { value: 'facebook', label: 'Facebook' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'tiktok', label: 'TikTok' },
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'tarjeta', label: 'Me dieron una tarjeta en la calle' },
  { value: 'invitacion', label: 'Un amigo o familiar me invitó' },
  { value: 'google', label: 'Buscando en Google' },
  { value: 'local', label: 'Visité el negocio' },
  { value: 'otro', label: 'Otro' },
]

const CANAL_LABELS: Record<string, string> = {
  facebook: 'Facebook',
  instagram: 'Instagram',
  tiktok: 'TikTok',
  whatsapp: 'WhatsApp',
  tarjeta: 'Tarjeta en la calle',
  google: 'Google',
  youtube: 'YouTube',
  volante: 'Volante',
  local: 'Visitó el negocio',
  otro: 'Otro',
  invitacion: 'Invitación de otro cliente',
  directo: 'Directo / desconocido',
}

/**
 * Etiqueta legible de un canal. Los valores con sufijo de campaña
 * ("tarjeta-parque") conservan el sufijo: "Tarjeta en la calle · parque".
 */
export function canalLabel(canal: string): string {
  if (CANAL_LABELS[canal]) return CANAL_LABELS[canal]
  const [base, ...resto] = canal.split('-')
  if (base && CANAL_LABELS[base] && resto.length) {
    return `${CANAL_LABELS[base]} · ${resto.join('-')}`
  }
  return canal.charAt(0).toUpperCase() + canal.slice(1)
}
