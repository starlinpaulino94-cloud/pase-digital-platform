# CAPÍTULO 13 — ROADMAP, PRIORIDADES, ESTIMACIONES Y RIESGOS

*Auditoría Maestra de MembeGo · Volumen 13 (final)*

---

## 13.1 Lógica de priorización

Cuatro horizontes secuenciales. **Regla de entrada:** no se abre un horizonte sin cerrar los criterios de salida del anterior. Estimaciones asumen 1-2 desarrolladores full-time con asistencia de IA (el ritmo histórico real de este repo); son de esfuerzo, no de calendario garantizado.

```
H1 ESTABILIZAR (0-2 meses)  → que lo construido sea confiable
H2 MONETIZAR   (2-4 meses)  → que el negocio pueda cobrar y demostrar valor
H3 DIFERENCIAR (4-8 meses)  → que nadie más pueda ofrecer lo mismo
H4 ESCALAR     (8-12+ meses)→ que crezca sin romperse
```

## 13.2 H1 — ESTABILIZAR (0-2 meses)

| ID | Entregable | Ref. | Est. |
|---|---|---|---|
| E-1 | Tests de los 6 flujos críticos (registro, atribución, compra, QR, canje, campaña) + CI gate | A-1 | 2-3 sem |
| E-2 | Extraer motores del runtime (paquete aparte), congelar dual-write, limpiar ~20 modelos | A-2 | 2 sem |
| E-3 | Rate limiting compartido (Postgres/Upstash) | S-2 | 3 días |
| E-4 | Una fuente de migraciones | A-4 | 3 días |
| E-5 | ISR/caching de todo lo público + Promise.all/select en páginas top | P-1,P-2 | 2 sem |
| E-6 | Zod en fronteras (FormData + Json) en módulos críticos | A-5 | 1-2 sem |
| E-7 | Auditoría IDOR + verificación QR company-match | S-1,S-3 | 1-2 sem |
| E-8 | Observabilidad mínima (queries lentas, alerta de cron, métricas de ruta) | P-5 | 3 días |

**Criterio de salida H1:** CI verde con tests reales; TTFB público <200ms; cero rutas sin verificación de tenencia conocida; una sola fuente de esquema.

## 13.3 H2 — MONETIZAR (2-4 meses)

| ID | Entregable | Ref. | Est. |
|---|---|---|---|
| M-1 | **Pasarela de pagos** (1er provider: Azul o CardNET para RD; Stripe si aplica) sobre el puerto `lib/payments` existente: compra de promo + membresía con cobro real | Cap. 3.14 | 3-4 sem |
| M-2 | Cobro recurrente de membresías + recordatorios de vencimiento | Cap. 3.4 | 2 sem |
| M-3 | Dashboard "estado de resultados de fidelización" para empresa | Cap. 7.3 | 2 sem |
| M-4 | Planes SaaS de MembeGo (Gratis/Crecimiento/Pro) con gating real en el producto | Cap. 7.4 | 2-3 sem |
| M-5 | Email transaccional (beneficio recibido / por vencer / membresía) | Cap. 3.13 | 1-2 sem |
| M-6 | Registro con teléfono + OTP; wallet nunca vacía (beneficio de bienvenida universal) | Cap. 6 A2/A3 | 2 sem |

**Criterio de salida H2:** una empresa puede pagar a MembeGo y cobrar a sus clientes sin tocar un comprobante; el dashboard muestra RD$ generados.

## 13.4 H3 — DIFERENCIAR (4-8 meses)

| ID | Entregable | Ref. | Est. |
|---|---|---|---|
| D-1 | Design System Pulse (tokens, tarjeta-beneficio, QR fullscreen, homes nuevas, momento de canje) | Cap. 5 | 4-6 sem |
| D-2 | PWA completa + tab bar + push web | Cap. 6.3 | 3 sem |
| D-3 | Sellos digitales + insignias + niveles/VIP en escáner | Cap. 8 | 4-6 sem |
| D-4 | Consolidación de referidos en dominio único (hecho + proyecciones) | A-3 | 3 sem |
| D-5 | Sidebar B2B reorganizado (5 dominios, modo simple) + plantillas a 1 clic + CRM accionable | Cap. 4, 7 | 4 sem |
| D-6 | Geolocalización del marketplace ("cerca de ti") | Cap. 3.1 | 2 sem |
| D-7 | WhatsApp (notificaciones de beneficio/vencimiento vía provider tipo Twilio/360dialog) | Cap. 3.13 | 3 sem |
| D-8 | Modo offline del escáner | Cap. 3.6 | 2 sem |

**Criterio de salida H3:** retención M1 de clientes >40%; % de canje <14 días >50%; NPS de canje medido; la demo de sellos digitales cierra ventas B2B sola.

## 13.5 H4 — ESCALAR (8-12+ meses)

- Puntos MembeGo + catálogo de canje + beneficios cruzados (Cap. 9) — el foso de plataforma.
- Temporadas y pase de temporada.
- Multi-sucursal operativo completo + benchmark por vertical (plan Pro).
- API pública + webhooks (integraciones POS).
- App nativa (o Capacitor) si la retención lo justifica.
- Reincorporar motores del paquete aislado SOLO donde una feature los pida (p. ej. Automation Engine cuando las automatizaciones con interruptores se queden cortas).
- Expansión geográfica: ciudad por ciudad, vertical por vertical (Cap. 1.4).

## 13.6 Qué NO hacer (lista negra explícita)

1. **No escribir más motores/frameworks especulativos** sin un consumidor de UI comprometido en el mismo sprint.
2. **No crear un 5º sistema de referidos** ni un 3º de promociones. Toda feature nueva de estos dominios se construye sobre el dominio consolidado.
3. **No lanzar dark patterns** (escasez falsa, contadores fake, ruletas engañosas).
4. **No hacer big-bang redesign** de toda la UI a la vez; migrar módulo a módulo con Pulse.
5. **No añadir secciones nuevas al panel de empresa** hasta reagruparlo (el problema es exceso, no falta).
6. **No perseguir multi-idioma/multi-moneda** antes de dominar un mercado (RD) — complejidad prematura.
7. **No construir la app nativa antes que la PWA** demuestre retención.

## 13.7 Riesgos del roadmap

| Riesgo | Señal temprana | Plan B |
|---|---|---|
| La consolidación (E-2, D-4) rompe producción | Tests E-1 fallando | Por eso E-1 va PRIMERO; feature flags + rollback por módulo |
| El proveedor de pagos local demora certificación | Semanas sin sandbox | Empezar trámite YA en H1; Stripe como fallback si el mercado lo permite |
| Capacidad: 1-2 devs no cubren H2+H3 | Slippage >30% en H1 | Recortar H3 a D-1/D-2/D-3; contratar antes de abrir H4 |
| Adopción B2B lenta pese a features | <20 empresas activas al fin de H2 | Pivotar go-to-market a 1 vertical con venta presencial antes de más producto |
| Fraude crece con volumen | Flags sospechosos >5% de registros | Adelantar S-6 (anomalías) y OTP |

## 13.8 Checklist maestro (resumen ejecutable)

**H1:** [ ] E-1 tests · [ ] E-2 motores fuera · [ ] E-3 rate limit real · [ ] E-4 migraciones únicas · [ ] E-5 caching público · [ ] E-6 zod · [ ] E-7 IDOR/QR · [ ] E-8 observabilidad
**H2:** [ ] M-1 pasarela · [ ] M-2 recurrencia · [ ] M-3 dashboard RD$ · [ ] M-4 planes SaaS · [ ] M-5 email · [ ] M-6 OTP + wallet nunca vacía
**H3:** [ ] D-1 Pulse · [ ] D-2 PWA · [ ] D-3 sellos/niveles · [ ] D-4 referidos únicos · [ ] D-5 panel B2B nuevo · [ ] D-6 geo · [ ] D-7 WhatsApp · [ ] D-8 offline
**H4:** [ ] puntos+cruzados · [ ] temporadas · [ ] multi-sucursal/benchmark · [ ] API pública · [ ] app nativa (condicional)

## 13.9 Conclusión de la consultoría

MembeGo no necesita más ideas: necesita **secuencia**. El producto tiene el activo técnico correcto (el canje verificado), el mercado correcto (comercio local LATAM) y una amplitud funcional que ya quisiera cualquier competidor local. Lo que lo separa de "la mejor plataforma de Latinoamérica" es, en orden: confiabilidad demostrable (tests + consolidación), capacidad de cobrar (pasarela), una experiencia con firma propia (Pulse + los tres momentos), y un ecosistema de lealtad honesto construido sobre datos verificados que nadie más tiene.

La disciplina de decir "no" al horizonte 4 mientras se ejecuta el horizonte 1 valdrá más que cualquier feature de esta lista.

---

*Fin de la Auditoría Maestra. Volúmenes 0-13 en `docs/auditoria-maestra/`.*
