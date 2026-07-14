# CAPÍTULO 6 — EXPERIENCIA DEL CLIENTE FINAL (JOURNEY COMPLETO)

*Auditoría Maestra de MembeGo · Volumen 6*

---

## 6.1 El journey mapeado con puntos de abandono

```
DESCUBRE → REGISTRA → PRIMER BENEFICIO → PRIMER CANJE → HÁBITO → MEMBRESÍA → EMBAJADOR
   ▼           ▼             ▼               ▼            ▼          ▼           ▼
  A1          A2            A3              A4           A5         A6          A7
```

### A1 — Descubrimiento

**Hoy:** landing pública + marketplace + enlaces de invitación compartidos (el mejor canal implementado, con OG y landing en 2 pasos).
**Abandono probable:** quien llega al marketplace sin invitación no ve una razón para registrarse *hoy* (no hay oferta de bienvenida visible transversal ni "cerca de ti").
**Arreglo:** oferta de bienvenida por empresa como bloque hero del perfil + geolocalización en directorio.

### A2 — Registro

**Hoy:** formulario con nombre/email/teléfono/password; por campaña queda bien (2 pasos + confeti); verificación por correo cuando está habilitada.
**Abandonos detectables:**
1. **Password en el primer contacto.** Para un usuario que solo quiere su beneficio, crear-y-recordar contraseña es la fricción máxima. En LATAM el estándar de facto es OTP por WhatsApp/SMS o magic link.
2. **Verificación de email como bloqueo del premio** ("revisa tu correo…") — en móvil es un cambio de app con tasa de fuga alta.
**Arreglo (alto impacto):** registro con teléfono + OTP (el email pasa a opcional/perfil); el beneficio aparece en la wallet ANTES de verificar, con el canje condicionado a verificación si se quiere el candado.

### A3 — Primer beneficio

**Hoy:** bien resuelto en campañas (beneficio automático a wallet + notificación). Fuera de campañas, un registro orgánico puede aterrizar en una cuenta *vacía* — la muerte silenciosa del B2C.
**Regla propuesta:** **nadie aterriza en una wallet vacía.** Toda empresa define su beneficio de bienvenida al hacer onboarding (default sugerido); todo registro lo recibe.

### A4 — Primer canje (el momento de la verdad)

**Hoy:** el flujo técnico es sólido (QR → escáner → estados). Lo que falta es *psicología*:
- El cliente no sabe qué esperar ("¿muestro el QR? ¿dónde? ¿me lo van a aceptar?"). Falta una guía de primer uso de 2 pantallas.
- El éxito del canje es funcional, no memorable (Cap. 4, Principio 5).
- **Métrica clave que hoy nadie mira:** % de beneficios entregados que se canjean en <14 días. Es EL indicador de salud B2C de toda la plataforma y debe estar en el dashboard del superadmin y de cada empresa.

### A5 — Hábito

**Hoy:** feed de novedades, promos inteligentes, retos y puntos MembeGo existen — piezas correctas, sin *loop* que las una.
**El loop propuesto** (detalle en Cap. 8): visita → sello/progreso visible → recompensa → razón de volver. Sin notificaciones externas (email/WhatsApp/push) el hábito no puede sostenerse: la app no puede llamar al usuario que no la abre. **Canales externos = prerequisito del hábito.**

### A6 — Membresía (monetización del hábito)

**Hoy:** comprar membresía = transferir + subir comprobante + esperar aprobación. Para un cliente que quiere prepagar, cada hora de "pendiente de aprobación" es arrepentimiento.
**Arreglo:** pasarela (Cap. 13 P0) y, mientras llega, SLA visible ("tu comprobante se revisa en <2h") + notificación inmediata de resultado.

### A7 — Embajador

**Hoy:** Invita y Gana funcional y bien diseñado (metas, premios automáticos).
**Mejoras:** compartir con vista previa personalizada (nombre del que invita ya está en la landing — falta en el share sheet), y estados intermedios de la meta ("te falta 1 amigo" debe ser notificación externa, no solo texto en la página).

## 6.2 Los tres números del cliente

Toda la experiencia B2C debería rendirse a tres números visibles en la home:

1. **Cuánto valor tienes** (RD$ en wallet) — posesión.
2. **Cuánto has ahorrado** (RD$ histórico) — justificación de permanencia.
3. **Qué está por vencer** — urgencia honesta.

Los tres son calculables con datos actuales (`ProductoCompra`, precios, vencimientos). Hoy ninguno se muestra como número monetario.

## 6.3 Móvil

El cliente de MembeGo es 90%+ móvil (el QR solo existe en el teléfono). Sin embargo el producto es una web responsive sin: instalación (PWA con manifest + service worker), push nativo, ni acceso rápido al QR (tab bar). El orden correcto de inversión:

1. **PWA completa** (manifest, instalable, offline básico de wallet, push web) — semanas, no meses.
2. **Tab bar B2C** con QR al centro (Cap. 5 wireframe).
3. App nativa (o Capacitor sobre lo existente) recién cuando la retención justifique el costo — horizonte "Escalar".

---

*Continúa en el Volumen 7: Experiencia de la empresa.*
