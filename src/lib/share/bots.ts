/**
 * Share Engine · detección de robots de vista previa y crawlers.
 *
 * Los robots (WhatsApp, Facebook, Telegram, X, Google…) tienen un presupuesto
 * de ~5 segundos para leer la vista previa de un enlace: el camino que
 * recorren debe ser lo más rápido posible (sin registros de eventos, sin
 * lookups extra) y sus visitas no deben contaminar la analítica del embudo.
 * Mismo patrón que usa /r/[code].
 */
export const PREVIEW_BOT_RE =
  /whatsapp|facebookexternalhit|telegrambot|twitterbot|slackbot|discordbot|linkedinbot|skypeuripreview|viber|pinterest|googlebot|bingbot|applebot|yandex|ahrefs|semrush|bot\b|crawler|spider|preview|fetch|monitor|curl|wget|python|node-fetch|axios|okhttp|java\/|headless/i

export function esBotDeVistaPrevia(userAgent: string | null | undefined): boolean {
  return PREVIEW_BOT_RE.test(userAgent ?? '')
}
