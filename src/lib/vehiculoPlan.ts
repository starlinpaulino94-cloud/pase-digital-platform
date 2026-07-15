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
 * vigencia y cálculos de ahorro ya se muestran como métricas; repetirlos en
 * la lista de checks satura la tarjeta.
 */
export function beneficiosSinRedundancia(beneficios: string[]): string[] {
  const redundante =
    /(\d+\s*(lavados?|usos?)\b)|ahorro|por\s+uso|por\s+lavado|vigencia|\b\d+\s*d[ií]as\b/i
  const filtrados = beneficios.filter((b) => !redundante.test(b))
  // Si el filtro se comió todo (beneficios mal cargados), mejor mostrar la
  // lista original que una tarjeta vacía.
  return filtrados.length > 0 ? filtrados : beneficios
}
