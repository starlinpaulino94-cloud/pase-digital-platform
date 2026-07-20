'use client'

/**
 * Botón que dispara la impresión del reporte de registros (Control de
 * comprobantes · Fase 3 · G10). El bloque imprimible lo renderiza la página
 * (server) dentro de `.registros-print`, aislado por `@media print`.
 */

import { Printer } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function ImprimirReporteButton({ label = 'Imprimir reporte' }: { label?: string }) {
  return (
    <Button variant="outline" size="sm" className="gap-1.5" onClick={() => window.print()}>
      <Printer className="h-3.5 w-3.5" /> {label}
    </Button>
  )
}
