/**
 * Compatibilidad vehículo → plan (Product Thinking del grid de planes).
 *
 * El sistema ya conoce los vehículos del cliente; en vez de obligarlo a leer
 * las listas de modelos en letra pequeña ("Toyota Passo, Kia Picanto…"),
 * buscamos su modelo/marca dentro del nombre y la descripción de cada plan y
 * pre-seleccionamos el compatible. Si ningún plan menciona el vehículo, no se
 * recomienda nada (mejor no recomendar que recomendar mal).
 */

export interface VehiculoLite {
  id: string
  marca: string
  modelo: string
}

export interface PlanCompatible {
  id: string
  nombre: string
  descripcion: string | null
}

/** Normaliza para comparar: minúsculas y sin acentos. */
function norm(s: string): string {
  return s
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .trim()
}

/**
 * Plan recomendado para un vehículo, o null si ninguno lo menciona.
 * 1º intento: "marca modelo" completo (más específico).
 * 2º intento: solo el modelo (los modelos suelen ser distintivos; la marca
 *    sola aparece en varias listas y daría falsos positivos).
 */
export function planRecomendadoPara(
  vehiculo: VehiculoLite,
  planes: PlanCompatible[]
): string | null {
  const marca = norm(vehiculo.marca)
  const modelo = norm(vehiculo.modelo)
  if (!modelo) return null

  const textos = planes.map((p) => ({
    id: p.id,
    texto: norm(`${p.nombre} ${p.descripcion ?? ''}`),
  }))

  const completo = marca ? `${marca} ${modelo}` : null
  if (completo) {
    const porCompleto = textos.find((t) => t.texto.includes(completo))
    if (porCompleto) return porCompleto.id
  }

  const porModelo = textos.find((t) => t.texto.includes(modelo))
  return porModelo?.id ?? null
}

/**
 * Filtra beneficios redundantes con los badges de la tarjeta: usos, días de
 * vigencia y cálculos de ahorro ya se muestran como métricas.
 *
 * Solo se descarta un beneficio si la línea COMPLETA es esa métrica repetida
 * ("4 lavados", "30 días de vigencia", "Equivale a RD$300 por uso"). Antes
 * bastaba con que la frase MENCIONARA lavados/ahorro/días y en un car wash
 * eso vaciaba la lista: "Secado y aspirado en cada lavado" o "Ahorra en cada
 * visita" desaparecían y las tarjetas quedaban con un solo beneficio.
 */
export function beneficiosSinRedundancia(beneficios: string[]): string[] {
  const esSoloMetrica = (b: string) => {
    const s = b.trim()
    return (
      // "4 lavados", "4 usos incluidos", "4 lavados al mes"
      /^\d+\s*(lavados?|usos?)(\s+(incluidos?|al\s+mes|mensuales?|por\s+mes))?\.?$/i.test(s) ||
      // "30 días", "vigencia 30 días", "30 días de vigencia", "válido por 30 días"
      /^(v[aá]lido\s+por\s+|vigencia(\s+de)?\s+)?\d+\s*d[ií]as(\s+de\s+vigencia)?\.?$/i.test(s) ||
      // "Equivale a RD$300 por uso/lavado" (ya sale bajo el precio)
      /^equivale\s+a\s+\S+\s+por\s+(uso|lavado)\.?$/i.test(s)
    )
  }
  const filtrados = beneficios.filter((b) => !esSoloMetrica(b))
  // Si el filtro se comió todo (beneficios mal cargados), mejor mostrar la
  // lista original que una tarjeta vacía.
  return filtrados.length > 0 ? filtrados : beneficios
}
