'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { Search, Ticket as TicketIcon } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { EmptyState } from '@/components/ui/empty-state'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  TICKET_ESTADOS,
  estadoLabel,
  estadoBadgeClass,
  categoriaLabel,
} from '@/lib/soporte'

export interface TicketRow {
  id: string
  asunto: string
  estado: string
  categoria: string
  clienteNombre: string
  empresaNombre: string
  mensajes: number
  actualizado: string
  showEmpresa: boolean
}

export function TicketsTable({ tickets }: { tickets: TicketRow[] }) {
  const [q, setQ] = useState('')
  const [estado, setEstado] = useState('TODOS')

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase()
    return tickets.filter((t) => {
      if (estado !== 'TODOS' && t.estado !== estado) return false
      if (!term) return true
      return (
        t.asunto.toLowerCase().includes(term) ||
        t.clienteNombre.toLowerCase().includes(term)
      )
    })
  }, [tickets, q, estado])

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-56">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar por asunto o cliente…"
            className="pl-9"
          />
        </div>
        <Select value={estado} onValueChange={setEstado}>
          <SelectTrigger className="w-52">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="TODOS">Todos los estados</SelectItem>
            {TICKET_ESTADOS.map((e) => (
              <SelectItem key={e} value={e}>
                {estadoLabel(e)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={<TicketIcon className="h-6 w-6" />}
          title="Sin tickets"
          description="No hay tickets que coincidan con los filtros."
        />
      ) : (
        <div className="space-y-2">
          {filtered.map((t) => (
            <Link key={t.id} href={`/admin/tickets/${t.id}`} className="block">
              <Card className="transition hover:shadow-card-hover">
                <CardContent className="flex items-center gap-4 py-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate font-medium text-foreground">{t.asunto}</p>
                      <Badge variant="secondary" className="text-xs">
                        {categoriaLabel(t.categoria)}
                      </Badge>
                    </div>
                    <p className="mt-0.5 text-sm text-muted-foreground">
                      {t.clienteNombre}
                      {t.showEmpresa && <span> · {t.empresaNombre}</span>}
                      <span> · {t.mensajes} mensaje{t.mensajes !== 1 ? 's' : ''}</span>
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <Badge className={estadoBadgeClass(t.estado)}>{estadoLabel(t.estado)}</Badge>
                    <span className="text-xs text-muted-foreground">{t.actualizado}</span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
