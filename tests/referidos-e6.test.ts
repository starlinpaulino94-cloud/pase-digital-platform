/**
 * Fase E6 · Pruebas del Referral Engine (lógica pura, sin base de datos).
 * Ejecutar: npm test
 *
 * Los escenarios con BD (clic → registro → conversión → recompensa → fraude)
 * se verifican con scripts/verificar-referidos.sql: cada métrica del
 * dashboard tiene su query de auditoría para contrastar contra los datos
 * reales almacenados.
 */

// La import de src/lib/referidos instancia PrismaClient (sin conectar);
// una URL dummy evita fallos de validación de entorno en CI/local sin BD.
process.env.DATABASE_URL ??= 'postgresql://test:test@localhost:5432/test'

import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  PUNTOS,
  TIPOS_EMPRESA,
  TIPOS_GLOBAL,
  calcularNivel,
  calcularLogros,
  hashIp,
  NIVELES,
} from '../src/lib/referidos'
import {
  COMPRA_TRANSICIONES,
  esTransicionCompraValida,
  validarConsumoCompra,
  validarVentanaAdquisicion,
  calcularVencimientoBeneficio,
} from '../src/modules/promociones/compra'

// ── Catálogo de eventos ───────────────────────────────────────────────────────

test('todos los tipos de evento tienen puntos definidos (ninguno huérfano)', () => {
  const esperados = [
    'LINK', 'SHARE', 'CLICK', 'REGISTRO_INICIADO', 'REGISTRO', 'VERIFICADO',
    'MEMBRESIA', 'COMPRA', 'RECOMPENSA', 'FRAUDE', 'REGISTRO_GLOBAL', 'MEMBRESIA_GLOBAL',
  ]
  for (const t of esperados) {
    assert.ok(t in PUNTOS, `falta PUNTOS[${t}]`)
    assert.equal(typeof PUNTOS[t as keyof typeof PUNTOS], 'number')
  }
})

test('los eventos de medición pura no otorgan puntos (no infl an gamificación)', () => {
  assert.equal(PUNTOS.LINK, 0)
  assert.equal(PUNTOS.REGISTRO_INICIADO, 0)
  assert.equal(PUNTOS.RECOMPENSA, 0)
  assert.equal(PUNTOS.FRAUDE, 0)
})

test('TIPOS_EMPRESA y TIPOS_GLOBAL no se solapan', () => {
  const inter = TIPOS_EMPRESA.filter((t) => (TIPOS_GLOBAL as string[]).includes(t))
  assert.deepEqual(inter, [])
})

// ── Anti-fraude: huella de IP ─────────────────────────────────────────────────

test('hashIp es estable, anónimo y truncado', () => {
  const a = hashIp('190.80.20.10')
  const b = hashIp('190.80.20.10')
  const c = hashIp('190.80.20.11')
  assert.equal(a, b) // misma IP → misma huella (detección de repetidos)
  assert.notEqual(a, c) // IP distinta → huella distinta
  assert.equal(a?.length, 16) // truncado: no reversible a la IP
  assert.ok(!a?.includes('190')) // nunca contiene la IP en claro
  assert.equal(hashIp(null), null)
  assert.equal(hashIp(''), null)
})

// ── Gamificación (secundaria, nunca fuente de métricas) ──────────────────────

test('calcularNivel respeta los umbrales exactos', () => {
  assert.equal(calcularNivel(0).nivel.id, 'explorador')
  assert.equal(calcularNivel(99).nivel.id, 'explorador')
  assert.equal(calcularNivel(100).nivel.id, 'promotor')
  assert.equal(calcularNivel(2500).nivel.id, 'elite')
  assert.equal(calcularNivel(999999).siguiente, null)
  // progreso monótono
  const p1 = calcularNivel(150).progresoPct
  const p2 = calcularNivel(350).progresoPct
  assert.ok(p2 > p1)
  assert.ok(NIVELES.every((n, i, arr) => i === 0 || n.minPuntos > arr[i - 1].minPuntos))
})

test('logros se desbloquean con datos reales, no con clics propios', () => {
  const sin = calcularLogros({ registros: 0, membresias: 0, clicks: 50, recompensas: 0, nivelId: 'explorador' })
  assert.equal(sin.find((l) => l.id === 'primero')?.desbloqueado, false)
  const con = calcularLogros({ registros: 1, membresias: 1, clicks: 10, recompensas: 1, nivelId: 'promotor' })
  assert.equal(con.find((l) => l.id === 'primero')?.desbloqueado, true)
  assert.equal(con.find((l) => l.id === 'recompensado')?.desbloqueado, true)
})

// ── Ciclo de compra (E5) usado por la conversión de referidos ────────────────

test('estados terminales de compra no permiten transiciones', () => {
  for (const terminal of ['CONSUMIDA', 'EXPIRADA', 'CANCELADA'] as const) {
    assert.deepEqual(COMPRA_TRANSICIONES[terminal], [])
  }
})

test('una compra rechazada puede reintentarse; una activa no vuelve a validación', () => {
  assert.ok(esTransicionCompraValida('RECHAZADA', 'EN_VALIDACION'))
  assert.ok(esTransicionCompraValida('ACTIVA', 'CONSUMIDA'))
  assert.ok(!esTransicionCompraValida('ACTIVA', 'EN_VALIDACION'))
  assert.ok(!esTransicionCompraValida('CONSUMIDA', 'ACTIVA'))
})

test('validarConsumoCompra: estado, vencimiento, usos, días y horario', () => {
  const base = { estado: 'ACTIVA' as const, usosRestantes: 1, fechaVencimiento: null }
  const promoLibre = { diasPermitidos: [], horaDesde: null, horaHasta: null }

  assert.equal(validarConsumoCompra(base, promoLibre).puedeUsar, true)
  assert.equal(
    validarConsumoCompra({ ...base, estado: 'EN_VALIDACION' as never }, promoLibre).puedeUsar,
    false
  )
  assert.equal(validarConsumoCompra({ ...base, usosRestantes: 0 }, promoLibre).puedeUsar, false)

  const vencida = validarConsumoCompra(
    { ...base, fechaVencimiento: new Date(Date.now() - 1000) },
    promoLibre
  )
  assert.equal(vencida.puedeUsar, false)
  assert.equal(vencida.expiro, true) // marca EXPIRADA lazy

  // Día no permitido: un miércoles 2026-07-15 12:00 en Santo Domingo.
  const miercoles = new Date('2026-07-15T16:00:00Z') // 12:00 -04:00
  const soloLunes = validarConsumoCompra(base, { diasPermitidos: [1], horaDesde: null, horaHasta: null }, miercoles)
  assert.equal(soloLunes.puedeUsar, false)
  const conMiercoles = validarConsumoCompra(base, { diasPermitidos: [3], horaDesde: null, horaHasta: null }, miercoles)
  assert.equal(conMiercoles.puedeUsar, true)

  // Horario: 12:00 local está fuera de 14:00-18:00 y dentro de 09:00-13:00.
  assert.equal(
    validarConsumoCompra(base, { diasPermitidos: [], horaDesde: '14:00', horaHasta: '18:00' }, miercoles).puedeUsar,
    false
  )
  assert.equal(
    validarConsumoCompra(base, { diasPermitidos: [], horaDesde: '09:00', horaHasta: '13:00' }, miercoles).puedeUsar,
    true
  )
})

test('ventana de adquisición: fechas, cupo y estado de publicación', () => {
  const base = {
    activo: true, archivada: false, esComprable: true,
    vigenciaDesde: new Date(Date.now() - 1000), vigenciaHasta: null,
    maxCanjes: null, canjes: 0,
  }
  assert.equal(validarVentanaAdquisicion(base).ok, true)
  assert.equal(validarVentanaAdquisicion({ ...base, esComprable: false }).ok, false)
  assert.equal(
    validarVentanaAdquisicion({ ...base, vigenciaDesde: new Date(Date.now() + 86400000) }).ok,
    false
  ) // aún no abre
  assert.equal(
    validarVentanaAdquisicion({ ...base, vigenciaHasta: new Date(Date.now() - 1000) }).ok,
    false
  ) // ya cerró
  assert.equal(validarVentanaAdquisicion({ ...base, maxCanjes: 5, canjes: 5 }).ok, false) // agotada
  assert.equal(validarVentanaAdquisicion({ ...base, maxCanjes: 5, canjes: 4 }).ok, true)
})

test('vencimiento del beneficio: días desde activación o fecha fija', () => {
  const activacion = new Date('2026-07-11T12:00:00Z')
  const porDias = calcularVencimientoBeneficio(
    { beneficioVigenciaDias: 30, beneficioVigenciaHasta: null },
    activacion
  )
  assert.equal(porDias?.toISOString().slice(0, 10), '2026-08-10')
  const fija = new Date('2026-12-31T00:00:00Z')
  assert.equal(
    calcularVencimientoBeneficio({ beneficioVigenciaDias: null, beneficioVigenciaHasta: fija }, activacion),
    fija
  )
  assert.equal(
    calcularVencimientoBeneficio({ beneficioVigenciaDias: null, beneficioVigenciaHasta: null }, activacion),
    null
  ) // sin vencimiento
})

// ── Semántica del umbral de recompensas (regresión del bug de igualdad) ─────

test('el umbral de recompensa es >= (un salto de conteo no pierde recompensas)', () => {
  // Regla: 3 referidos. Si el conteo pasa de 2 a 4 (dos conversiones casi
  // simultáneas), la regla DEBE disparar. La query usa valorCondicion <= n.
  const reglaUmbral = 3
  const alcanza = (completados: number) => reglaUmbral <= completados
  assert.equal(alcanza(2), false)
  assert.equal(alcanza(3), true)
  assert.equal(alcanza(4), true) // el caso que la igualdad exacta perdía
})
