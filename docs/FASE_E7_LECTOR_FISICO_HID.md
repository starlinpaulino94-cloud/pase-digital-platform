# Fase E7 — Soporte para lectores QR y código de barras (HID)

El escáner deja de tener "Ingresar código manualmente" como opción; ahora
soporta **lectores físicos universales** (USB / Bluetooth / inalámbricos) que
emulan un teclado (HID Keyboard), además de la cámara. Ambos modos siguen
**exactamente el mismo flujo**.

## Qué cambió en la interfaz

- ❌ Eliminado el bloque "Ingresar código manualmente".
- ✅ Selector de modo **Cámara | Lector físico** (cambia sin recargar).
- ✅ Panel del lector con estados animados y compatibilidad visible (USB /
  Bluetooth / Inalámbrico).
- ✅ En la vista de cámara, el botón de respaldo ahora es "Usar lector físico".

## Cómo funciona el lector (universal, sin fabricante)

Un lector QR/código de barras HID "teclea" el contenido del código muy rápido
y termina con Enter. El sistema:

1. En modo lector, coloca el foco en un **campo oculto** de captura.
2. `HidScanBuffer` (`src/lib/scanner/hid.ts`, lógica pura) acumula las teclas y,
   por la **cadencia entre ellas** (mediana ≤ 45 ms), distingue un lector físico
   de tecleo humano — **detección automática**, sin configurar el modelo.
3. Al recibir **Enter** (o Tab), entrega el token → `buscarPorToken` → el MISMO
   flujo que la cámara: Rule/Validation → Transaction Engine → Action Engine →
   Receipt Engine → resultado.
4. Tras cada lectura, el foco se **recupera solo** para escanear clientes de
   forma continua, sin clics.

No requiere interacción del usuario: si el lector envía Enter (lo estándar), la
validación arranca sola.

## Estados del lector (con animación)

`Lector listo · Esperando escaneo…` → `Recibiendo código…` → `Código recibido`
→ `Validando…` → resultado (pantallas de aprobación/rechazo existentes). Cuando
se detecta un lector físico por primera vez, aparece «Lector físico detectado».

## Configuración por empresa

- Campo `Company.escanerModo` (`"camara"` | `"lector"`): método predeterminado.
- El admin lo fija desde la propia pantalla del escáner ("Hacer de … el
  predeterminado de la empresa" → `guardarEscanerModoEmpresa`).
- Cada operador puede cambiar de modo en pantalla; su elección se recuerda por
  usuario (localStorage) sin recargar.

## Accesibilidad

Atajos de teclado: **Alt+C** → Cámara, **Alt+L** → Lector físico. (Las
combinaciones con modificador no se capturan como código.)

## Arquitectura extensible (1D/2D/QR/NFC/RFID)

`src/lib/scanner/hid.ts` define `ScanSourceKind` (`camera | hid | nfc | rfid`)
y `ScanResult { token, source }`. La lógica principal NUNCA depende del origen:
**toda fuente entrega un `token: string`** que sigue el mismo flujo. Añadir NFC
o RFID en el futuro = una fuente nueva que emite el token; el flujo
(`buscarPorToken` y motores) no cambia. Lectores 1D/2D/QR ya funcionan hoy con
el mismo camino HID (cualquier lector que emule teclado).

## Piezas

| Pieza | Ruta |
|---|---|
| Motor de captura HID (puro) | `src/lib/scanner/hid.ts` |
| Hook de lector (foco, estados, continuo) | `src/components/scanner/useHidScanner.ts` |
| Escáner (modo cámara/lector, atajos) | `src/components/scanner/ScannerClient.tsx` |
| Config de empresa (server action) | `src/modules/scanner/actions.ts` |
| Pruebas del motor HID | `tests/scanner-hid-e7.test.ts` (10, `npm test`) |

## Migración

- Prisma: `prisma/migrations/20260742_scanner_modo/`
- Supabase (idempotente): `scripts/supabase-20260742-scanner-modo.sql` (1 fila OK).

## Validación (criterios de aceptación)

- [x] "Ingresar código manualmente" eliminado.
- [x] Modo de escaneo mediante lector físico.
- [x] Detección automática del código enviado por el lector (por cadencia +
      Enter), sin clic tras cada escaneo (foco recuperado).
- [x] El mismo flujo funciona con cámara y con lector (`buscarPorToken`).
- [x] Arquitectura preparada para 1D/2D/QR/NFC/RFID sin tocar la lógica principal.
- [x] Universal: cualquier lector HID estándar; sin dependencia de fabricante.
- [x] Config por empresa + cambio en pantalla sin recargar + atajos de teclado.
- [x] Pruebas del motor de captura (10) en verde.

**Paso del operador:** ejecutar `scripts/supabase-20260742-scanner-modo.sql`
en Supabase (1 fila OK).
