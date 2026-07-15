/**
 * Transición de entrada en cada navegación del portal (template.tsx se
 * vuelve a montar por ruta, a diferencia de layout). slide-up con curva
 * spring (0.5s) para una sensación de app nativa; se anula con
 * prefers-reduced-motion (globals.css).
 */
export default function PanelTemplate({ children }: { children: React.ReactNode }) {
  return <div className="animate-slide-up">{children}</div>
}
