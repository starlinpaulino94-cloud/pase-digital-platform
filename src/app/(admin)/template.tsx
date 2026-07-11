/**
 * Transición sutil de entrada en cada navegación del panel (template.tsx se
 * vuelve a montar por ruta, a diferencia de layout). La animación se anula
 * con prefers-reduced-motion (globals.css).
 */
export default function PanelTemplate({ children }: { children: React.ReactNode }) {
  return <div className="animate-fade-up">{children}</div>
}
