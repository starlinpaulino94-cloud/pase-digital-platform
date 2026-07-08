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
