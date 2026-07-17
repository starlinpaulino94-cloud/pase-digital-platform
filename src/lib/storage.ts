/** Nombre de archivo único para subidas a Supabase Storage. */
export function uniqueFileName(ext: string): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`
}
