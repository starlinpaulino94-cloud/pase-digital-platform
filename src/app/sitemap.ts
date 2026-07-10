import type { MetadataRoute } from 'next'
import { getAppUrl } from '@/lib/site'

/**
 * Sitemap de rutas públicas de MembeGo. Solo incluye páginas indexables
 * (marketplace y acceso), nunca paneles privados.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const base = getAppUrl()
  const now = new Date()

  const routes = ['', '/empresas', '/promociones', '/registro-empresa', '/login', '/registro']

  return routes.map((path) => ({
    url: `${base}${path}`,
    lastModified: now,
    changeFrequency: 'daily',
    priority: path === '' ? 1 : 0.7,
  }))
}
