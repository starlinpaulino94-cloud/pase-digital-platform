# CAPÍTULO 12 — BRANDING

*Auditoría Maestra de MembeGo · Volumen 12*

---

## 12.1 Diagnóstico de la marca actual

**El nombre:** MembeGo es un buen nombre. Corto, pronunciable en español e inglés, con raíz semántica clara (membership + go = "tu membresía en movimiento") y dominio de marca defendible. Se conserva. Problemas alrededor del nombre:

1. **Identidad residual:** el repositorio se llama `pase-digital-platform` y quedan rastros del naming anterior ("Pase Digital"). Toda superficie visible (títulos, correos, metadatos, package `membego-platform` ya migrado) debe decir una sola cosa.
2. **Sub-marcas accidentales:** "Invita y Gana", "Growth Engine", "Estrategias", "Retos MembeGo" — nombres internos de fase que se filtran a la UI con jerarquías confusas. La marca necesita una **arquitectura de nombres**: MembeGo (maestra) → MembeGo Wallet, MembeGo Panel, MembeGo Scanner (productos) → "Invita y gana", "Sellos", "Temporadas" (features, siempre en minúscula descriptiva, nunca como marcas).
3. **Sin voz definida:** los textos oscilan entre corporativo ("Gestione sus promociones") y efusivo ("🎉 ¡¡Bienvenido!!"). Sin guía, cada pantalla improvisa.

**El logo/símbolo:** no hay evidencia en el código de un símbolo propietario (se usan logos de empresas y iconografía Lucide genérica). La marca no tiene "firma gráfica".

## 12.2 Plataforma de marca propuesta

- **Esencia:** *"Lo que ganas, se cumple."* — MembeGo es el garante de que el beneficio prometido se entrega y se canjea de verdad (el QR verificado es la prueba física de esa promesa).
- **Personalidad (3 rasgos):** Cercano (habla como el colmado, no como el banco) · Cumplidor (precisión, números claros, cero letra pequeña) · Vivo (celebra los momentos: canje, meta, racha).
- **Promesa B2C:** "Tus beneficios, de verdad, en tu bolsillo."
- **Promesa B2B:** "Clientes que vuelven, con pruebas."

## 12.3 Identidad verbal (guía de voz)

| Regla | ❌ Evitar | ✅ Usar |
|---|---|---|
| Tú, no usted | "Gestione sus clientes" | "Tus clientes" |
| Valor concreto, no adjetivos | "¡Increíble promoción!" | "Lavado gratis · RD$450" |
| Celebrar hitos, no inflar todo | "¡¡¡Felicidades!!!" en cada toast | Entusiasmo reservado a canje/meta/racha |
| Números con contexto | "46 canjes" | "46 canjes · RD$18,300 para tu negocio" |
| Español LATAM neutro con guiños locales | anglicismos de dashboard | "beneficios", "sellos", "tu negocio" |

## 12.4 Identidad visual

- **Símbolo propuesto:** la **"M-pulso"** — una M cuya última asta emite dos ondas concéntricas (el "beep" del canje). Funciona como app icon, favicon, sello de éxito de canje y marca de agua en tarjetas-beneficio. Un solo concepto, cuatro usos.
- **Color:** jade `#0FBF8F` + ámbar `#FFB020` (definidos en Cap. 5). El jade es propietario frente al mar de índigos/violetas del SaaS y del verde-WhatsApp saturado del mercado local.
- **Iconografía:** Lucide como base está bien (consistencia barata), pero los 6 iconos de conceptos-clave (wallet, sello, canje, racha, nivel, invitar) deben ser dibujos propios derivados de la M-pulso.
- **Fotografía/ilustración:** negocios locales reales (mostradores, car wash, barberías) con tinte jade — nunca stock corporativo de oficinas.

## 12.5 La marca en el producto (dónde se gana o se pierde)

1. **La pantalla de canje exitoso** es el logo animado de la marca: pulso jade + nombre del cliente + valor. Es el momento que cliente y negocio ven juntos — el "cha-ching" de MembeGo.
2. **La tarjeta-beneficio** es el objeto de marca: siempre con sello M-pulso, siempre con la misma anatomía, aunque cada empresa ponga su color y logo.
3. **Los correos/notificaciones** llevan la misma voz (hoy inexistente como sistema).
4. **La landing de invitación** ya personaliza con color de empresa: correcto, pero el marco (header/footer/sello) debe ser inconfundiblemente MembeGo — el invitado debe recordar a la plataforma, no solo al negocio.

## 12.6 Checklist de consistencia (auditable)

- [ ] Cero menciones visibles de "Pase Digital" en UI, correos, metadatos y documentos públicos.
- [ ] Un solo nombre por feature (matar sinónimos: Campañas≠Estrategias≠Automatizaciones en la UI).
- [ ] Guía de voz de 1 página aplicada a los 30 textos más vistos (toasts, empty states, notificaciones).
- [ ] Símbolo M-pulso en: app icon/favicon, éxito de canje, tarjeta-beneficio, share cards.
- [ ] Plantilla de email transaccional con la identidad (cuando exista el canal, Cap. 3.13).
- [ ] Los colores de empresa nunca sustituyen el marco MembeGo (regla del Cap. 5.3).

---

*Continúa en el Volumen 13: Roadmap.*
