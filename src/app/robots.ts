import type { MetadataRoute } from 'next'
import { getAppUrl } from '@/lib/site'

/**
 * Robots de MembeGo: permite indexar la Landing y el marketplace público,
 * bloquea explícitamente los paneles privados y rutas de aplicación. Enlaza el
 * sitemap. (Preparado para la separación Landing/App: cuando existan dominios
 * separados, cada proyecto expone su propio robots.)
 */
export default function robots(): MetadataRoute.Robots {
  const base = getAppUrl()
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/admin',
          '/superadmin',
          '/cliente',
          '/empleado',
          '/onboarding',
          '/api',
          '/monitoring',
          '/login',
          '/acceso',
          '/recuperar',
          '/actualizar-password',
          '/confirmar',
          '/auth',
          '/r/',
          '/i/',
          '/invita/',
          '/invitacion',
          '/mis-membresias',
          '/membresia',
        ],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
    host: base,
  }
}
