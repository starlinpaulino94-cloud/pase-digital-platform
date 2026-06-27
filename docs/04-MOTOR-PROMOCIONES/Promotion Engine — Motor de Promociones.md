# Promotion Engine — Motor de Promociones

**Documento:** PE-001
**Versión:** 1.0.0
**Fecha:** 2026-06-27
**Estado:** Borrador Oficial
**Clasificación:** Documento de Producto — Arquitectura Funcional
**Proyecto:** PASE Digital Platform

---

> *"Todo el sistema es construido alrededor de este motor. Si este documento está bien diseñado, cualquier nuevo tipo de promoción podrá agregarse en el futuro sin modificar la arquitectura principal."*

---

## Tabla de Contenidos

1. [Introducción — ¿Qué es el Motor de Promociones?](#1-introducción)
2. [Filosofía — ¿Por qué toda la plataforma gira alrededor de este módulo?](#2-filosofía)
3. [¿Qué es una Promoción? — Definición oficial](#3-qué-es-una-promoción)
4. [Clasificación Oficial de Promociones](#4-clasificación-oficial-de-promociones)
5. [Anatomía de una Promoción](#5-anatomía-de-una-promoción)
6. [Ciclo de Vida de una Promoción](#6-ciclo-de-vida-de-una-promoción)
7. [Reglas del Motor](#7-reglas-del-motor)
8. [Compatibilidad entre Promociones](#8-compatibilidad-entre-promociones)
9. [Motor de Elegibilidad](#9-motor-de-elegibilidad)
10. [Motor de Restricciones](#10-motor-de-restricciones)
11. [Escenarios Reales](#11-escenarios-reales)
12. [Escalabilidad — Cómo la arquitectura soporta nuevos tipos](#12-escalabilidad)
13. [Autoauditoría](#13-autoauditoría)

---

## 1. Introducción

### 1.1 ¿Qué es el Motor de Promociones?

El **Motor de Promociones** (en adelante "el Motor") es el módulo central y fundacional de la plataforma PASE Digital. Es el sistema responsable de definir, gestionar, evaluar y ejecutar todas las formas en que una empresa puede ofrecer valor diferencial a sus clientes a través de beneficios, descuentos, recompensas, membresías y experiencias especiales.

El Motor no es simplemente una colección de cupones o descuentos almacenados en una tabla. Es un **sistema de reglas, condiciones, restricciones y eventos** que determina, en tiempo real y para cada transacción individual, qué beneficio aplica, a quién aplica, cuándo aplica, cuántas veces puede aplicar y bajo qué condiciones puede ser combinado con otros beneficios.

Desde la perspectiva del negocio, el Motor de Promociones es la respuesta a una pregunta fundamental que toda empresa con clientes frecuentes debe responder:

> *"¿Cómo convierto una visita anónima en una relación de largo plazo con mi cliente?"*

El Motor responde a esa pregunta definiendo el lenguaje completo de las recompensas: sus formas, sus límites, su temporalidad, su personalización y su evolución.

### 1.2 Alcance de este documento

Este documento cubre:

- La definición canónica de lo que constituye una Promoción dentro de la plataforma
- La taxonomía completa y oficial de todos los tipos de Promoción soportados
- La estructura interna (anatomía) de cualquier Promoción, independientemente de su tipo
- El ciclo de vida completo que atraviesa una Promoción desde su concepción hasta su archivado
- Las reglas que gobiernan cuándo el Motor activa, pausa o rechaza una Promoción
- El sistema de compatibilidad que determina si dos o más Promociones pueden coexistir
- El Motor de Elegibilidad: los criterios que determinan si un cliente califica
- El Motor de Restricciones: los límites que controlan el uso de una Promoción
- Escenarios concretos con flujos completos de activación y resolución
- La arquitectura de extensibilidad que permite agregar nuevos tipos sin romper el sistema existente
- Una autoauditoría crítica con inconsistencias, limitaciones y casos aún no resueltos

Este documento **no cubre**:
- Diseño de base de datos ni esquemas técnicos
- Implementación de APIs ni contratos de integración
- Diseño de pantallas ni flujos de interfaz de usuario
- Código de ningún tipo

### 1.3 Relación con otros documentos

| Documento | Relación |
|---|---|
| BRFF-001 — Business Rules & Functional Flows | Define reglas de negocio que el Motor debe respetar como restricciones externas |
| DM-001 — Domain Model | Define las entidades (Beneficio, Instancia de Beneficio, Campaña, Validación) que el Motor opera |
| PSBM-001 — Product Strategy & Business Model | Define los planes de suscripción que determinan qué capacidades del Motor están disponibles por empresa |
| UPPE-001 — User Personas & Product Experience | Define los actores (Admin, Cajero, Cliente) que interactúan con el Motor en sus respectivos roles |

---

## 2. Filosofía

### 2.1 Por qué el Motor es el núcleo de la plataforma

La mayoría de las plataformas de fidelización construyen primero el módulo de usuarios, luego el de transacciones, luego el de reportes, y al final agregan "algún sistema de puntos o cupones". Ese orden revela una concepción equivocada: trata las promociones como un accesorio, como una capa decorativa sobre un sistema de registros.

PASE Digital toma el camino inverso. **El Motor de Promociones es el primer ciudadano de la plataforma.** Todo lo demás — la gestión de usuarios, el sistema de validaciones, los reportes, la integración con cajas — existe para servirle al Motor o para registrar lo que el Motor ha decidido.

Esta inversión no es arbitraria. Surge de una observación de mercado crítica: el valor que una empresa entrega a través de su programa de beneficios no es estático. Evoluciona. Lo que hoy es un descuento del 10% mañana es un plan Gold con beneficios diferenciados por nivel de consumo. Lo que hoy es un cupón de cumpleaños mañana es un ecosistema de recompensas cruzadas con aliados comerciales.

Si el Motor está construido como un módulo de soporte, cada evolución del negocio requiere modificar estructuras centrales del sistema. Si el Motor está construido como el núcleo, cada evolución del negocio es una configuración nueva dentro de un sistema que ya la contempla.

### 2.2 Principios filosóficos del Motor

**P-01 — Composabilidad sobre herencia**

Un descuento del 30% para clientes VIP los martes en la sucursal norte no es un "tipo especial" de descuento. Es la composición de cuatro condiciones independientes: tipo de beneficio (porcentaje), nivel de cliente (VIP), día de la semana (martes), sucursal (norte). Cada condición es una pieza atómica. El Motor trabaja con combinaciones de piezas, no con tipos monolíticos.

**P-02 — Separación entre definición y activación**

Una Promoción puede estar perfectamente definida y aún no haber sido activada nunca. La definición (qué es, a quién aplica, bajo qué condiciones) existe independientemente de la activación (cuándo se aplica a un cliente concreto en una transacción concreta). Esta separación permite auditar, proyectar y simular sin afectar transacciones reales.

**P-03 — El Motor nunca asume, siempre verifica**

Para que una Promoción sea aplicada, **todas** sus condiciones de elegibilidad y **ninguna** de sus restricciones activas deben incumplirse. Si alguna condición no puede ser verificada (porque faltan datos, porque el sistema externo no responde, porque la información del cliente es incompleta), el Motor rechaza la aplicación con un código de error explícito. No aplica "a medias", no omite condiciones.

**P-04 — La historia es inmutable**

Cada vez que el Motor aplica, rechaza o cancela una Promoción para un cliente específico, ese evento queda registrado de forma permanente e inalterable. No existe corrección retroactiva de aplicaciones. Si se aplica un beneficio por error, la corrección es un nuevo evento de ajuste, no la modificación del evento original.

**P-05 — La configuración es territorio del negocio**

El Motor está diseñado para que sus reglas, condiciones y parámetros puedan ser configurados por el administrador de la empresa sin intervención técnica. El equipo de producto puede agregar nuevos tipos de condiciones o nuevos tipos de restricciones como extensiones del sistema, pero la combinación de esas piezas en una Promoción concreta es siempre responsabilidad del negocio.

**P-06 — Un Motor que no puede escalar ya está obsoleto**

Cada decisión de diseño del Motor debe ser evaluada contra esta pregunta: *"¿Esta decisión me impedirá agregar un nuevo tipo de promoción en el futuro?"*. Si la respuesta es sí, la decisión debe ser reconsiderada. La arquitectura del Motor debe poder absorber tipos de promoción que hoy ni siquiera existen en el mercado.

### 2.3 El Motor como ventaja competitiva

El Motor de Promociones no es solo un módulo técnico. Es la propuesta de valor más profunda de PASE Digital para sus clientes empresariales. Una empresa que adopta PASE Digital y configura su programa de beneficios a través del Motor está construyendo un activo estratégico: datos de comportamiento de sus clientes, patrones de uso, respuesta a incentivos, elasticidad por tipo de beneficio.

Ese activo no puede migrarse fácilmente a otro sistema. No porque haya un lock-in técnico forzado, sino porque la profundidad de configuración del Motor — sus reglas, sus condiciones, sus combinaciones, su historial — representa meses de aprendizaje del negocio que se perdería al cambiar de plataforma.

---

## 3. ¿Qué es una Promoción?

### 3.1 Definición oficial

Una **Promoción** es un instrumento de valor configurado por una empresa para ser entregado a un cliente o grupo de clientes bajo condiciones específicas, en momentos determinados, con el propósito de influir en el comportamiento de consumo, recompensar la lealtad o generar una experiencia diferencial.

Esta definición tiene cuatro componentes esenciales:

1. **Instrumento de valor** — La Promoción tiene un valor tangible o intangible para el cliente. Puede ser un ahorro económico, un beneficio adicional, un acceso exclusivo o una recompensa acumulada.

2. **Configurado por una empresa** — La Promoción es siempre creada y gestionada por un actor del lado empresarial (administrador, gerente de marketing). Nunca es generada automáticamente por el sistema sin configuración humana previa.

3. **Bajo condiciones específicas** — La Promoción no aplica de forma indiscriminada. Existen condiciones que deben cumplirse para que sea elegible y restricciones que limitan su uso.

4. **Con un propósito** — Toda Promoción tiene una intención de negocio explícita. Esta intención puede ser: adquisición de nuevos clientes, retención de clientes existentes, incremento de frecuencia de visita, incremento del ticket promedio, reactivación de clientes inactivos, o generación de recomendaciones.

### 3.2 Lo que una Promoción NO es

Para evitar ambigüedades en el modelo, es importante distinguir lo que **no** constituye una Promoción dentro de la plataforma:

| No es una Promoción | Razón |
|---|---|
| Un precio regular de un producto o servicio | Los precios base son responsabilidad del sistema de la empresa; el Motor opera sobre transacciones, no sobre catálogos |
| Un descuento negociado caso a caso con un cliente | Las excepciones individuales no son Promociones; son ajustes manuales fuera del Motor |
| Una corrección de error de cobro | Las correcciones pertenecen al módulo de auditoría, no al Motor |
| Un crédito por reclamo o garantía | Los créditos de devolución son eventos de servicio al cliente, no de marketing |
| Una política de precios diferenciados por volumen | Las políticas de precio son configuración del sistema de ventas; el Motor puede complementarlas pero no las reemplaza |

### 3.3 La Promoción como contrato

Desde la perspectiva del Motor, una Promoción es un **contrato unilateral** que la empresa ofrece a sus clientes:

> *"Si tú, cliente, cumples con estas condiciones (X, Y, Z), yo, empresa, me comprometo a entregarte este beneficio (B), con estas restricciones de uso (R1, R2), durante este período (de la fecha A a la fecha B)."*

Este contrato tiene términos. Cuando el Motor verifica si una Promoción aplica para una transacción, está verificando si el cliente cumple su parte del contrato y si la empresa aún puede cumplir la suya (que la Promoción no esté agotada, suspendida o vencida).

### 3.4 Jerarquía conceptual

```
Tipo de Beneficio (catálogo del sistema)
    └── Beneficio (instancia configurada por la empresa)
            └── Campaña (agrupación de beneficios con propósito compartido)
                    └── Instancia de Beneficio (uso específico de un beneficio por un cliente)
```

Una **Promoción** en el lenguaje del negocio corresponde al **Beneficio** en el modelo de dominio: la instancia de un tipo de beneficio configurada con sus propias condiciones, restricciones y parámetros específicos.

---

## 4. Clasificación Oficial de Promociones

El Motor soporta una taxonomía estructurada en cuatro niveles: **Familia → Categoría → Tipo → Subtipo**. Esta taxonomía no es decorativa: el Motor utiliza la Familia y la Categoría para aplicar reglas de compatibilidad (ver Sección 8), y el Tipo para determinar el algoritmo de cálculo de valor.

### 4.1 Tabla maestra de tipos de Promoción

#### Familia A — DESCUENTOS DIRECTOS

Promociones que reducen el precio de una transacción en el momento del pago.

| Código | Tipo | Descripción | Parámetros clave |
|---|---|---|---|
| **PROMO-A01** | Descuento Porcentual | Reduce el precio total de la transacción en un porcentaje fijo | Porcentaje (1-100%), tope máximo de ahorro opcional |
| **PROMO-A02** | Descuento en Monto Fijo | Reduce el precio total en una cantidad fija de moneda | Monto fijo, moneda, monto mínimo de compra opcional |
| **PROMO-A03** | Precio Especial | Fija el precio de un servicio o producto a un valor determinado | Precio especial, producto/servicio al que aplica |
| **PROMO-A04** | Descuento en Segundo Item | Aplica descuento al segundo ítem del mismo tipo en una transacción | Porcentaje o monto del descuento al segundo ítem |
| **PROMO-A05** | Primera Visita Gratis | Otorga el servicio o producto sin costo en la primera visita del cliente | Aplica a: todos los servicios / servicio específico |

#### Familia B — ACUMULACIÓN Y CANJE

Promociones basadas en la acumulación progresiva de valor que puede ser canjeado posteriormente.

| Código | Tipo | Descripción | Parámetros clave |
|---|---|---|---|
| **PROMO-B01** | Puntos por Visita | Acumula puntos cada vez que el cliente realiza una visita | Puntos por visita, tasa de canje (puntos → beneficio) |
| **PROMO-B02** | Puntos por Monto Consumido | Acumula puntos proporcionales al gasto del cliente | Puntos por unidad monetaria, mínimo de consumo |
| **PROMO-B03** | Sellos Digitales | Sistema de "tarjeta sellada": tras N visitas, el cliente obtiene un beneficio | N visitas necesarias, beneficio al completar la tarjeta |
| **PROMO-B04** | Visita N Gratis | La N-ésima visita del cliente no tiene costo | Número de visita que activa el beneficio (e.g., visita 10) |
| **PROMO-B05** | Consumo Acumulado | Al superar un umbral de gasto acumulado, el cliente obtiene un beneficio | Umbral de consumo, período de cálculo, beneficio al alcanzar el umbral |
| **PROMO-B06** | Cashback | Devuelve un porcentaje del gasto como crédito para futuras visitas | Porcentaje de cashback, período de vencimiento del crédito |

#### Familia C — PLANES Y MEMBRESÍAS

Promociones basadas en una suscripción o membresía que otorga beneficios de forma continua.

| Código | Tipo | Descripción | Parámetros clave |
|---|---|---|---|
| **PROMO-C01** | Plan de Visitas Ilimitadas | El cliente paga una tarifa plana y puede visitar sin costo por período | Precio del plan, duración (mensual/anual), límite de visitas diarias opcional |
| **PROMO-C02** | Plan de N Visitas | El cliente paga por un paquete de N visitas prepagadas | Número de visitas incluidas, precio del paquete, vencimiento |
| **PROMO-C03** | Membresía VIP | Nivel especial que otorga descuentos permanentes y beneficios exclusivos | Criterio de elegibilidad al nivel, descuentos aplicables, beneficios especiales |
| **PROMO-C04** | Membresía por Nivel | Sistema de niveles (Bronce / Plata / Oro / Platino) con beneficios crecientes | Criterios de ascenso por nivel, beneficios de cada nivel, período de reevaluación |
| **PROMO-C05** | Suscripción Mensual con Descuento | El cliente paga mensualmente y obtiene descuento fijo en cada visita | Precio de suscripción, porcentaje de descuento, máximo de visitas por mes |
| **PROMO-C06** | Pase de Temporada | Plan temporal de acceso sin costo durante una temporada específica | Fecha inicio, fecha fin, servicios incluidos, límite de usos |

#### Familia D — TEMPORALES Y CIRCUNSTANCIALES

Promociones activadas por condiciones de tiempo, fecha o circunstancia específica.

| Código | Tipo | Descripción | Parámetros clave |
|---|---|---|---|
| **PROMO-D01** | Promoción de Cumpleaños | Beneficio especial activado en el mes o día de cumpleaños del cliente | Ventana de activación (solo el día / semana del cumpleaños / mes entero), tipo de beneficio |
| **PROMO-D02** | Promoción por Horario | Descuento o beneficio aplicable solo en un rango horario del día | Hora inicio, hora fin, días de la semana, sucursales aplicables |
| **PROMO-D03** | Promoción de Temporada | Beneficio activo solo durante un período del año | Fecha inicio, fecha fin, renovación automática anual opcional |
| **PROMO-D04** | Última Visita del Día | Beneficio para el último cliente atendido en el día | Criterio de activación (último cliente / últimos N clientes), tipo de beneficio |
| **PROMO-D05** | Día de la Semana | Descuento o beneficio específico para un día de la semana determinado | Día(s) de la semana, tipo de beneficio, horario opcional |
| **PROMO-D06** | Reactivación de Inactivo | Beneficio para clientes que no han visitado en N días | Días de inactividad umbral, tipo de beneficio, máximo de usos de reactivación |

#### Familia E — SOCIALES Y RELACIONALES

Promociones que se activan por relaciones entre clientes o por acciones sociales.

| Código | Tipo | Descripción | Parámetros clave |
|---|---|---|---|
| **PROMO-E01** | Referido | El cliente que refiere a un nuevo cliente obtiene un beneficio, el referido también | Beneficio para quien refiere, beneficio para el referido, condición de activación del referido |
| **PROMO-E02** | Grupo | Descuento o beneficio cuando un grupo de N personas visita juntas | Tamaño mínimo del grupo, beneficio por miembro del grupo |
| **PROMO-E03** | Comparte y Gana | El cliente obtiene beneficio por compartir su experiencia en redes o dejar reseña | Plataforma de verificación, beneficio otorgado, máximo de usos |
| **PROMO-E04** | Beneficio por Registro Completo | El cliente completa su perfil y obtiene un beneficio por hacerlo | Campos requeridos para completar el perfil, beneficio único por cliente |

#### Familia F — CONDICIONALES Y PERSONALIZADOS

Promociones que aplican solo cuando se cumplen condiciones específicas de comportamiento o perfil.

| Código | Tipo | Descripción | Parámetros clave |
|---|---|---|---|
| **PROMO-F01** | Compra X Lleva Y | Al comprar X unidades del servicio A, el cliente obtiene Y unidades del servicio B | Cantidad de X, servicio o producto X, cantidad de Y, servicio o producto Y |
| **PROMO-F02** | Descuento por Canal | Beneficio exclusivo para clientes que usan un canal específico (app, web, QR) | Canal elegible, tipo de beneficio |
| **PROMO-F03** | Beneficio por Sucursal | Promoción activa solo en sucursales específicas | Lista de sucursales, tipo de beneficio, fechas opcionales |
| **PROMO-F04** | Beneficio por Producto/Servicio | Descuento aplicable solo a un servicio o producto específico de la empresa | Servicio o producto al que aplica, porcentaje o monto |
| **PROMO-F05** | Descuento por Antigüedad | Beneficio creciente según la antigüedad del cliente con la empresa | Tramos de antigüedad (6 meses, 1 año, 2 años), porcentaje de descuento por tramo |
| **PROMO-F06** | Beneficio por Perfil Demográfico | Promoción dirigida a un segmento específico por edad, género u otro atributo | Criterio demográfico, tipo de beneficio |

#### Familia G — CUPONES Y CÓDIGOS

Promociones materializadas como códigos únicos o de uso limitado.

| Código | Tipo | Descripción | Parámetros clave |
|---|---|---|---|
| **PROMO-G01** | Cupón de Uso Único | Código que puede ser redimido una sola vez por cualquier cliente que lo tenga | Código, tipo de beneficio, fecha de vencimiento |
| **PROMO-G02** | Cupón Multi-uso | Código que puede ser redimido múltiples veces hasta agotar su cuota o vencer | Código, tipo de beneficio, número máximo de usos totales, fecha de vencimiento |
| **PROMO-G03** | Cupón Personal | Código generado para un cliente específico e intransferible | Código único por cliente, tipo de beneficio, fecha de vencimiento |
| **PROMO-G04** | Código de Campaña | Código vinculado a una campaña de marketing específica con métricas propias | Código de campaña, fuente de tráfico esperada, tipo de beneficio, métricas de seguimiento |

#### Familia H — COMBINADAS Y ESCALABLES

Promociones que combinan múltiples mecanismos o escalan según el comportamiento del cliente.

| Código | Tipo | Descripción | Parámetros clave |
|---|---|---|---|
| **PROMO-H01** | Beneficio Escalonado | El beneficio aumenta a medida que el cliente acumula más visitas o consumo en la misma campaña | Escalones (tramos de visitas/consumo), beneficio por escalón |
| **PROMO-H02** | Reto de Consumo | El cliente tiene un objetivo dentro de un período; al cumplirlo, obtiene el beneficio | Objetivo (N visitas / monto consumido), período, beneficio al cumplir, progreso visible al cliente |
| **PROMO-H03** | Bundle de Servicios | Paquete que combina múltiples servicios a un precio especial | Servicios incluidos, precio del bundle, comparación con precio unitario |
| **PROMO-H04** | Promoción Acumulable | Beneficio que puede combinarse con otras promociones activas simultáneamente | Lista de tipos con los que es compatible, regla de acumulación (suma, mayor, primero) |

### 4.2 Resumen por Familia

| Familia | Nombre | Tipos incluidos | Total |
|---|---|---|---|
| A | Descuentos Directos | A01–A05 | 5 |
| B | Acumulación y Canje | B01–B06 | 6 |
| C | Planes y Membresías | C01–C06 | 6 |
| D | Temporales y Circunstanciales | D01–D06 | 6 |
| E | Sociales y Relacionales | E01–E04 | 4 |
| F | Condicionales y Personalizados | F01–F06 | 6 |
| G | Cupones y Códigos | G01–G04 | 4 |
| H | Combinadas y Escalables | H01–H04 | 4 |
| **TOTAL** | | | **41 tipos** |

### 4.3 Notas sobre la clasificación

1. **No es exhaustiva, es extensible.** La clasificación puede crecer. Agregar un nuevo tipo dentro de una familia existente no requiere cambios estructurales en el Motor. Agregar una nueva familia requiere definir sus reglas de compatibilidad, pero no modifica las familias existentes.

2. **Un Beneficio tiene un solo tipo.** Aunque una Promoción puede tener múltiples condiciones y restricciones, siempre pertenece a un único tipo. No existe un "descuento porcentual + sellos" como tipo único; eso sería una Campaña que agrupa dos Beneficios distintos.

3. **El tipo determina el algoritmo de cálculo.** El Motor usa el tipo para saber cómo calcular el valor del beneficio en una transacción dada. Un PROMO-A01 usa multiplicación por porcentaje; un PROMO-B03 usa conteo de visitas; un PROMO-C01 usa verificación de estado de plan activo.

4. **La Familia determina la compatibilidad por defecto.** Dos Promociones de la misma familia son candidatas a conflicto potencial (ver Sección 8). El Motor aplica reglas de compatibilidad más estrictas dentro de la misma familia que entre familias distintas.

---

## 5. Anatomía de una Promoción

Toda Promoción, independientemente de su tipo, está compuesta por los mismos componentes estructurales. Esta uniformidad estructural es lo que permite al Motor evaluar cualquier Promoción con el mismo algoritmo.

### 5.1 Componentes de una Promoción

#### 5.1.1 Identidad

| Campo | Descripción | Obligatorio |
|---|---|---|
| **ID único** | Identificador interno e inmutable de la Promoción | Sí |
| **Nombre** | Nombre descriptivo visible para el administrador y el cliente | Sí |
| **Descripción** | Texto explicativo del beneficio, sus condiciones y forma de uso | Sí |
| **Empresa** | A qué empresa pertenece esta Promoción | Sí |
| **Versión** | Número de versión del registro de la Promoción (para auditoría) | Sí (automático) |
| **Código externo** | Referencia al código del sistema externo de la empresa, si existe | No |

#### 5.1.2 Clasificación

| Campo | Descripción | Obligatorio |
|---|---|---|
| **Familia** | Familia a la que pertenece (A–H) | Sí |
| **Tipo** | Tipo específico dentro de la familia (PROMO-XNN) | Sí |
| **Etiquetas** | Palabras clave para búsqueda y agrupación interna | No |
| **Propósito** | Intención de negocio declarada (adquisición / retención / frecuencia / ticket / reactivación / recomendación) | Sí |

#### 5.1.3 Valor del Beneficio

El valor del beneficio es la parte central de la Promoción: qué obtiene el cliente al activarla. Su estructura varía según el tipo:

**Para tipos de descuento directo (Familia A):**

| Campo | Descripción |
|---|---|
| **Tipo de valor** | Porcentaje / Monto fijo / Precio especial |
| **Valor** | Número que representa el descuento o precio |
| **Tope máximo** | Monto máximo de ahorro permitido (para porcentuales) |
| **Monto mínimo de transacción** | Para activar el beneficio, la transacción debe superar este monto |

**Para tipos de acumulación (Familia B):**

| Campo | Descripción |
|---|---|
| **Unidad de acumulación** | Puntos / Sellos / Visitas / Unidad monetaria |
| **Tasa de acumulación** | Cuántas unidades se acumulan por visita o por unidad monetaria |
| **Objetivo de canje** | Cuántas unidades se necesitan para activar el beneficio |
| **Beneficio al canje** | Qué se obtiene al alcanzar el objetivo (tipo y valor del beneficio resultante) |

**Para tipos de plan y membresía (Familia C):**

| Campo | Descripción |
|---|---|
| **Precio del plan** | Monto que el cliente paga para activar el plan |
| **Ciclo de facturación** | Mensual / Anual / Única vez |
| **Beneficios incluidos** | Lista de beneficios activos durante el plan |
| **Límites de uso dentro del plan** | N visitas, horas disponibles, sucursales, etc. |

**Para tipos de cupones (Familia G):**

| Campo | Descripción |
|---|---|
| **Código** | El código alfanumérico que el cliente presenta |
| **Tipo de código** | Auto-generado / Manual / Importado |
| **Beneficio del cupón** | Tipo y valor del beneficio otorgado al canjear |

#### 5.1.4 Alcance de Aplicación

Define a qué transacciones, servicios o productos aplica la Promoción:

| Campo | Descripción | Obligatorio |
|---|---|---|
| **Servicios/Productos** | A qué servicios o productos del catálogo de la empresa aplica | No (si vacío: todos) |
| **Sucursales** | En qué sucursales está disponible | No (si vacío: todas) |
| **Canal de activación** | Por qué canal puede ser activada (presencial / app / web / todos) | No (si vacío: todos) |

#### 5.1.5 Condiciones de Elegibilidad

Define qué condiciones debe cumplir el cliente para que la Promoción le aplique. Cada condición es una unidad atómica que puede ser verdadera o falsa. **Todas** las condiciones activas deben ser verdaderas para que la Promoción sea elegible.

Ver Sección 9 — Motor de Elegibilidad para la lista completa de condiciones disponibles.

#### 5.1.6 Restricciones de Uso

Define los límites que controlan cuántas veces y en qué circunstancias puede ser usada la Promoción. **Ninguna** restricción activa debe estar violada para que la Promoción pueda aplicarse.

Ver Sección 10 — Motor de Restricciones para la lista completa de restricciones disponibles.

#### 5.1.7 Temporalidad

| Campo | Descripción | Obligatorio |
|---|---|---|
| **Fecha de inicio** | Desde cuándo está disponible la Promoción | Sí |
| **Fecha de fin** | Hasta cuándo está disponible | No (si vacío: indefinida) |
| **Zona horaria** | Zona horaria de referencia para calcular fechas y horas | Sí |
| **Activación inmediata** | Si debe entrar en estado Activa al publicarse o esperar la fecha de inicio | Sí (booleano) |

#### 5.1.8 Compatibilidad

Define cómo esta Promoción se relaciona con otras Promociones activas simultáneamente:

| Campo | Descripción |
|---|---|
| **Modo de compatibilidad** | Exclusiva / Acumulable / Acumulable con tipos específicos |
| **Prioridad** | Número que determina el orden de aplicación cuando hay múltiples Promociones elegibles |
| **Regla de conflicto** | Si hay conflicto, qué hacer: aplicar la de mayor valor / aplicar la de menor prioridad / rechazar todas |

Ver Sección 8 — Compatibilidad entre Promociones para el detalle completo.

#### 5.1.9 Comunicación al Cliente

| Campo | Descripción | Obligatorio |
|---|---|---|
| **Texto de activación** | Mensaje visible al cliente cuando la Promoción es aplicada | Sí |
| **Texto de rechazo** | Mensaje explicativo cuando la Promoción no aplica | No |
| **Imagen o ícono** | Representación visual de la Promoción | No |
| **Notificación push** | Si se debe notificar al cliente cuando esté próximo a calificar | No |

#### 5.1.10 Métricas y Seguimiento

| Campo | Descripción |
|---|---|
| **Presupuesto total** | Monto máximo que la empresa está dispuesta a gastar en esta Promoción |
| **Presupuesto usado** | Suma del valor de todos los beneficios aplicados hasta la fecha |
| **Número de usos** | Contador de cuántas veces ha sido aplicada (total, por día, por período) |
| **Tasa de conversión** | Proporción de clientes elegibles que efectivamente usan la Promoción |
| **Objetivo de la campaña** | Meta de usos, clientes alcanzados o ahorro generado que define el "éxito" de la Promoción |

### 5.2 Diagrama de Anatomía

```
┌─────────────────────────────────────────────────────┐
│                   PROMOCIÓN                         │
├──────────────┬──────────────────────────────────────┤
│   IDENTIDAD  │  ID · Nombre · Descripción           │
│              │  Empresa · Versión                   │
├──────────────┼──────────────────────────────────────┤
│ CLASIFICACIÓN│  Familia · Tipo · Propósito          │
│              │  Etiquetas                           │
├──────────────┼──────────────────────────────────────┤
│    VALOR     │  Tipo de valor · Monto/Porcentaje    │
│              │  Tope · Mínimo de transacción        │
├──────────────┼──────────────────────────────────────┤
│    ALCANCE   │  Servicios · Sucursales · Canal      │
├──────────────┼──────────────────────────────────────┤
│ ELEGIBILIDAD │  Condición-1 AND Condición-2 AND … n │
├──────────────┼──────────────────────────────────────┤
│ RESTRICCIONES│  Restricción-1 AND Restricción-2 … n │
├──────────────┼──────────────────────────────────────┤
│ TEMPORALIDAD │  Fecha inicio · Fecha fin · Timezone │
├──────────────┼──────────────────────────────────────┤
│COMPATIBILIDAD│  Modo · Prioridad · Regla conflicto  │
├──────────────┼──────────────────────────────────────┤
│ COMUNICACIÓN │  Texto activación · Push notification│
├──────────────┼──────────────────────────────────────┤
│   MÉTRICAS   │  Presupuesto · Usos · Objetivos      │
└──────────────┴──────────────────────────────────────┘
```

---

## 6. Ciclo de Vida de una Promoción

### 6.1 Estados oficiales

Una Promoción puede encontrarse en uno de los siguientes estados a lo largo de su existencia:

| Estado | Código | Descripción |
|---|---|---|
| **Borrador** | `DRAFT` | La Promoción está siendo configurada. No es visible para cajeros ni clientes. Puede ser editada libremente. |
| **En Revisión** | `UNDER_REVIEW` | La Promoción ha sido enviada para aprobación interna. No puede ser editada sin rechazarla primero. |
| **Programada** | `SCHEDULED` | La Promoción ha sido aprobada y publicada, pero su fecha de inicio aún no ha llegado. |
| **Activa** | `ACTIVE` | La Promoción está disponible y el Motor la evalúa en cada transacción elegible. |
| **Pausada** | `PAUSED` | La Promoción fue detenida temporalmente por el administrador. No se aplica a nuevas transacciones, pero mantiene su historial. |
| **Suspendida** | `SUSPENDED` | La Promoción fue detenida por el sistema por una violación de reglas, presupuesto agotado anticipadamente o intervención del equipo de soporte PASE. |
| **Agotada** | `EXHAUSTED` | La Promoción alcanzó su límite máximo de usos o su presupuesto total. Se desactiva automáticamente. |
| **Vencida** | `EXPIRED` | La fecha de fin de la Promoción fue alcanzada. Se desactiva automáticamente. |
| **Cancelada** | `CANCELLED` | El administrador de la empresa decidió cancelar la Promoción de forma definitiva antes de su vencimiento natural. |
| **Archivada** | `ARCHIVED` | La Promoción fue archivada tras su cierre. Es visible en reportes históricos pero no puede ser reactivada. |

### 6.2 Diagrama de ciclo de vida

```
                    ┌─────────────┐
                    │   BORRADOR  │◄──────────────────────────┐
                    │    DRAFT    │                           │
                    └──────┬──────┘                       [rechazar]
                           │ [enviar a revisión]              │
                           ▼                                  │
                    ┌─────────────┐                    ┌──────┴──────┐
                    │ EN REVISIÓN │────[rechazar]──────►│   BORRADOR  │
                    │UNDER_REVIEW │                    └─────────────┘
                    └──────┬──────┘
                           │ [aprobar]
                           ▼
                    ┌─────────────┐
                    │  PROGRAMADA │
                    │  SCHEDULED  │
                    └──────┬──────┘
                           │ [fecha inicio alcanzada / activación inmediata]
                           ▼
              ┌────────────────────────┐
              │         ACTIVA         │◄──────────────────────┐
              │         ACTIVE         │                       │
              └───┬────────┬───────────┘                       │
                  │        │                               [reanudar]
              [pausar]  [suspe-                                 │
                  │      nder]                          ┌───────┴──────┐
                  ▼        ▼                            │    PAUSADA   │
       ┌──────────────┐ ┌──────────────┐               │    PAUSED    │
       │  SUSPENDIDA  │ │   PAUSADA    │───────────────►└──────────────┘
       │  SUSPENDED   │ │   PAUSED     │
       └──────┬───────┘ └──────┬───────┘
              │                │
           [cancelar]       [cancelar]
              │                │
              ▼                ▼
       ┌──────────────────────────┐
       │        CANCELADA         │
       │        CANCELLED         │
       └──────────────────────────┘
              
[Transiciones automáticas por el Motor:]

ACTIVE ──[límite usos alcanzado]──► EXHAUSTED
ACTIVE ──[fecha fin alcanzada]────► EXPIRED
ACTIVE ──[presupuesto agotado]────► EXHAUSTED

[Archivado final (cualquier estado terminal):]

EXHAUSTED │
EXPIRED   ├──[archivar (manual o automático)]──► ARCHIVED
CANCELLED │
```

### 6.3 Reglas de transición

#### De DRAFT a UNDER_REVIEW
- La Promoción debe tener todos los campos obligatorios completados
- El tipo debe ser uno de los 41 tipos oficiales
- La fecha de inicio debe ser en el futuro (o "ahora" para activación inmediata)
- Si hay fecha de fin, debe ser posterior a la fecha de inicio

#### De UNDER_REVIEW a SCHEDULED (o ACTIVE)
- La revisión puede ser automática (plan STARTER) o manual (plan GROWTH+)
- Si la fecha de inicio es en el futuro al momento de aprobación: pasa a SCHEDULED
- Si la fecha de inicio ya llegó o es "activación inmediata": pasa directamente a ACTIVE

#### De SCHEDULED a ACTIVE
- El Motor evalúa periódicamente las Promociones en estado SCHEDULED
- Cuando la fecha de inicio es alcanzada, el Motor la transiciona a ACTIVE automáticamente
- La transición es registrada como un evento de dominio

#### De ACTIVE a PAUSED
- Puede ser realizada por el Administrador de Empresa o Gerente de Sucursal (según la configuración)
- La pausa debe incluir una razón (obligatoria para auditoría)
- Los usos en curso que ya comenzaron antes de la pausa son respetados hasta su finalización
- No existe un tiempo mínimo entre activación y pausa

#### De ACTIVE a SUSPENDED
- Puede ser realizada por el Administrador de Empresa, Superadmin PASE o el Motor automáticamente
- Causas automáticas: detección de uso fraudulento, inconsistencia de datos, violación de reglas del plan
- La suspensión automática siempre genera una notificación al Admin de la empresa

#### De ACTIVE a EXHAUSTED
- Transición automática cuando se alcanza el límite de usos totales configurado, O
- Cuando el presupuesto total asignado ha sido consumido
- El Motor evalúa estas condiciones en cada aplicación exitosa

#### De ACTIVE a EXPIRED
- Transición automática cuando la fecha y hora de fin es alcanzada (evaluación por zona horaria de la empresa)

#### De cualquier estado a ARCHIVED
- Disponible desde: EXHAUSTED, EXPIRED, CANCELLED, SUSPENDED (tras período de gracia)
- Una vez archivada, la Promoción no puede ser reactivada en ningún caso
- La Promoción archivada y todos sus registros de uso permanecen en la base de datos para auditoría

### 6.4 Restricciones de edición por estado

| Campo | DRAFT | UNDER_REVIEW | SCHEDULED | ACTIVE | PAUSED |
|---|---|---|---|---|---|
| Nombre | ✓ | ✗ | ✗ | ✗ | ✗ |
| Descripción | ✓ | ✗ | ✓ | ✓ | ✓ |
| Tipo | ✓ | ✗ | ✗ | ✗ | ✗ |
| Valor del beneficio | ✓ | ✗ | ✗ | ✗ | ✗ |
| Condiciones de elegibilidad | ✓ | ✗ | ✗ | ✗ | ✗ |
| Restricciones de uso | ✓ | ✗ | ✓ (solo incrementar) | ✓ (solo incrementar) | ✓ |
| Fecha de inicio | ✓ | ✗ | ✗ | ✗ | ✗ |
| Fecha de fin | ✓ | ✗ | ✓ (solo extender) | ✓ (solo extender) | ✓ |
| Sucursales | ✓ | ✗ | ✓ | ✓ | ✓ |
| Presupuesto total | ✓ | ✗ | ✓ (solo incrementar) | ✓ (solo incrementar) | ✓ |
| Texto al cliente | ✓ | ✗ | ✓ | ✓ | ✓ |

> **Regla fundamental:** Ningún parámetro que afecte el valor económico del beneficio puede ser modificado una vez que la Promoción ha sido publicada (estado SCHEDULED o superior). Esto protege tanto a los clientes como a la empresa de cambios retroactivos.

---

## 7. Reglas del Motor

### 7.1 ¿Qué hace el Motor en cada transacción?

Cuando un cajero o sistema externo solicita validar una transacción para un cliente, el Motor ejecuta el siguiente proceso:

**Paso 1 — Identificación del contexto**
El Motor recibe: ID del cliente, ID de la empresa, ID de la sucursal, canal de activación, timestamp, y los detalles de la transacción (servicios, monto).

**Paso 2 — Recuperación de Promociones candidatas**
El Motor recupera todas las Promociones en estado ACTIVE para la empresa, filtradas por:
- Sucursal (si la Promoción tiene restricción de sucursal)
- Canal de activación
- Servicios/productos de la transacción
- Período temporal activo (fecha actual dentro de fecha inicio y fin)

**Paso 3 — Evaluación de elegibilidad**
Para cada Promoción candidata, el Motor evalúa el Motor de Elegibilidad (Sección 9). Si todas las condiciones son verdaderas, la Promoción pasa al siguiente paso.

**Paso 4 — Evaluación de restricciones**
Para cada Promoción que pasó la elegibilidad, el Motor evalúa el Motor de Restricciones (Sección 10). Si alguna restricción está violada, la Promoción es descartada con un código de rechazo.

**Paso 5 — Resolución de compatibilidades**
Si más de una Promoción pasó la elegibilidad y las restricciones, el Motor aplica las reglas de compatibilidad (Sección 8) para determinar qué Promociones pueden coexistir y cuáles entran en conflicto.

**Paso 6 — Cálculo de valor**
El Motor calcula el valor de beneficio de cada Promoción elegible y compatible usando el algoritmo correspondiente a su tipo.

**Paso 7 — Resultado**
El Motor devuelve una lista ordenada de Promociones a aplicar, con su valor calculado, y un resumen del ahorro o beneficio total para el cliente.

**Paso 8 — Registro**
Independientemente del resultado (aplicación exitosa o rechazo), el Motor registra el evento de forma inmutable con todos los datos del contexto, las condiciones evaluadas, el resultado de cada una, y el motivo de rechazo si aplica.

### 7.2 Reglas generales del Motor

**RME-001 — Solo se evalúan Promociones en estado ACTIVE**
El Motor nunca evalúa Promociones en estado DRAFT, UNDER_REVIEW, SCHEDULED, PAUSED, SUSPENDED, EXHAUSTED, EXPIRED, CANCELLED o ARCHIVED.

**RME-002 — El Motor no modifica Promociones durante la evaluación**
La evaluación es un proceso de lectura. El Motor no pausa, suspende ni modifica ninguna Promoción como resultado de evaluar una transacción. Las transiciones de estado se realizan en procesos separados.

**RME-003 — La aplicación es atómica**
Una aplicación de beneficio es todo o nada. El Motor no aplica un beneficio parcialmente. Si ocurre un error durante la aplicación de una Promoción elegible, ninguna Promoción de esa transacción es aplicada y toda la transacción es marcada como fallida con código de error.

**RME-004 — El orden de evaluación es determinístico**
Para una misma transacción con las mismas condiciones, el Motor siempre producirá el mismo resultado. No existe aleatoriedad en la evaluación. Esto es fundamental para auditoría y para la confianza del cliente.

**RME-005 — La zona horaria es la de la empresa**
Todas las evaluaciones temporales (hora del día, día de la semana, fecha de vencimiento) usan la zona horaria configurada en el perfil de la empresa, no la zona horaria del servidor ni la del dispositivo del cajero.

**RME-006 — El Motor respeta el estado del cliente en el momento exacto de la transacción**
Si un cliente alcanza un nivel VIP durante el procesamiento de una transacción, el Motor usa el estado anterior al inicio de esa transacción. El nuevo estado aplica desde la siguiente transacción.

**RME-007 — Datos insuficientes → rechazo explícito**
Si el Motor no puede evaluar una condición de elegibilidad porque faltan datos del cliente (fecha de nacimiento para cumpleaños, historial de visitas para acumulación, etc.), la condición es evaluada como FALSA y la Promoción es rechazada con código `INSUFFICIENT_DATA`, no ignorada silenciosamente.

**RME-008 — Las Promociones no retroactúan**
Una Promoción publicada hoy no aplica a transacciones realizadas antes de su publicación. El historial de transacciones anteriores puede ser considerado como condición de elegibilidad (e.g., "el cliente ha visitado más de 10 veces"), pero el beneficio solo puede aplicarse hacia adelante.

**RME-009 — El Motor distingue entre "no elegible" y "restringido"**
Cuando rechaza una Promoción, el Motor clasifica el rechazo en dos categorías:
- **NO_ELIGIBLE**: El cliente no cumple las condiciones de elegibilidad (perfil, historial, segmento)
- **RESTRICTED**: El cliente sería elegible, pero una restricción de uso lo impide (límite diario alcanzado, cupón ya usado, período no activo)
Esta distinción es importante para los mensajes al cliente y para el análisis de métricas.

**RME-010 — Auditoría siempre, independientemente del resultado**
El registro de auditoría es creado antes de que la respuesta sea enviada al cajero. En caso de falla del sistema de auditoría, la transacción no es confirmada.

### 7.3 Reglas específicas por Familia de Promoción

#### Familia A — Descuentos Directos
- El descuento no puede resultar en un precio negativo. Si el descuento es mayor al precio total, el beneficio queda limitado al precio total (precio final = $0).
- Para PROMO-A01 (porcentual), el tope máximo prevalece sobre el porcentaje si ambos resultan en valores diferentes.
- Para PROMO-A05 (primera visita gratis), el Motor verifica el historial completo del cliente con la empresa, no solo con la sucursal.

#### Familia B — Acumulación y Canje
- La acumulación de unidades y el canje son dos eventos separados en el tiempo. No ocurren en la misma transacción.
- Las unidades acumuladas tienen una fecha de vencimiento que puede ser configurada por la empresa. El Motor evalúa la antigüedad de las unidades antes del canje.
- Si el cliente tiene más unidades de las necesarias para el canje, el excedente se mantiene en su saldo. No se pierde.
- El canje de unidades es irreversible una vez confirmado.

#### Familia C — Planes y Membresías
- La activación de un plan es un proceso separado al de la evaluación de transacciones. El Motor verifica si el plan está activo al momento de la transacción.
- Un plan vencido que no ha sido renovado no otorga beneficios aunque el cliente "recuerde" que lo tenía.
- El límite de visitas dentro de un plan (si configurado) es evaluado contra las visitas en el período actual del plan, no históricas.

#### Familia D — Temporales y Circunstanciales
- Para PROMO-D01 (cumpleaños), el Motor requiere que la fecha de nacimiento del cliente esté verificada (no solo declarada).
- Para PROMO-D02 (horario), el Motor usa la hora local de la sucursal, no la hora del servidor.
- Para PROMO-D06 (reactivación), el conteo de días de inactividad comienza desde la última transacción registrada, no desde el último inicio de sesión.

#### Familia G — Cupones y Códigos
- El Motor verifica que el código exista, que no haya sido usado más veces de lo permitido, que no esté vencido y que, si es personal, pertenezca al cliente que lo presenta.
- Un cupón personal que es presentado por un cliente diferente al designado es rechazado con código `COUPON_NOT_OWNER`, no con un error genérico.

---

## 8. Compatibilidad entre Promociones

### 8.1 El problema de las Promociones múltiples

En el mundo real, un cliente puede ser elegible para más de una Promoción simultáneamente. Una cliente que tiene un plan Gold mensual activo, está de cumpleaños, tiene 9 sellos acumulados (casi completos para la visita gratis), y además hay una Promoción de martes con 20% de descuento — ¿qué aplica?

Este escenario no es un caso borde. Es el escenario normal de un programa de fidelización maduro. El Motor debe resolverlo con reglas claras, predecibles y auditables.

### 8.2 Modos de compatibilidad

Cada Promoción declara su modo de compatibilidad al ser configurada:

| Modo | Código | Descripción |
|---|---|---|
| **Exclusiva** | `EXCLUSIVE` | Esta Promoción no puede coexistir con ninguna otra en la misma transacción. Si aplica, todas las demás son ignoradas. |
| **Acumulable** | `STACKABLE` | Esta Promoción puede coexistir con cualquier otra que también sea acumulable. |
| **Acumulable Selectiva** | `SELECTIVE_STACKABLE` | Esta Promoción puede coexistir con tipos específicos de Promociones declarados en su configuración. |
| **Sustituta** | `SUBSTITUTE` | Esta Promoción reemplaza a otras Promociones del mismo tipo si todas aplican, usando solo el de mayor valor. |

### 8.3 Matriz de compatibilidad

| | EXCLUSIVE | STACKABLE | SELECTIVE_STACKABLE | SUBSTITUTE |
|---|---|---|---|---|
| **EXCLUSIVE** | Conflicto → aplicar mayor valor | Conflicto → aplicar EXCLUSIVE | Conflicto → aplicar EXCLUSIVE | Conflicto → aplicar EXCLUSIVE |
| **STACKABLE** | Conflicto → aplicar EXCLUSIVE | Compatible → aplicar ambas | Verificar whitelist | Compatible según tipo |
| **SELECTIVE_STACKABLE** | Conflicto → aplicar EXCLUSIVE | Verificar whitelist | Verificar whitelist | Verificar whitelist |
| **SUBSTITUTE** | Conflicto → aplicar EXCLUSIVE | Compatible → aplicar ambas | Verificar whitelist | Conflicto → aplicar mayor valor |

### 8.4 Reglas de resolución de conflictos

**RCC-001 — Una sola EXCLUSIVE por transacción**
Si hay dos o más Promociones con modo EXCLUSIVE que son elegibles simultáneamente, el Motor aplica solo la de mayor valor económico para el cliente. En caso de empate exacto, aplica la de mayor prioridad (número menor). Si la prioridad también es igual, aplica la creada más recientemente.

**RCC-002 — EXCLUSIVE anula a todas las demás**
Si una Promoción EXCLUSIVE es la de mayor valor entre todas las elegibles, el Motor la aplica y descarta todas las demás, incluyendo STACKABLE y SELECTIVE_STACKABLE.

**RCC-003 — STACKABLE se acumula ilimitadamente**
Dos o más Promociones STACKABLE pueden aplicarse en la misma transacción. Los descuentos se aplican secuencialmente sobre el precio resultante (no sumados sobre el precio original), a menos que la empresa configure explícitamente "suma directa".

Ejemplo con aplicación secuencial:
- Precio original: $100
- Promoción STACKABLE-1: 20% descuento → precio: $80
- Promoción STACKABLE-2: 10% descuento sobre $80 → precio: $72

Ejemplo con suma directa (si configurada):
- Precio original: $100
- Descuento total: 20% + 10% = 30% → precio: $70

**RCC-004 — SUBSTITUTE aplica solo la de mayor valor**
Si hay dos Promociones SUBSTITUTE del mismo tipo (e.g., dos descuentos porcentuales), el Motor aplica solo la que genera mayor beneficio para el cliente. La otra queda registrada como "evaluada, no aplicada por SUBSTITUTE".

**RCC-005 — La empresa puede configurar una política global**
Más allá del modo de compatibilidad de cada Promoción, la empresa puede configurar una política de compatibilidad global:
- `MAX_ONE`: Nunca más de una Promoción por transacción (el Motor aplica siempre la de mayor valor)
- `MAX_N`: Nunca más de N Promociones por transacción
- `FREE`: Sin restricción global (el modo de cada Promoción prevalece)

**RCC-006 — Protección contra abuso por acumulación**
Si la acumulación de múltiples Promociones STACKABLE resulta en un precio final de $0 o negativo para la empresa, el Motor activa la regla anti-abuso:
- Si la empresa configuró `ALLOW_ZERO_PRICE = true`: se permite
- Si la empresa configuró `ALLOW_ZERO_PRICE = false` (default): el Motor limita la acumulación para que el precio final sea mínimo $1 o el mínimo configurado

**RCC-007 — Planes y Membresías tienen compatibilidad especial**
Las Promociones de Familia C (Planes y Membresías) son tratadas como un "estado del cliente" más que como una Promoción individual. Los beneficios derivados de un plan (e.g., el 20% de descuento incluido en el Plan Gold) son evaluados con prioridad después de los descuentos directos, a menos que la empresa configure lo contrario.

### 8.5 Prioridades

La prioridad es un número entero entre 1 y 100 donde 1 es la prioridad más alta. Se usa para desempatar cuando el Motor necesita elegir entre Promociones con igual valor económico.

La prioridad también determina el orden de aplicación secuencial en Promociones STACKABLE: la de mayor prioridad (número más bajo) se aplica primero.

**Prioridades sugeridas por familia:**

| Familia | Prioridad sugerida | Razón |
|---|---|---|
| C — Planes y Membresías | 10–20 | Representan compromisos preexistentes del cliente |
| D — Temporales | 20–30 | Son oportunidades limitadas en tiempo |
| G — Cupones | 30–40 | Son compromisos específicos ya emitidos |
| A — Descuentos Directos | 40–60 | Son beneficios genéricos del momento |
| B — Acumulación | 60–70 | Son beneficios a largo plazo que no compiten con inmediatos |
| E — Sociales | 70–80 | Complementan pero no lideran |
| F — Condicionales | 80–90 | Son beneficios específicos de nicho |
| H — Combinadas | 90–100 | Se aplican sobre el resultado de las demás |

---

## 9. Motor de Elegibilidad

### 9.1 ¿Qué es el Motor de Elegibilidad?

El Motor de Elegibilidad es el componente del Motor que determina si un cliente específico califica para una Promoción en una transacción dada. Opera como un evaluador lógico: recibe las condiciones de elegibilidad de la Promoción y el contexto del cliente, y devuelve `ELIGIBLE` o `NOT_ELIGIBLE` con el detalle de cada condición evaluada.

Las condiciones de elegibilidad son **predicados** — proposiciones que pueden ser verdaderas o falsas. Para que el Motor de Elegibilidad devuelva `ELIGIBLE`, **todas** las condiciones activas deben ser verdaderas.

### 9.2 Catálogo completo de condiciones de elegibilidad

#### 9.2.1 Condiciones de Perfil del Cliente

| Código | Condición | Descripción | Parámetros |
|---|---|---|---|
| **CE-P01** | Es cliente registrado | El cliente tiene una cuenta activa en la plataforma | — |
| **CE-P02** | Antigüedad mínima | El cliente ha sido cliente de la empresa por al menos N días | Número de días |
| **CE-P03** | Antigüedad máxima | El cliente lleva máximo N días como cliente (para Promociones de bienvenida) | Número de días |
| **CE-P04** | Rango de edad | El cliente tiene entre X y Y años de edad | Edad mínima, edad máxima |
| **CE-P05** | Edad mínima | El cliente tiene al menos N años | Número de años |
| **CE-P06** | Género | El cliente pertenece a un género específico | Género(s) elegibles |
| **CE-P07** | Cumpleaños hoy | La fecha actual cae dentro de la ventana de cumpleaños del cliente | Ventana en días antes/después del cumpleaños |
| **CE-P08** | Perfil completo | El cliente tiene todos los campos requeridos del perfil completados | Lista de campos requeridos |
| **CE-P09** | Código postal / Zona | El cliente vive o trabaja en una zona geográfica específica | Códigos postales o zonas elegibles |
| **CE-P10** | Segmento de cliente | El cliente ha sido asignado a un segmento específico por la empresa | Segmento(s) elegibles |

#### 9.2.2 Condiciones de Historial de Visitas

| Código | Condición | Descripción | Parámetros |
|---|---|---|---|
| **CE-V01** | Número de visitas totales | El cliente ha visitado al menos N veces en total (siempre, sin importar el período) | Número mínimo de visitas |
| **CE-V02** | Visitas en período | El cliente ha visitado al menos N veces en los últimos X días | Mínimo de visitas, número de días |
| **CE-V03** | Primera visita | Esta es la primera visita registrada del cliente con la empresa | — |
| **CE-V04** | Días desde última visita | El cliente no ha visitado en los últimos N días (criterio de inactividad) | Número de días |
| **CE-V05** | Visita número exacto | Esta es exactamente la N-ésima visita del cliente | Número de visita |
| **CE-V06** | Rango de número de visita | La visita actual está entre la visita número X y la visita número Y | Rango inicio, rango fin |
| **CE-V07** | Visita a sucursal específica | El cliente ha visitado esta sucursal específica al menos N veces | Sucursal, número mínimo de visitas |
| **CE-V08** | Nunca ha visitado esta sucursal | El cliente nunca ha visitado esta sucursal | Sucursal |

#### 9.2.3 Condiciones de Consumo

| Código | Condición | Descripción | Parámetros |
|---|---|---|---|
| **CE-C01** | Consumo total histórico | El cliente ha gastado al menos $X en total con la empresa | Monto mínimo |
| **CE-C02** | Consumo en período | El cliente ha gastado al menos $X en los últimos N días | Monto mínimo, número de días |
| **CE-C03** | Ticket promedio | El ticket promedio del cliente supera $X | Monto promedio mínimo |
| **CE-C04** | Monto de la transacción actual | La transacción actual supera $X | Monto mínimo de la transacción |
| **CE-C05** | Servicio/Producto específico | La transacción incluye un servicio o producto específico | Servicio o producto requerido |

#### 9.2.4 Condiciones de Membresía y Nivel

| Código | Condición | Descripción | Parámetros |
|---|---|---|---|
| **CE-M01** | Nivel de membresía | El cliente tiene un nivel de membresía específico (Bronce/Plata/Oro/Platino) | Nivel(es) elegibles |
| **CE-M02** | Nivel mínimo | El cliente tiene un nivel de membresía igual o superior al especificado | Nivel mínimo |
| **CE-M03** | Plan activo | El cliente tiene un plan de tipo específico activo actualmente | Tipo(s) de plan elegibles |
| **CE-M04** | Sin plan activo | El cliente no tiene ningún plan activo (para Promociones de conversión) | — |
| **CE-M05** | Puntos acumulados mínimos | El cliente tiene al menos N puntos/sellos acumulados | Unidades mínimas acumuladas |

#### 9.2.5 Condiciones de Relación Social

| Código | Condición | Descripción | Parámetros |
|---|---|---|---|
| **CE-S01** | Fue referido por otro cliente | El cliente se registró a través de un referido | — |
| **CE-S02** | Ha referido N clientes | El cliente ha referido al menos N nuevos clientes | Número mínimo de referidos |
| **CE-S03** | Tiene código de campaña | El cliente presenta un código de campaña válido | Código de campaña específico o "cualquier código válido" |
| **CE-S04** | Ha completado reto anterior | El cliente completó un reto específico previamente | ID del reto completado |

#### 9.2.6 Condiciones de Tiempo y Contexto

| Código | Condición | Descripción | Parámetros |
|---|---|---|---|
| **CE-T01** | Día de la semana | La transacción ocurre en un día específico de la semana | Día(s) elegibles |
| **CE-T02** | Rango horario | La transacción ocurre dentro de un rango horario específico | Hora inicio, hora fin |
| **CE-T03** | Período del mes | La transacción ocurre en los primeros/últimos N días del mes | Posición en el mes |
| **CE-T04** | Fecha específica | La transacción ocurre en una fecha exacta o rango de fechas | Fecha(s) elegibles |
| **CE-T05** | Canal de uso | La transacción se realiza a través de un canal específico | Canal(es) elegibles |
| **CE-T06** | Sucursal específica | La transacción ocurre en una sucursal específica | Sucursal(es) elegibles |

### 9.3 Composición de condiciones

Las condiciones de elegibilidad de una Promoción se evalúan como una expresión lógica. Por defecto, todas las condiciones se combinan con AND (todas deben ser verdaderas). El Motor soporta también combinaciones con OR para condiciones dentro de un grupo:

```
Grupo de condiciones:
  [CE-P07 (cumpleaños)] AND [CE-M02 (nivel mínimo: Gold)] AND (
    [CE-V02 (3 visitas en 30 días)] OR [CE-C01 (consumo total > $500)]
  )
```

En este ejemplo, el cliente debe cumplir todas las condiciones del nivel superior: ser de cumpleaños Y tener nivel Gold Y (haber visitado 3 veces en 30 días O haber gastado más de $500 en total).

### 9.4 Evaluación de condiciones con datos faltantes

| Situación | Comportamiento del Motor |
|---|---|
| El cliente no tiene fecha de nacimiento registrada y la condición CE-P07 está activa | Condición evaluada como FALSA, código de rechazo `MISSING_BIRTH_DATE` |
| El cliente es nuevo sin historial y la condición CE-V01 requiere 5 visitas | Condición evaluada como FALSA (0 visitas < 5 requeridas), sin error especial |
| El cliente está en el sistema pero no tiene nivel de membresía y la condición CE-M01 está activa | Condición evaluada como FALSA, el cliente no tiene nivel asignado |
| El sistema externo de la empresa no responde para verificar consumo (CE-C01) | Transacción marcada como `EXTERNAL_DEPENDENCY_TIMEOUT`, la Promoción no es aplicada |

---

## 10. Motor de Restricciones

### 10.1 ¿Qué es el Motor de Restricciones?

El Motor de Restricciones es el componente que, una vez que el Motor de Elegibilidad confirmó que el cliente califica para una Promoción, verifica que no exista ningún impedimento para aplicarla en ese momento concreto.

La distinción conceptual con la elegibilidad es fundamental:
- **Elegibilidad** → ¿Es este cliente el tipo correcto de cliente para esta Promoción?
- **Restricciones** → ¿Puede este cliente usar esta Promoción ahora mismo?

### 10.2 Catálogo completo de restricciones

#### 10.2.1 Restricciones de Uso Global

| Código | Restricción | Descripción | Parámetros |
|---|---|---|---|
| **CR-G01** | Usos totales máximos | La Promoción tiene un límite total de usos para todos los clientes | Número máximo de usos |
| **CR-G02** | Presupuesto máximo | La Promoción no puede exceder un presupuesto total asignado | Monto máximo en moneda |
| **CR-G03** | Clientes únicos máximos | La Promoción solo puede ser usada por N clientes distintos (aunque cada uno pueda usarla varias veces) | Número máximo de clientes únicos |

#### 10.2.2 Restricciones de Uso por Cliente

| Código | Restricción | Descripción | Parámetros |
|---|---|---|---|
| **CR-C01** | Uso único por cliente | El cliente solo puede usar esta Promoción una vez en toda su vida | — |
| **CR-C02** | Usos máximos por cliente | El cliente puede usar esta Promoción máximo N veces en total | Número máximo de usos |
| **CR-C03** | Usos por período por cliente | El cliente puede usar esta Promoción máximo N veces en cada período | Número máximo, período (diario/semanal/mensual) |
| **CR-C04** | Intervalo mínimo entre usos | El cliente debe esperar al menos N horas/días entre usos de esta Promoción | Intervalo mínimo en horas |

#### 10.2.3 Restricciones Temporales

| Código | Restricción | Descripción | Parámetros |
|---|---|---|---|
| **CR-T01** | Solo en días específicos | La Promoción solo puede ser usada en ciertos días de la semana | Días de la semana permitidos |
| **CR-T02** | Solo en rango horario | La Promoción solo puede ser usada en ciertos horarios del día | Hora inicio, hora fin |
| **CR-T03** | No en fechas específicas | La Promoción no puede ser usada en ciertas fechas (e.g., feriados) | Lista de fechas excluidas |
| **CR-T04** | Ventana de validez post-generación | Para cupones y códigos, la ventana de tiempo desde que fue generado el cupón hasta que puede ser usado | Horas mínimas desde generación |

#### 10.2.4 Restricciones de Contexto

| Código | Restricción | Descripción | Parámetros |
|---|---|---|---|
| **CR-X01** | Solo en sucursales específicas | La Promoción solo puede ser usada en ciertas sucursales | Lista de sucursales permitidas |
| **CR-X02** | Excluir sucursales específicas | La Promoción no puede ser usada en ciertas sucursales | Lista de sucursales excluidas |
| **CR-X03** | Solo en canal específico | La Promoción solo puede activarse por un canal determinado | Canal(es) permitidos |
| **CR-X04** | Requiere presencia física | La Promoción no puede ser activada de forma remota; el cliente debe estar presente | — |

#### 10.2.5 Restricciones de Combinación

| Código | Restricción | Descripción | Parámetros |
|---|---|---|---|
| **CR-K01** | No acumulable con familia X | La Promoción no puede coexistir con Promociones de la familia especificada | Familia(s) excluidas |
| **CR-K02** | No acumulable con tipo X | La Promoción no puede coexistir con Promociones de un tipo específico | Tipo(s) excluidos |
| **CR-K03** | No acumulable con Promoción específica | La Promoción no puede coexistir con una Promoción específica por ID | ID de Promoción incompatible |
| **CR-K04** | Solo acumulable con whitelist | La Promoción solo puede coexistir con Promociones en una lista de permitidos | Lista de IDs o tipos permitidos |

#### 10.2.6 Restricciones Anti-abuso

| Código | Restricción | Descripción | Parámetros |
|---|---|---|---|
| **CR-A01** | Requiere transacción real | La Promoción no aplica a transacciones de prueba o a monto $0 | — |
| **CR-A02** | Monto mínimo de transacción | La transacción actual debe superar un monto mínimo | Monto mínimo |
| **CR-A03** | Verificación de identidad requerida | El cliente debe tener su identidad verificada (no solo registrada) para usar esta Promoción | Nivel de verificación requerido |
| **CR-A04** | Suspensión por sospecha de fraude | Si el sistema antifraude marcó al cliente, la Promoción no aplica hasta resolución | — (automático) |

### 10.3 Evaluación de restricciones y códigos de rechazo

Cuando el Motor evalúa las restricciones y encuentra una violación, genera un código de rechazo específico. Estos códigos son usados para mensajes al cajero, métricas y auditoría:

| Código de Rechazo | Descripción |
|---|---|
| `GLOBAL_LIMIT_REACHED` | La Promoción alcanzó su límite total de usos (CR-G01) |
| `BUDGET_EXHAUSTED` | La Promoción alcanzó su presupuesto máximo (CR-G02) |
| `CLIENT_SINGLE_USE_EXCEEDED` | El cliente ya usó esta Promoción y es de uso único (CR-C01) |
| `CLIENT_MAX_USES_EXCEEDED` | El cliente alcanzó su límite de usos para esta Promoción (CR-C02) |
| `CLIENT_PERIOD_LIMIT_REACHED` | El cliente alcanzó el límite de usos en el período actual (CR-C03) |
| `INTERVAL_TOO_SHORT` | El cliente usó esta Promoción recientemente y debe esperar (CR-C04) |
| `WRONG_DAY` | Hoy no es un día en que esta Promoción esté activa (CR-T01) |
| `OUTSIDE_HOURS` | La hora actual está fuera del rango válido para esta Promoción (CR-T02) |
| `EXCLUDED_DATE` | Hoy es una fecha excluida para esta Promoción (CR-T03) |
| `WRONG_BRANCH` | Esta sucursal no está habilitada para esta Promoción (CR-X01 / CR-X02) |
| `WRONG_CHANNEL` | El canal de activación no es el permitido (CR-X03) |
| `INCOMPATIBLE_PROMOTION` | Hay otra Promoción activa que es incompatible con esta (CR-K01/K02/K03) |
| `MINIMUM_AMOUNT_NOT_MET` | El monto de la transacción no alcanza el mínimo requerido (CR-A02) |
| `FRAUD_ALERT` | El sistema antifraude bloqueó la aplicación para este cliente (CR-A04) |
| `COUPON_NOT_FOUND` | El código de cupón no existe en el sistema |
| `COUPON_EXPIRED` | El código de cupón está vencido |
| `COUPON_ALREADY_USED` | El código de cupón ya fue redimido el número máximo de veces |
| `COUPON_NOT_OWNER` | El cupón es personal y no pertenece a este cliente |
| `PROMOTION_NOT_ACTIVE` | La Promoción no está en estado ACTIVE |
| `MISSING_BIRTH_DATE` | El cliente no tiene fecha de nacimiento y la condición de cumpleaños está activa |
| `INSUFFICIENT_DATA` | No hay suficientes datos del cliente para evaluar las condiciones |
| `EXTERNAL_DEPENDENCY_TIMEOUT` | Un sistema externo no respondió a tiempo para la verificación |

---

## 11. Escenarios Reales

### Escenario 01 — Cliente con Plan Gold que intenta usar un cupón de descuento el día de su cumpleaños

**Contexto:**
- Cliente: Isabel, Plan Gold activo (PROMO-C03), 25% descuento en todas las visitas
- Hoy: Es el cumpleaños de Isabel
- Empresa configuró: Promoción de cumpleaños PROMO-D01 con 30% descuento (modo EXCLUSIVE)
- Empresa configuró: Plan Gold con 25% descuento (modo SUBSTITUTE dentro de membresías)
- Empresa también tiene activa una Promoción de martes con 15% (modo STACKABLE)
- Isabel presenta además un cupón de campaña con 10% (modo STACKABLE)
- Política global de la empresa: MAX_N = 2 promociones por transacción

**Evaluación del Motor:**

Paso 1 — Promociones candidatas: [Plan Gold 25%, Cumpleaños 30%, Martes 15%, Cupón 10%]

Paso 2 — Elegibilidad:
- Plan Gold (PROMO-C03): ✓ Plan activo verificado
- Cumpleaños (PROMO-D01): ✓ Fecha de nacimiento verificada, hoy es su cumpleaños
- Martes (PROMO-D05): ✓ Hoy es martes
- Cupón (PROMO-G02): ✓ Código válido, no agotado, no vencido

Paso 3 — Restricciones: Ninguna violada para ninguna de las cuatro.

Paso 4 — Compatibilidad:
- Cumpleaños (EXCLUSIVE) vs. Plan Gold (SUBSTITUTE): Conflicto EXCLUSIVE vs. no-EXCLUSIVE → EXCLUSIVE gana
- Cumpleaños (EXCLUSIVE) vs. Martes (STACKABLE): Conflicto → EXCLUSIVE gana
- Cumpleaños (EXCLUSIVE) vs. Cupón (STACKABLE): Conflicto → EXCLUSIVE gana
- **Resultado de compatibilidad:** Solo Cumpleaños 30% puede aplicar

Paso 5 — Política MAX_N = 2: Solo hay 1 Promoción, no hay conflicto

**Resultado final:**
- Aplicado: Descuento de cumpleaños 30%
- Descartados: Plan Gold (compatible pero anulado por EXCLUSIVE), Martes 15%, Cupón 10%
- Mensaje al cajero: "Descuento de cumpleaños aplicado: 30%. Feliz cumpleaños, Isabel."
- Registro de auditoría: Las 4 Promociones evaluadas, resultados individuales, motivo de descarte de cada una.

---

### Escenario 02 — Cliente en la visita número 10 con sellos casi completos y Promoción de "Martes doble"

**Contexto:**
- Cliente: Carlos, 9 sellos acumulados (PROMO-B03, necesita 10 para visita gratis)
- Esta es su visita número 10
- Empresa tiene activa una Promoción "Martes doble": los martes, cada visita cuenta como 2 sellos (modo STACKABLE)
- Hoy es martes

**Evaluación del Motor:**

La Promoción "Martes doble" es un subtipo especial: no otorga descuento directo, sino que multiplica la acumulación. El Motor la procesa en dos pasos:

Paso 1 — Verificar si "Martes doble" aplica: ✓ Es martes, cliente elegible
Paso 2 — Calcular sellos: 9 existentes + 1 visita × 2 (multiplicador martes) = 11 sellos
Paso 3 — Verificar PROMO-B03: 11 sellos >= 10 requeridos → ✓ Calificado para canje
Paso 4 — Aplicar canje: 1 visita gratis activada, saldo restante: 1 sello (11 - 10)

**Resultado final:**
- Esta visita es gratis (canje de sellos)
- El multiplicador de martes fue aplicado correctamente
- El saldo del cliente queda en 1 sello para el próximo ciclo
- Registro: Se registra el canje + el evento del multiplicador como dos eventos separados

---

### Escenario 03 — Cliente intenta usar un cupón vencido y el cajero no lo sabe

**Contexto:**
- Cliente: Roberto, presenta cupón impreso con código "RBTXYZ123"
- El cupón venció hace 3 días
- El cajero ingresa el código en el sistema

**Evaluación del Motor:**

Paso 1 — Verificar existencia del código: ✓ Código encontrado
Paso 2 — Verificar estado de la Promoción vinculada: Estado EXPIRED
Paso 3 — Resultado: `PROMOTION_NOT_ACTIVE` → Rechazo

**Resultado final:**
- El cupón no aplica
- Mensaje visible al cajero: "El cupón RBTXYZ123 está vencido (venció el [fecha]). No puede ser aplicado."
- Mensaje sugerido para el cliente: "Este cupón ha vencido. Consulte con la empresa si tienen una promoción vigente disponible."
- Registro: Intento de uso de cupón vencido, ID del cajero, hora, sucursal

---

### Escenario 04 — Empresa pausa una Promoción activa mientras hay una transacción en curso

**Contexto:**
- Hay 3 cajeros activos procesando transacciones simultáneamente
- El administrador pausa la Promoción "Descuento Viernes" mientras el Cajero #2 está en medio de una transacción que la usa

**Regla del Motor (RME-003 — La aplicación es atómica):**

El Motor registra el inicio de cada evaluación con un timestamp. Una transacción que ya inició su proceso de evaluación y llegó a la fase de "Resultado" antes de que el cambio de estado sea propagado, es respetada.

El cambio de estado ACTIVE → PAUSED se propaga al Motor con un margen de gracia de 30 segundos. Durante este margen, las transacciones que ya tienen la Promoción "bloqueada" para su evaluación pueden completarla.

**Resultado:**
- Cajero #2: Transacción completada con el descuento, porque la evaluación ya había concluido antes de la propagación del cambio
- Cajero #3 (que llegó después de la pausa): Transacción sin el descuento, Promoción en estado PAUSED no es evaluada
- Registro: El evento de pausa incluye timestamp exacto de propagación; todas las transacciones posteriores a ese timestamp ya no aplican el descuento

---

### Escenario 05 — Dos Promociones con modo EXCLUSIVE compiten por la misma transacción

**Contexto:**
- Empresa tiene activa: Promoción A — Descuento VIP 40% (EXCLUSIVE, prioridad 10)
- Empresa tiene activa: Promoción B — Descuento Navidad 50% (EXCLUSIVE, prioridad 5)
- Cliente: Tiene nivel VIP y la transacción ocurre en diciembre

**Evaluación del Motor (RCC-001):**
- Ambas EXCLUSIVE son elegibles
- Motor calcula valor de cada una sobre el precio de la transacción ($200):
  - Promoción A: $200 × 40% = $80 de ahorro
  - Promoción B: $200 × 50% = $100 de ahorro
- Motor aplica la de mayor valor: Promoción B (Navidad 50%)

**Resultado:**
- Aplicado: 50% de descuento de Navidad
- Descartado: 40% de descuento VIP (código de registro: `EXCLUSIVE_OUTCOMPETED`)
- Nota: La prioridad no se usa aquí porque el valor económico desempata antes de llegar a la prioridad

---

### Escenario 06 — Cliente intenta activar una Promoción que alcanzó su límite global mientras lo atendían

**Contexto:**
- Promoción "Black Friday 30%" configurada con máximo 500 usos globales
- En el momento en que el cajero inicia la transacción del cliente #501, el uso número 500 fue confirmado por otro cajero en otra sucursal

**Evaluación del Motor:**

El Motor usa un sistema de reserva optimista: al iniciar la evaluación, consulta si el contador de usos permite uno más. Si sí, "reserva" un uso. Si la transacción es confirmada, el uso se confirma. Si falla, la reserva es liberada.

En este caso, cuando el cajero #2 llega a confirmar:
- El Motor intenta reservar el uso número 501
- El sistema detecta que el límite de 500 ya fue alcanzado
- Transacción rechazada con código `GLOBAL_LIMIT_REACHED`
- El Motor transiciona automáticamente la Promoción a estado EXHAUSTED

**Resultado:**
- Cliente #501: Transacción sin descuento, con mensaje explicativo al cajero
- Promoción: Estado cambia a EXHAUSTED automáticamente
- Notificación: El administrador de la empresa recibe una notificación de que la Promoción fue agotada

---

### Escenario 07 — Empresa activa una Promoción de reactivación para clientes inactivos y un cliente que no visitaba en 90 días reaparece

**Contexto:**
- Empresa tiene activa PROMO-D06: Condición CE-V04 (no ha visitado en 60+ días), beneficio 25% descuento
- Laura no ha visitado en 93 días
- Laura visita hoy

**Evaluación del Motor:**
- CE-V04 (días desde última visita >= 60): ✓ 93 días >= 60
- Ninguna restricción violada
- Descuento 25% aplicado

**Resultado:**
- Laura obtiene 25% de descuento en su visita de regreso
- Registro: Se registra como "visita de reactivación" en las métricas de la Promoción
- Sistema puede disparar un evento para actualizar el segmento de Laura de "inactivo" a "reactivado"
- La próxima vez que Laura visite, la condición CE-V04 ya no se cumplirá (visitó hace menos de 60 días), y la Promoción no le aplicará nuevamente — sin necesidad de restricción adicional

---

## 12. Escalabilidad

### 12.1 El problema de la escalabilidad en motores de promociones

La mayoría de los motores de promociones fallan de la misma forma: cuando el negocio quiere agregar un nuevo tipo de beneficio, el equipo de ingeniería dice "eso requeriría modificar la estructura del motor". Esta respuesta es señal de que el motor fue construido como una lista de casos especiales en lugar de como un sistema de composición de reglas.

El Motor de PASE Digital está diseñado para evitar exactamente eso.

### 12.2 Los tres ejes de extensibilidad

#### Eje 1 — Nuevos tipos de Promoción

Para agregar un nuevo tipo de Promoción (e.g., PROMO-I01: "Descuento por Clima — cuando llueve en la ciudad"), el equipo de producto solo necesita:

1. Definir el nuevo tipo en el catálogo (Familia, Código, Parámetros)
2. Definir el algoritmo de cálculo de valor del nuevo tipo
3. Definir las condiciones de elegibilidad que el nuevo tipo puede usar (si necesita nuevas condiciones, continuar con Eje 2)
4. Definir las restricciones que aplican al nuevo tipo (si necesita nuevas restricciones, continuar con Eje 2)
5. Definir la compatibilidad del nuevo tipo con las familias existentes

Lo que **no** cambia: la anatomía de la Promoción, el ciclo de vida, el proceso de evaluación del Motor, el sistema de auditoría, la estructura de la base de datos principal.

#### Eje 2 — Nuevas condiciones de elegibilidad

Para agregar una nueva condición de elegibilidad (e.g., CE-P11: "El cliente es mayor de edad según el documento verificado"), el equipo de producto necesita:

1. Definir el código, descripción y parámetros de la nueva condición
2. Especificar la fuente de datos que la condición necesita evaluar (dato del perfil, historial, sistema externo)
3. Definir el comportamiento cuando la fuente de datos no está disponible

Lo que **no** cambia: el resto de las condiciones existentes, el Motor de Elegibilidad como evaluador lógico, el proceso de composición de condiciones.

#### Eje 3 — Nuevas restricciones de uso

Para agregar una nueva restricción (e.g., CR-G04: "Máximo N usos por código postal en el mismo día"), el equipo de producto necesita:

1. Definir el código, descripción y parámetros de la nueva restricción
2. Especificar qué datos necesita para su evaluación
3. Definir el código de rechazo que genera cuando es violada

Lo que **no** cambia: el resto de las restricciones existentes, el Motor de Restricciones como evaluador, los mecanismos de registro.

### 12.3 Lo que sí requiere trabajo de arquitectura para escalar

Existen ciertos tipos de evolución que sí requieren trabajo más profundo:

**Nuevas Familias de Promoción**
Si se necesita una nueva familia (e.g., Familia I: "Promociones Colaborativas con aliados externos"), se deben definir las reglas de compatibilidad de la familia con las ocho familias existentes. Esto no es una modificación del Motor, sino una extensión de sus tablas de configuración.

**Condiciones que requieren fuentes de datos externas**
Si una nueva condición de elegibilidad necesita consultar un sistema externo (e.g., el estado crediticio del cliente, su historial en otra plataforma), debe definirse el protocolo de integración: timeout máximo, comportamiento ante falla, caché de resultados. Esta definición es trabajo de arquitectura de integraciones, no del Motor en sí.

**Reglas de compatibilidad entre familias completamente nuevas**
Si se introduce una nueva lógica de compatibilidad que no puede expresarse con los cuatro modos actuales (EXCLUSIVE, STACKABLE, SELECTIVE_STACKABLE, SUBSTITUTE), sería necesario agregar un nuevo modo. Esto sí requiere trabajo en el Motor, pero es un escenario infrecuente dado que los cuatro modos cubren la gran mayoría de los casos conocidos.

### 12.4 Principios que garantizan la escalabilidad

**PSC-01 — El tipo de Promoción no dicta la estructura, solo el algoritmo de cálculo**
El Motor no tiene una rama de código diferente para cada tipo. Tiene una estructura uniforme (anatomía) y un catálogo de algoritmos de cálculo. Agregar un tipo es registrar un nuevo algoritmo en el catálogo, no bifurcar la lógica.

**PSC-02 — Las condiciones y restricciones son metadatos, no código**
Cada condición de elegibilidad y cada restricción de uso es una entrada en el catálogo del Motor. La evaluación es un intérprete que ejecuta los metadatos, no código especializado por tipo de condición.

**PSC-03 — Las Campañas permiten agrupar sin crear monstruos monolíticos**
En lugar de crear un tipo de Promoción que "hace todo a la vez", el diseño correcto es crear una Campaña que agrupe múltiples Beneficios simples. Esto mantiene cada pieza pequeña y testeable.

**PSC-04 — El historial nunca se rompe con los nuevos tipos**
Cuando se agrega un nuevo tipo de Promoción, el historial de todas las Promociones anteriores no se ve afectado. Los nuevos tipos se identifican con nuevos códigos; los registros de auditoría históricos mantienen el tipo que tenían cuando fueron creados.

**PSC-05 — Deprecación, no eliminación**
Cuando un tipo de Promoción ya no es relevante, se depreca (ya no puede ser usado para crear nuevas Promociones) pero no se elimina del catálogo. Esto garantiza que las Promociones históricas y sus instancias de uso sigan siendo interpretables décadas después.

---

## 13. Autoauditoría

Esta sección es una revisión crítica y honesta del modelo presentado en este documento. Su propósito es identificar sus propias limitaciones, inconsistencias, casos no cubiertos y decisiones que podrían ser revisadas.

### 13.1 Limitaciones reconocidas

**LIM-01 — El modelo asume conectividad en tiempo real**
El Motor de Elegibilidad y el Motor de Restricciones requieren acceso a datos actualizados del cliente en el momento de la transacción. En escenarios de conectividad limitada (sucursales en zonas con internet inestable), el modelo actual se degradaría a rechazar todas las Promociones que requieran verificación en tiempo real, o a un modo de cache local que podría estar desactualizado.

**Impacto:** Alto para negocios en zonas rurales o con infraestructura de red deficiente.
**Pendiente:** Definir una política de "modo offline degradado" con qué tipos de Promociones pueden evaluarse sin conectividad.

**LIM-02 — La acumulación de sellos/puntos requiere historial completo del cliente**
Para tipos PROMO-B01 a PROMO-B06, el Motor necesita acceder al saldo acumulado actual del cliente. Si el cliente cambia de dispositivo, cancela su cuenta y la recrea, o existe fragmentación de identidades (mismo cliente registrado dos veces), el saldo acumulado puede perderse o duplicarse.

**Impacto:** Medio, especialmente en el proceso de migración desde sistemas anteriores de la empresa.
**Pendiente:** Definir política de unificación de identidades de cliente y cómo se maneja el saldo acumulado en esos casos.

**LIM-03 — No hay modelo para Promociones "grupales" reales**
La Familia E incluye PROMO-E02 (Grupos), pero el modelo actual no define cómo verificar que un grupo de clientes está visitando "juntos" en el mismo momento. ¿Es suficiente que lleguen en la misma hora? ¿Deben estar vinculados en el sistema? ¿Quién paga cuál parte?

**Impacto:** Medio para negocios como restaurantes o spas donde las visitas grupales son comunes.
**Pendiente:** Especificar el protocolo de verificación de grupo.

**LIM-04 — El presupuesto total no tiene control en tiempo real perfecto**
En escenarios de alta concurrencia (Black Friday, campaña masiva), múltiples cajeros pueden estar procesando transacciones simultáneamente. El sistema de "reserva optimista" descrito en el Escenario 06 reduce el riesgo pero no lo elimina completamente. Es posible que se aplique un beneficio más del límite en ventanas de milisegundos.

**Impacto:** Bajo para la mayoría de los negocios; potencialmente alto para campañas de alto volumen.
**Pendiente:** Definir el comportamiento aceptable de "sobre-uso mínimo" vs. "corte estricto".

**LIM-05 — Las Promociones de "última visita del día" (PROMO-D04) requieren cierre del día**
Para saber quién es el último cliente, el sistema necesita definir el momento en que "el día termina". Si el negocio opera hasta medianoche y la zona horaria tiene un cambio de horario de verano ese día, el cálculo puede fallar o producir resultados inesperados.

**Impacto:** Bajo a nivel de frecuencia, pero puede causar disputas con clientes específicos.
**Pendiente:** Definir política de cierre del día y manejo de horarios de verano.

### 13.2 Inconsistencias identificadas

**INC-01 — Modo SUBSTITUTE vs. Familia A**
La descripción del modo SUBSTITUTE dice que aplica "el de mayor valor". Sin embargo, para tipos donde el "valor" es ambiguo antes de conocer el monto exacto de la transacción (e.g., un descuento porcentual siempre genera más ahorro que un monto fijo cuando la transacción supera cierto umbral, pero menos cuando es pequeña), el criterio de "mayor valor" no puede calcularse sin el contexto de la transacción específica. El Motor ya tiene acceso a este contexto, pero el documento no lo especifica explícitamente.

**Resolución sugerida:** Clarificar que "mayor valor" se calcula siempre en el contexto de la transacción actual, con el monto real de la misma.

**INC-02 — La condición CE-P07 (cumpleaños) y la restricción de uso único**
Una Promoción de cumpleaños con CE-P07 activa solo durante 1 día, y también CR-C01 (uso único). Son redundantes: si el cliente solo puede cumplir años una vez, la condición CE-P07 ya garantiza el uso único dentro del período configurado. La restricción CR-C01 podría bloquear al cliente si la empresa extiende la ventana a "todo el mes del cumpleaños" y quiere que el cliente use el beneficio más de una vez durante ese mes.

**Resolución sugerida:** Documentar que CR-C01 y CE-P07 pueden interactuar de formas inesperadas y recomendar qué combinaciones son coherentes.

**INC-03 — Prioridades sugeridas vs. prioridades configuradas**
La sección 8.5 propone rangos de prioridad "sugeridos" por familia. Sin embargo, un administrador podría asignar una Prioridad 1 (la más alta posible) a un descuento directo, anulando la lógica de que los planes tienen prioridad. El Motor respetará cualquier prioridad configurada, lo que podría producir resultados contrarios a las expectativas del administrador.

**Resolución sugerida:** La plataforma debería incluir una advertencia cuando el administrador asigna prioridades fuera de los rangos sugeridos.

**INC-04 — El modo de compatibilidad "Exclusiva" y las Campañas**
Si una Campaña agrupa dos Beneficios y uno de ellos es EXCLUSIVE, ¿eso hace que la Campaña completa sea EXCLUSIVE? El documento actual no define cómo se propaga el modo de compatibilidad dentro de una Campaña.

**Resolución sugerida:** Definir que el modo de compatibilidad es siempre del Beneficio individual, no de la Campaña. La Campaña puede tener una configuración de compatibilidad propia que sobreescribe la de sus Beneficios hijos, pero por defecto hereda del más restrictivo.

### 13.3 Casos de uso no cubiertos

**CUC-01 — Promociones con moneda extranjera**
El modelo actual asume que todas las transacciones ocurren en la misma moneda configurada para la empresa. No hay definición para empresas que operan en zonas fronterizas donde los clientes pagan en monedas diferentes.

**CUC-02 — Transferibilidad de beneficios acumulados**
¿Puede un cliente ceder sus puntos o sellos acumulados a otro cliente? El modelo no define esta posibilidad ni cómo el Motor la verificaría.

**CUC-03 — Herencia de beneficios por fallecimiento o incapacidad**
En membresías de largo plazo (plan anual), si el titular fallece, ¿el beneficio puede transferirse a un familiar? El modelo no contempla este caso de borde.

**CUC-04 — Promociones para clientes potenciales (no registrados)**
El Motor de Elegibilidad requiere que el cliente esté registrado (CE-P01). No hay mecanismo para atraer clientes antes de que se registren con un beneficio de "primera visita antes del registro".

**CUC-05 — Promociones entre empresas (B2B)**
El modelo actual asume que el beneficiario de una Promoción siempre es un cliente final (persona física). No hay definición para Promociones dirigidas a clientes empresariales (e.g., empresa B que recibe beneficios por usar los servicios de empresa A dentro de la plataforma).

**CUC-06 — Reversión de una validación y su impacto en acumulación**
Si una transacción es cancelada después de haber aplicado sellos o puntos, ¿el saldo acumulado del cliente se revierte? El modelo no define el flujo de "des-acumulación".

### 13.4 Reglas pendientes de definir

**RPD-01 — Comportamiento del Motor cuando la empresa agota su plan de suscripción**
Si la empresa tiene un plan STARTER con límite de 3 Promociones activas y tiene las 3 activas, ¿el Motor rechaza la activación de una cuarta o desactiva una existente? La regla de precedencia entre el plan de suscripción y las Promociones configuradas no está definida en este documento.

**RPD-02 — Qué ocurre con las Promociones activas cuando una empresa es suspendida**
Si el administrador de PASE suspende la cuenta de una empresa por falta de pago, ¿todas las Promociones activas pasan automáticamente a estado SUSPENDED? ¿Hay un período de gracia? ¿Los clientes que tenían beneficios activos (planes prepagados) los conservan?

**RPD-03 — Vencimiento de unidades acumuladas (puntos/sellos)**
El modelo menciona que las unidades acumuladas pueden tener fecha de vencimiento, pero no define el proceso de vencimiento: ¿el Motor vence las unidades en el momento exacto de su caducidad, o al inicio del próximo período de evaluación? ¿El cliente es notificado antes de que venzan?

**RPD-04 — Política de redondeo en descuentos porcentuales**
Si un descuento del 15% aplicado a un precio de $97 resulta en $82.45, ¿el sistema redondea hacia arriba, hacia abajo o al entero más cercano? ¿Esta política puede ser configurada por empresa o es fija?

**RPD-05 — Múltiples instancias del mismo tipo de Promoción**
Una empresa puede tener dos Promociones del tipo PROMO-A01 activas al mismo tiempo (e.g., 10% para todas las sucursales y 20% solo para la sucursal norte). Si un cliente visita la sucursal norte, ambas aplican para él. El modo de compatibilidad entre Promociones del mismo tipo no está explícitamente cubierto en la tabla de la Sección 8.3.

### 13.5 Decisiones de diseño a reconsiderar

**DDR-01 — Ciclo de vida con UNDER_REVIEW**
El estado UNDER_REVIEW agrega fricción al proceso para empresas pequeñas que necesitan publicar Promociones rápidamente. Para el plan STARTER, podría eliminarse este estado y permitir publicación directa. Esto sacrifica control por velocidad. Es una decisión de balance entre seguridad y usabilidad que debe ser tomada por el equipo de producto.

**DDR-02 — Restricción de no editar valor económico post-publicación**
La regla de no modificar el valor del beneficio una vez publicada la Promoción es conservadora y protectora. Sin embargo, puede generar frustración en el administrador que comete un error tipográfico al configurar el porcentaje. El flujo actual exige cancelar la Promoción y crear una nueva. Una alternativa podría ser un flujo de "corrección de emergencia" con aprobación doble y notificación a todos los clientes que ya usaron la Promoción.

**DDR-03 — El Motor aplica la Promoción de mayor valor en conflicto EXCLUSIVE**
Aplicar la Promoción de mayor valor para el cliente es lo más ético, pero no siempre es lo mejor para la empresa. Una empresa podría preferir que, en caso de conflicto EXCLUSIVE, se aplique la Promoción de menor costo para el negocio. Actualmente el Motor no tiene esta opción configurada.

### 13.6 Entidades y módulos que este documento asume pero no define

| Entidad / Módulo | Dependencia | Documento pendiente |
|---|---|---|
| Sistema Antifraude | CR-A04 asume que existe un sistema que puede marcar clientes | Motor Antifraude — Especificación Funcional |
| Módulo de Notificaciones | El Motor genera eventos que deben convertirse en notificaciones al cliente | Notification Engine — Especificación Funcional |
| Módulo de Identidad Verificada | CE-P07, CR-A03 asumen que existe verificación de identidad | Identity Verification — Especificación Funcional |
| Sistema de Segmentación de Clientes | CE-P10 asume un sistema que asigna clientes a segmentos | Customer Segmentation Engine — Especificación Funcional |
| Motor de Reporting y Analytics | El Motor genera eventos de métricas que deben ser procesados | Analytics Engine — Especificación Funcional |
| Módulo de Integraciones Externas | CE condiciones con fuentes externas requieren conectores | Integration Connectors — DM-004 (pendiente) |

---

## Apéndice A — Glosario del Motor

| Término | Definición en el contexto del Motor |
|---|---|
| **Activación** | El momento en que una Promoción pasa al estado ACTIVE y comienza a ser evaluada por el Motor |
| **Aplicación** | El acto de confirmar que una Promoción aplica para una transacción específica y registrar su uso |
| **Canje** | Para tipos de acumulación (Familia B), el momento en que el saldo acumulado es intercambiado por el beneficio |
| **Elegibilidad** | La condición de un cliente de calificar para una Promoción según su perfil e historial |
| **Evaluación** | El proceso completo del Motor para determinar si una Promoción aplica en una transacción |
| **Instancia de Beneficio** | El registro de un uso específico de un Beneficio por un cliente en una transacción |
| **Promoción Candidata** | Toda Promoción en estado ACTIVE que pasa el primer filtro de alcance (sucursal, canal, servicio) |
| **Restricción** | Un límite que puede impedir la aplicación de una Promoción aunque el cliente sea elegible |
| **Transacción** | Un evento de prestación de servicio o venta entre la empresa y el cliente |
| **Zona horaria de la empresa** | La zona horaria configurada en el perfil de la empresa, usada como referencia para todas las evaluaciones temporales |

---

## Apéndice B — Matriz de tipos de Promoción por plan de suscripción

| Familia | STARTER | GROWTH | BUSINESS | ENTERPRISE |
|---|---|---|---|---|
| A — Descuentos Directos | A01, A02 | A01–A05 | A01–A05 | A01–A05 |
| B — Acumulación y Canje | B01, B03 | B01–B06 | B01–B06 | B01–B06 |
| C — Planes y Membresías | C01, C02 | C01–C06 | C01–C06 | C01–C06 |
| D — Temporales | D01, D05 | D01–D06 | D01–D06 | D01–D06 |
| E — Sociales | — | E01, E04 | E01–E04 | E01–E04 |
| F — Condicionales | — | F01–F04 | F01–F06 | F01–F06 |
| G — Cupones y Códigos | G01 | G01–G04 | G01–G04 | G01–G04 |
| H — Combinadas | — | — | H01–H03 | H01–H04 |
| **Máx. Promociones activas** | **3** | **20** | **100** | **Ilimitadas** |
| **Campañas simultáneas** | **1** | **5** | **25** | **Ilimitadas** |

---

*Documento PE-001 v1.0.0 — PASE Digital Platform*
*Confidencial — Uso interno del equipo de producto e ingeniería*
*Próxima revisión programada: 3 meses desde la fecha de emisión*
