# CAPÍTULO 9 — ECOSISTEMA DE FIDELIZACIÓN

*Auditoría Maestra de MembeGo · Volumen 9*

---

## 9.1 El principio: dos lealtades, un ecosistema

MembeGo debe cultivar **dos lealtades distintas que se refuerzan**:

1. **Lealtad del cliente a la EMPRESA** (vertical): sellos, niveles VIP, membresías, promos. La paga la empresa; MembeGo la instrumenta.
2. **Lealtad del cliente a MEMBEGO** (horizontal): puntos de plataforma, beneficios cruzados, nivel global. La paga la plataforma; es el foso competitivo — una empresa puede irse de MembeGo, pero el cliente con 8 tarjetas en su wallet no se va.

El código ya insinúa ambas (puntos MembeGo globales + programas por empresa); falta declararlas y diseñarlas como sistema.

## 9.2 El mapa completo del ecosistema

```
                         ┌─────────────────────────┐
                         │        CLIENTE           │
                         └────────────┬────────────┘
            LEALTAD VERTICAL          │         LEALTAD HORIZONTAL
        (por cada empresa)            │         (a la plataforma)
   ┌──────────────────────────┐      │     ┌──────────────────────────┐
   │ Sellos por visita         │      │     │ Puntos MembeGo           │
   │ Niveles Regular→VIP       │      │     │ Nivel global (Bronce→Oro)│
   │ Membresías prepagadas     │      │     │ Beneficios cruzados      │
   │ Rachas mensuales          │      │     │ Retos de temporada       │
   │ Promos segmentadas        │      │     │ Ranking/insignias        │
   └──────────────┬───────────┘      │     └──────────────┬───────────┘
                  └────────── ambas terminan ─────────────┘
                          en la MISMA WALLET (E8)
```

Regla de oro (repetida a propósito desde el Cap. 8): **toda recompensa, del programa que sea, se materializa como tarjeta-beneficio E8 en la wallet**. Una sola economía, un solo canje, una sola trazabilidad.

## 9.3 Los componentes pedidos en el brief, uno a uno

- **Niveles:** dos escalas (empresa y plataforma), pocas capas (3-4), umbrales visibles, mantenimiento por actividad (estatus que se defiende). Nunca degradar sin aviso previo por canal externo.
- **Insignias:** por hitos verificados (primer canje, 10 visitas, fundador, embajador 5 amigos). Cada insignia con share card (adquisición orgánica).
- **Misiones/desafíos:** semanales y quincenales, generadas de plantillas ("visita 2 empresas distintas esta semana", "canjea antes del viernes"). Ya existe el modelo de retos (RG.4) — falta rotación programada y recompensa en wallet.
- **Logros:** permanentes (insignias) vs misiones (temporales). No mezclar en la misma UI.
- **Eventos/temporadas:** "Temporada Verano MembeGo" (6-8 semanas): un pase de temporada simple — misiones acumulan puntos de temporada → 3 cofres de recompensa (básico/medio/grande). Reinicia el interés del sistema cada temporada y da calendario de marketing a la plataforma.
- **Recompensas:** catálogo de canje de puntos MembeGo → beneficios donados/cofinanciados por empresas (la empresa gana tráfico nuevo; MembeGo paga poco). Es el motor de los *beneficios cruzados*.
- **Campañas:** las campañas "Invita y Gana" (ya construidas) se vuelven el *booster* estándar: cualquier mecánica puede tener multiplicador temporal ("esta semana, sellos dobles").
- **Ranking:** solo en contextos donde motiva y no humilla: ranking de referidores del mes (ya existe base), ranking de reto de temporada. Nunca ranking de gasto.
- **Empresas favoritas:** el follow ya existe (CompanyFollow); convertirlo en preferencia real: los favoritos ordenan la wallet, el feed y las notificaciones.
- **Programas VIP:** nivel máximo por empresa con: beneficio exclusivo mensual, acceso anticipado a promos, y señal visible al empleado en el escáner.
- **Beneficios cruzados:** el diferenciador de plataforma. Mecánica concreta: al alcanzar nivel Plata MembeGo, el cliente elige 1 "beneficio de descubrimiento" de una empresa donde NUNCA ha canjeado (500m a la redonda). La empresa receptora paga solo si hay canje (CPA puro, medible por QR).

## 9.4 Qué NO hacer

1. **No crear una segunda moneda por empresa** (puntos de AutoSpa + puntos de Café Roma + puntos MembeGo = confusión). Los sellos son por empresa; los *puntos* son solo de plataforma.
2. **No pagar puntos por acciones no verificadas** (abrir la app, ver una promo). Devalúa la moneda y atrae granjas.
3. **No lanzar todo el ecosistema junto.** Orden: sellos → insignias → niveles empresa → puntos plataforma/canje → temporadas → cruzados. Cada pieza debe demostrar retención antes de la siguiente.
4. **No usar presión artificial** (contadores falsos, escasez inventada). La marca es "beneficios verificados de verdad"; la presión falsa la contamina.

## 9.5 Métricas del ecosistema (definir ANTES de construir)

| Métrica | Qué valida |
|---|---|
| % beneficios canjeados <14 días | Salud del valor percibido |
| Visitas/cliente/mes (por empresa) | Efecto de sellos y rachas |
| Retención M1/M3 del cliente | Efecto del ecosistema completo |
| % clientes multi-empresa | Lealtad horizontal (el foso) |
| Canje de beneficios cruzados | Efecto red monetizable |
| NPS post-canje (1 pregunta en pantalla de éxito) | Confianza |

---

*Continúa en el Volumen 10: Rendimiento.*
