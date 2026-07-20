import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  })

// Reutilizar el cliente también en producción: si el bundler evalúa este
// módulo más de una vez (chunks/workers), cada evaluación abriría un pool
// de conexiones propio contra el pooler de Supabase.
globalForPrisma.prisma = prisma

// Guardia de configuración (una vez por proceso): en serverless (Vercel),
// conectar al puerto DIRECTO de Postgres agota las conexiones de Supabase
// bajo carga → cada click espera el pool (hasta 10 s) y termina en P2024.
// El síntoma es "toda la app lenta y con errores de carga". La conexión de la
// app DEBE ir por el transaction pooler (puerto 6543, pgbouncer=true).
if (process.env.NODE_ENV === 'production' && process.env.DATABASE_URL) {
  try {
    const u = new URL(process.env.DATABASE_URL)
    const usaPooler = u.port === '6543' || u.searchParams.has('pgbouncer')
    if (!usaPooler) {
      console.warn(
        '[prisma] DATABASE_URL apunta al puerto directo de Postgres ' +
          `(${u.port || '5432'}). En Vercel esto agota las conexiones y frena toda la app. ` +
          'Usa la cadena del Transaction Pooler de Supabase (puerto 6543, ?pgbouncer=true&connection_limit=1) ' +
          'y deja la directa solo en DIRECT_URL (migraciones).'
      )
    }
  } catch {
    /* URL inválida: Prisma dará su propio error al conectar */
  }
}
