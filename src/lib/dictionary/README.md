# Business Data Dictionary — Fase 6

La **fuente oficial** de todas las variables de negocio del ecosistema MembeGo.
Cualquier dato que use una regla, promoción, membresía, QR o automatización debe
existir aquí primero. El Rule Engine **no accede a propiedades del ORM**: consulta
el diccionario, que resuelve cada variable a su ruta en el Context Model (Fase 5)
y a su tipo (Fase 2).

> **Alcance:** SOLO el catálogo de datos. Sin lógica de negocio, sin fórmulas de
> variables calculadas (solo su descriptor), sin UI. El catálogo estándar vive en
> código; las variables custom/por-empresa se persisten. Ningún flujo de la app lo
> consume aún.

---

## 1. Arquitectura

```
src/lib/dictionary/
├── index.ts                          # API pública + createDictionaryService()
├── domain/
│   ├── taxonomy.ts                   # tipos semánticos → DataType, categorías, orígenes
│   ├── types.ts                      # DataDefinition + ValidationRules + I18n + CalculatedDescriptor
│   ├── dictionary.ts                 # registro INDEXADO (búsqueda/alias/descubrimiento)
│   ├── validation.ts                 # validateValue (reutilizable)
│   └── catalog.ts                    # catálogo ESTÁNDAR (variables globales en código)
├── application/
│   ├── ports.ts                      # DictionaryRepository (persistencia custom)
│   ├── dictionary-service.ts         # API interna (register/update/version/search/…)
│   └── rule-engine-bridge.ts         # resolveConditionField: variable → field + dataType
└── infrastructure/
    ├── prisma-dictionary-repository.ts
    └── mappers.ts
```

---

## 2. Modelo de datos

```
┌───────────────┐ 0..1  * ┌──────────────────────────────┐ 1   * ┌────────────────────────────────────┐
│   companies   │────────▶│  data_dictionary_variables   │──────▶│ data_dictionary_variable_versions  │
└───────────────┘         │ key/displayName/semanticType │       │ version + snapshot (histórico)     │
   companyId null =       │ category/source/contextPath  │       └────────────────────────────────────┘
   variable GLOBAL        │ aliases[]/validation/i18n    │
                          │ calculated/metadata/status   │
                          └──────────────────────────────┘
     @@unique(companyId, key)   ·   índices por category y status
```

- `companyId` null → variable **global** (además del catálogo estándar en código);
  con valor → **específica de empresa** (multi-tenant).
- `contextPath` apunta al Context Model (ej. `cliente.puntos`); **nunca** a una
  columna del ORM.
- `aliases[]`, `validation`, `i18n`, `calculated`, `metadata` cubren alias,
  validaciones, internacionalización, variables calculadas y documentación.

---

## 3. Definición de una variable (`DataDefinition`)

`id`, `key` (nombre técnico), `displayName`, `description`, `semanticType`,
`category`, `subcategory`, `ownerModule`, `source`, `contextPath`, `format`,
`unit`, `aliases`, `status`, `version`, `companyId`, `validation`, `i18n`,
`calculated`, `metadata`. **Ningún nombre de columna del ORM.**

## 4. Categorías iniciales

Sistema, Empresa, Sucursal, Cliente, Empleado, Usuario, Compra, Factura, Pago,
Producto, Categoría, Servicio, Vehículo, Reserva, Mesa, Habitación, Mascota,
Paciente, Membresía, QR, Beneficio, Promoción, Campaña, Evento, Puntos, Créditos,
Referidos, Dispositivo, Ubicación, Fecha, Hora, **Variables Calculadas**.
Añadir una categoría = usar una etiqueta nueva; la arquitectura no cambia.

## 5. Tipos de datos

**Semánticos** (ricos, para formato/validación/UI): TEXT, INTEGER, DECIMAL,
BOOLEAN, DATE, TIME, DATETIME, LIST, ENUM, OBJECT, JSON, MONEY, PERCENT, DURATION,
COORDINATES. Cada uno **mapea** a un `DataType` del Rule Engine
(`toRuleDataType`) → así el motor valida compatibilidad de operadores y **no
permite comparaciones incompatibles**.

## 6. Alias

Una variable se conoce por su clave y por cualquier `alias`: `cliente.nombre`,
`customer.name`, `nombreCliente` → **la misma definición** (`resolveAlias`).
Índice de alias en memoria para resolución O(1).

## 7. Variables calculadas (arquitectura)

`source: 'CALCULATED'` + `calculated: { kind, inputs }` describen variables que no
existen físicamente (edad del cliente, visitas del último mes, días restantes,
antigüedad de membresía…). **Sin cálculo todavía**: solo el modelo. El puente al
Rule Engine las rechaza por ahora (no tienen `contextPath`).

## 8. Internacionalización

`i18n: { es: {name, description, help}, en: {…} }`. Preparado para múltiples
idiomas y ayuda contextual; sin traducción automática.

## 9. Validaciones reutilizables

`ValidationRules` (tipo obligatorio, rango, longitud, valores permitidos, patrón)
+ `validateValue(def, value) → ValidationIssue[]`. Otros módulos reutilizan esta
validación sin duplicarla.

---

## 10. API interna (`DictionaryService`)

```ts
import { createDictionaryService } from '@/lib/dictionary'
const dict = createDictionaryService()
await dict.load(companyId)                    // fusiona variables custom/por-empresa

dict.search({ category: 'Cliente', text: 'puntos' })  // descubrimiento
dict.resolveAlias('customer.name')            // alias → definición
dict.categories(); dict.semanticTypes(); dict.modules()
dict.documentation(id)                        // i18n + validación + metadata

await dict.register({ key: 'cliente.nivelFidelidad', displayName: 'Nivel', semanticType: 'ENUM', category: 'Cliente', /*…*/ })
await dict.update(id, { description: '…' })
await dict.version(id)                         // historial inmutable + bump
await dict.disable(id)
```

Búsqueda/descubrimiento/autocompletado se apoyan en índices en memoria (por id,
clave, alias y categoría) → preparado para miles de variables.

---

## 11. Cómo el Rule Engine consume el diccionario

Una condición ya **no** referencia una cadena suelta: referencia una **variable
del diccionario** (por id, clave o alias). El puente la resuelve y valida:

```ts
import { resolveConditionField } from '@/lib/dictionary'

const r = resolveConditionField(dict.catalog(), 'customer.points') // alias
if (r.ok) {
  // r.spec = { field: 'cliente.puntos', dataType: 'NUMBER', variable }
  const condition = {
    id, conditionType: 'field',
    field: r.spec.field,        // ruta del Context Model (Fase 5)
    dataType: r.spec.dataType,  // tipo para el Rule Engine (Fase 2)
    operator: 'gte', value: 100, valueType: 'NUMBER', order: 0,
  }
}
```

El puente **rechaza** referencias a variables inexistentes, desactivadas o
calculadas (sin ruta). Así el diccionario es la única fuente válida de variables
y se evita comparar tipos incompatibles.

---

## 12. Confirmación de no-regresión

Aditivo: enum + 2 tablas nuevas (`20260729_add_data_dictionary`) y un módulo
nuevo en `src/lib/dictionary/`. No se tocó ningún archivo ni tabla existente.
Ningún flujo de la app lo invoca. Verificado con `tsc --noEmit` (0 errores),
`eslint` del módulo (0 warnings) y un smoke test de 29 aserciones (catálogo
estándar, búsqueda/descubrimiento, alias, tipos semánticos→DataType, validación,
variables calculadas, register/update/version, y el puente real: variable →
field+dataType → condición evaluada por el Rule Engine).
