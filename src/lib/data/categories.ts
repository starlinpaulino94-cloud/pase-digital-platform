/**
 * Catálogo base de categorías de negocio (FASE 2 · Marketplace).
 * Fuente única de verdad para el seed local (`runSeed`) y espejo del SQL
 * idempotente `prisma/legacy_sql/seed_business_categories.sql` usado en prod.
 *
 * Sin iconos: las categorías se muestran solo con su nombre (look profesional).
 * Son extensibles: basta con añadir una fila aquí y en el SQL.
 */
export interface SeedCategory {
  name: string
  slug: string
  order: number
}

export const BUSINESS_CATEGORIES: SeedCategory[] = [
  { name: 'Restaurantes', slug: 'restaurantes', order: 1 },
  { name: 'Cafeterías', slug: 'cafeterias', order: 2 },
  { name: 'Lavados', slug: 'lavados', order: 3 },
  { name: 'Gimnasios', slug: 'gimnasios', order: 4 },
  { name: 'Spa', slug: 'spa', order: 5 },
  { name: 'Salud', slug: 'salud', order: 6 },
  { name: 'Clínicas', slug: 'clinicas', order: 7 },
  { name: 'Farmacias', slug: 'farmacias', order: 8 },
  { name: 'Belleza', slug: 'belleza', order: 9 },
  { name: 'Veterinarias', slug: 'veterinarias', order: 10 },
  { name: 'Tiendas', slug: 'tiendas', order: 11 },
  { name: 'Entretenimiento', slug: 'entretenimiento', order: 12 },
  { name: 'Hoteles', slug: 'hoteles', order: 13 },
  { name: 'Servicios', slug: 'servicios', order: 14 },
  { name: 'Educación', slug: 'educacion', order: 15 },
  { name: 'Automotriz', slug: 'automotriz', order: 16 },
  { name: 'Otros', slug: 'otros', order: 17 },
]
