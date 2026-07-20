# Ofertas VIP — Regalos privados por lista cerrada

## 1 · La idea, interpretada

El negocio quiere premiar a clientes concretos (1 a cientos) con servicios o
regalos que **no se publican en ningún lado**: "a estos 10 clientes les doy 12
lavados gratis al mes durante un año". Se crea la oferta, se elige la lista,
se comparte un link — y **solo** los de la lista pueden reclamarla. Si el link
llega a alguien fuera de la lista, ve: *"Tu cuenta no aplica para esta
promoción."*

## 2 · Decisiones de diseño

| Tema | Decisión | Por qué |
| --- | --- | --- |
| Privacidad | La oferta NO aparece en marketplace, promociones ni feeds; solo por link con código no adivinable | Es un regalo dirigido, no marketing |
| Elegibilidad | Lista cerrada de `OfertaInvitado` (clientes ya registrados de la empresa) | El link puede circular: la barrera es la CUENTA, no el link |
| "12 al mes por un año" | `usosPorPeriodo` + `periodo` (SEMANAL/MENSUAL/TOTAL) + `vigenciaHasta` | Cupo renovable por período calendario (en la zona horaria del negocio) con fecha de fin |
| Reclamo | El invitado abre el link y pulsa "Reclamar" (`reclamadaAt`) | El negocio ve quién aceptó; el regalo aparece en Mis beneficios |
| Canje | El staff registra cada `OfertaUso` desde el panel; el sistema bloquea al llegar al cupo del período | Control anti-abuso sin depender de papel |
| Fuera de lista | Página con mensaje claro + CTA a registrarse/iniciar sesión | Convierte el "no aplica" en captación |
| Sin sesión | El link pide iniciar sesión (con retorno al link) | La elegibilidad se decide por cuenta |
| Estados | ACTIVA / PAUSADA / FINALIZADA + vigencia vencida | El negocio puede frenar el regalo en cualquier momento |
| Vista previa al compartir | OG genérica "Tienes un regalo 🎁" sin detalles | No filtra el contenido del regalo a terceros |
| Permisos | Nueva sección `ofertas` (roles admin plenos) | Mismo modelo fail-closed del panel |
| Borrado de clientes | Invitaciones y usos en cascada con el cliente | La purga del superadmin no cambia |

## 3 · Modelo de datos

- **`OfertaPrivada`**: empresa, `codigo` único (link `/oferta/[codigo]`),
  título, descripción, `usosPorPeriodo`, `periodo`, `vigenciaHasta`, estado.
- **`OfertaInvitado`**: (oferta, cliente) únicos + `reclamadaAt`.
- **`OfertaUso`**: canje individual con quién lo registró — historial
  permanente; el cupo del período se calcula contando usos desde el inicio del
  período calendario actual.

SQL: `prisma/migrations/20260750_ofertas_privadas/migration.sql`.

## 4 · Flujos

**Negocio (`/admin/ofertas`)**: crear (título, regla de usos, vigencia,
selector de clientes con búsqueda) → compartir link → detalle con invitados
(reclamó/no), usos del período por invitado, registrar uso, agregar/quitar
invitados, pausar/finalizar. Al crear, los invitados reciben notificación
"Tienes un regalo".

**Cliente (`/oferta/[codigo]`)**: invitado → ve el regalo y lo reclama; ya
reclamado → ve su contador del período; fuera de lista → "tu cuenta no
aplica"; sin sesión → iniciar sesión y volver. Los regalos reclamados también
se listan en **Mis beneficios**.

## 5 · Evolución prevista

- Canje directo desde el escáner QR del empleado.
- Importar lista por CSV / segmentos del CRM.
- Regalos con imagen y branding por oferta.
