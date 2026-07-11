# Fase E3 — Refactorización de la experiencia de estrategias comerciales

**Decisión arquitectónica:** la Business Strategy Library NO forma parte de la
interfaz de las empresas. Es una **capacidad interna** de la plataforma. Las
empresas solo trabajan con elementos reales de su negocio (promociones, planes,
campañas…), y cada módulo ofrece su propia sección de **Plantillas**.

```
Empresa → Promociones → Nueva promoción
                          ├─ Crear desde cero
                          └─ Usar plantilla → copiar → editar → publicar
```

---

## 1. Business Strategy Core (interno, sin UI)

`src/lib/business-strategy-core/` — componente interno responsable de:

| Responsabilidad | Implementación |
|---|---|
| Strategy Library | `StrategyCatalog` por módulo (35 estrategias: 15 promo + 20 membresía) |
| Template Catalog | `TemplateCatalog` con `TemplateMetadata` (87 plantillas: 54 promo + 33 plan) |
| Template Generator | `TemplateInstantiator` (copia config → nuevo recurso, estado inicial editable) |
| Industry Packages | librerías por industria (`carwash`), registradas en el composition root |
| Version Manager | `strategyVersion` semver en cada `TemplateMetadata` |
| Compatibility Manager | `validate()` del instantiator + `variantKeys` estrategia↔plantilla |

- **Herencia:** cada `TemplateMetadata` conserva `strategyId` + `strategyVersion`
  (referencia a la estrategia maestra). La empresa **nunca** ve esta información;
  es de uso interno para futuras actualizaciones de plantillas (mantener /
  actualizar / comparar / nueva copia — pendiente de UI en fases futuras).
- No existe ninguna pantalla pública para administrar la biblioteca.
- Las estrategias (`PromotionStrategy`, `MembershipStrategy`) siguen exportadas
  desde los módulos de motor **solo para uso interno/motor**; ninguna página del
  panel las importa ni las muestra.

## 2. Plantillas por módulo (panel de empresa)

Adaptador: `src/modules/admin/plantillas.ts` — compone tarjetas y prefills a
partir de plantilla + estrategia. Nada de esto expone el concepto "estrategia"
al usuario.

| Módulo | Galería | Flujo |
|---|---|---|
| Promociones | `/admin/promociones/plantillas` (54, filtro por categoría) | Usar plantilla → `/admin/promociones/nuevo?plantilla=<key>` → form prefillado → Publicar |
| Planes (membresías) | `/admin/planes/plantillas` (33, filtro por modelo) | Usar plantilla → `/admin/planes/nuevo?plantilla=<key>` → form prefillado → Crear plan |

Cada tarjeta muestra: nombre, objetivo/categoría, dificultad, resultado
esperado / problema que resuelve, beneficios incluidos, recomendado para,
duración sugerida y precio sugerido (planes).

**Copia, nunca referencia:** al usar una plantilla se copian sus valores como
`defaultValue` del formulario. El recurso creado (fila `Promocion` / `Plan`) es
independiente, propiedad de la empresa y 100 % editable. La plantilla original
(datos en código) es inmutable por construcción.

**Módulos futuros** (Beneficios, Cupones, Recompensas, Referidos, Campañas,
Automatizaciones, Gamificación): seguirán exactamente el mismo patrón cuando
sus motores/librerías de plantillas existan (secuencia F1.x). El adaptador y el
core ya están preparados para registrar más `ModuleStrategyLibrary`.

## 3. Análisis del Wizard (mejora adicional obligatoria)

**Decisión: no convertir el editor en un wizard multipaso por ahora.**

- El flujo con plantillas ya es un asistente de 3 pasos: **elegir plantilla →
  ajustar (form prefillado, agrupado en secciones) → publicar**. Es la menor
  cantidad de pasos posible.
- Los formularios actuales del marketplace tienen ~10 campos organizados en
  secciones visuales ("Qué ofreces", "Vigencia y límites", "Alcance"). Partirlos
  en 6 pantallas (información → configuración → reglas → beneficios →
  automatizaciones → preview) añadiría clics sin reducir carga cognitiva, y los
  pasos "reglas/automatizaciones" quedarían vacíos: el modelo `Promocion` del
  marketplace no tiene reglas ni automatizaciones por promoción.
- **Cuándo sí:** cuando el panel adopte el Promotion Framework (F4) con reglas
  (Rule Engine), acciones (Action Engine) y restricciones por promoción, el
  editor tendrá suficiente superficie para justificar el wizard unificado. Ese
  wizard deberá reutilizarse en todos los módulos.

## 4. Checklist de validación E3

- [x] Módulo "Estrategias" fuera del panel. Nota histórica: una rama paralela
      (Marketplace de Estrategias, 180 playbooks) añadió `/admin/estrategias` +
      ítem de menú; al fusionarse se resolvió el conflicto conforme a esta fase:
      la ruta se movió a **`/admin/automatizaciones/plantillas`** (los playbooks
      son plantillas de automatización), el ítem "Estrategias" se eliminó del
      menú y de permisos (MARKETING conserva acceso vía sección
      `automatizaciones`), y el copy visible dice "plantilla", nunca "estrategia".
- [x] Business Strategy Library solo como componente interno (`src/lib/business-strategy-core/`).
- [x] Cada módulo con motor disponible incorpora su catálogo de plantillas
      (Promociones ✔, Planes ✔; resto pendiente de sus motores).
- [x] Toda plantilla genera copias independientes (prefill → nuevo recurso propio).
- [x] Nunca se modifica una plantilla original (datos inmutables en código).
- [x] Navegación consistente: botón "Plantillas" en cada listado, breadcrumb de
      vuelta, enlaces desde estados vacíos. Permisos: `/admin/<módulo>/plantillas`
      hereda la sección del módulo (`adminSectionForPath`), sin permisos nuevos.
- [x] UX simple y enfocada en tareas reales (crear promoción/plan), sin exponer
      el concepto "estrategia".
- [x] Arquitectura modular y preparada para más industrias (Industry Packages) y
      más módulos (`ModuleStrategyLibrary`).
- Verificación técnica: `tsc --noEmit` 0 errores · `eslint` 0 warnings · smoke
  test de 21 aserciones (galerías, filtros, prefills, plantilla inexistente).
