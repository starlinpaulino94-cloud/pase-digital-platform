// Invita y Gana · contenido editable del módulo del cliente.
// Lógica PURA (segura en cliente y servidor): normaliza el JSON guardado en
// CampanaInvitacion.contenido a una forma estable con textos por defecto.
//
// Objetivo: que el superadmin pueda editar TODO el texto que ve el cliente en
// el módulo "Invita y Gana" (subtítulo, etiquetas, nota, mensaje de compartir,
// títulos de sección, nombres de las estadísticas, historial, estado vacío y
// las etiquetas de los botones) desde el editor de campañas. Sin campos
// guardados, el módulo usa exactamente los textos que tenía antes: no cambia
// nada hasta que alguien los edite.

export interface InvitaContenido {
  /** Frase corta bajo el título (ej: "Comparte · tus amigos ganan · tú también"). */
  subtitulo: string
  /** Antetítulo de la tarjeta del beneficio (ej: "Tus amigos reciben al registrarse"). */
  beneficioEtiqueta: string
  /** Nota bajo el beneficio (ej: "Invita a todos los que quieras — sin límite de invitaciones."). */
  notaSinLimite: string
  /**
   * Plantilla del mensaje que se comparte por WhatsApp/redes. Usa {regalo}
   * como marcador del beneficio (la primera frase de la descripción).
   */
  mensajeCompartir: string
  /** Etiqueta del botón principal de compartir. */
  ctaCompartir: string
  /** Etiqueta del botón para copiar el enlace. */
  ctaCopiar: string
  /** Título de la sección de estadísticas del cliente. */
  progresoTitulo: string
  /** Nombre de la estadística "Invitaciones enviadas". */
  statInvitaciones: string
  /** Nombre de la estadística "Personas registradas". */
  statRegistradas: string
  /** Nombre de la estadística "Recompensas obtenidas". */
  statRecompensas: string
  /** Nombre de la estadística "Beneficios activos". */
  statBeneficios: string
  /** Título de la lista de personas registradas. */
  historialTitulo: string
  /** Texto cuando aún nadie se ha registrado con el enlace. */
  historialVacio: string
  /** Título cuando no hay ninguna campaña activa. */
  sinCampanaTitulo: string
  /** Texto cuando no hay ninguna campaña activa. */
  sinCampanaTexto: string
  /** Compartir · título Open Graph (vacío = usar el título de la campaña). */
  ogTitulo: string
  /** Compartir · descripción Open Graph (vacío = usar la descripción). */
  ogDescripcion: string
  /** Compartir · imagen de la tarjeta 1200×630 (vacío = banner/imagen de la campaña). */
  shareImagenUrl: string
  /** CTA de la landing promocional. */
  landingCta: string
}

export const INVITA_CONTENIDO_DEFAULT: InvitaContenido = {
  subtitulo: 'Comparte · tus amigos ganan · tú también',
  beneficioEtiqueta: 'Tus amigos reciben al registrarse',
  notaSinLimite: 'Invita a todos los que quieras — sin límite de invitaciones.',
  mensajeCompartir:
    '🎁 {regalo} — GRATIS, solo por crear tu cuenta. ⏳ Es por tiempo limitado y los cupos se agotan: reclámalo ahora antes de que se acabe. 👇',
  ctaCompartir: 'Compartir ahora',
  ctaCopiar: 'Copiar enlace',
  progresoTitulo: 'Mi progreso',
  statInvitaciones: 'Invitaciones enviadas',
  statRegistradas: 'Personas registradas',
  statRecompensas: 'Recompensas obtenidas',
  statBeneficios: 'Beneficios activos',
  historialTitulo: 'Personas que se registraron gracias a ti',
  historialVacio: 'Aún nadie se ha registrado con tu enlace. ¡Compártelo y aparecerán aquí!',
  sinCampanaTitulo: 'Sin campañas activas',
  sinCampanaTexto: 'No hay campañas de invitación activas en este momento. Vuelve pronto.',
  ogTitulo: '',
  ogDescripcion: '',
  shareImagenUrl: '',
  landingCta: 'Quiero mi regalo',
}

/** Claves editables, en el orden en que se muestran en el editor. */
export const INVITA_CONTENIDO_CAMPOS: {
  key: keyof InvitaContenido
  label: string
  hint?: string
  multiline?: boolean
}[] = [
  { key: 'subtitulo', label: 'Subtítulo (bajo el título)' },
  { key: 'beneficioEtiqueta', label: 'Antetítulo del beneficio' },
  { key: 'notaSinLimite', label: 'Nota bajo el beneficio' },
  {
    key: 'mensajeCompartir',
    label: 'Mensaje al compartir',
    hint: 'Se envía por WhatsApp/redes. Usa {regalo} para insertar el beneficio.',
    multiline: true,
  },
  { key: 'ctaCompartir', label: 'Botón · Compartir' },
  { key: 'ctaCopiar', label: 'Botón · Copiar enlace' },
  { key: 'progresoTitulo', label: 'Título de “Mi progreso”' },
  { key: 'statInvitaciones', label: 'Estadística · Invitaciones enviadas' },
  { key: 'statRegistradas', label: 'Estadística · Personas registradas' },
  { key: 'statRecompensas', label: 'Estadística · Recompensas obtenidas' },
  { key: 'statBeneficios', label: 'Estadística · Beneficios activos' },
  { key: 'historialTitulo', label: 'Título del historial' },
  { key: 'historialVacio', label: 'Historial vacío', multiline: true },
  { key: 'sinCampanaTitulo', label: 'Sin campaña · título' },
  { key: 'sinCampanaTexto', label: 'Sin campaña · texto', multiline: true },
]

/**
 * Share Engine · campos de la sección "Compartir" del editor de campañas.
 * Controlan la tarjeta enriquecida que ven WhatsApp/Facebook/Telegram/X al
 * compartir el enlace, y el CTA de la landing. Se guardan en el mismo JSON
 * `contenido` (sin migración de BD).
 */
export const INVITA_COMPARTIR_CAMPOS: {
  key: keyof InvitaContenido
  label: string
  hint?: string
  multiline?: boolean
}[] = [
  {
    key: 'ogTitulo',
    label: 'Título de la vista previa (Open Graph)',
    hint: 'Lo que se lee en la tarjeta al compartir el enlace. Vacío = título de la campaña.',
  },
  {
    key: 'ogDescripcion',
    label: 'Descripción de la vista previa (Open Graph)',
    hint: 'Texto persuasivo bajo el título de la tarjeta. Vacío = descripción de la campaña.',
    multiline: true,
  },
  {
    key: 'landingCta',
    label: 'Botón de la landing (CTA)',
    hint: 'El botón que revela el registro en la landing promocional.',
  },
]

/** Claves que normaliza el módulo (textos del cliente + sección Compartir). */
const TODAS_LAS_CLAVES: (keyof InvitaContenido)[] = [
  ...INVITA_CONTENIDO_CAMPOS.map((c) => c.key),
  ...INVITA_COMPARTIR_CAMPOS.map((c) => c.key),
  'shareImagenUrl',
]

/**
 * Normaliza el contenido crudo. Cada campo ausente/vacío cae al texto por
 * defecto, así el módulo nunca queda con huecos aunque solo se edite una parte.
 */
export function normalizeInvitaContenido(raw: unknown): InvitaContenido {
  const o = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {}
  const out = { ...INVITA_CONTENIDO_DEFAULT }
  for (const key of TODAS_LAS_CLAVES) {
    const v = o[key]
    if (typeof v === 'string' && v.trim()) out[key] = v.trim()
  }
  return out
}

/**
 * Aplica la plantilla del mensaje de compartir insertando el beneficio.
 * Reemplaza {regalo} (o {beneficio}) por el texto corto del regalo.
 */
export function mensajeCompartirConRegalo(plantilla: string, regalo: string): string {
  const base = plantilla.trim() || INVITA_CONTENIDO_DEFAULT.mensajeCompartir
  return base.replace(/\{regalo\}|\{beneficio\}/gi, regalo)
}
