# @membego/ui

Design system compartido de MembeGo (design tokens + componentes shadcn/ui).
Fuente única para `membego-app`, `membego-landing` y la futura app móvil.

Hoy vive dentro del repo de la app y se consume por alias de tsconfig
(`@/components/ui/*` y `@membego/ui/*`). Cuando se gradúe a su propio repositorio,
se publica en GitHub Packages y los consumidores lo instalan como dependencia
(`transpilePackages: ['@membego/ui']`).

- Componentes: `@membego/ui/ui/<componente>` (button, dialog, select, …).
- Utilidad: `@membego/ui/cn`.
