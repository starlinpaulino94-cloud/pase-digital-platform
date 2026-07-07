'use client'

import Link from 'next/link'
import { type ColumnDef } from '@tanstack/react-table'
import { ExternalLink } from 'lucide-react'
import { DataTable } from '@/components/ui/data-table'
import { EstadoBadge } from '@/components/EstadoBadge'
import type { MembershipEstado } from '@/types'

export interface MembershipRow {
  id: string
  estado: MembershipEstado
  createdAt: Date
  fechaInicio: Date | null
  fechaVencimiento: Date | null
  lavadosRestantes: number
  cliente: { id: string; nombre: string }
  plan: { nombre: string; esIlimitado: boolean }
}

const columns: ColumnDef<MembershipRow>[] = [
  {
    accessorKey: 'cliente.nombre',
    header: 'Cliente',
    cell: ({ row }) => (
      <Link
        href={`/admin/clientes/${row.original.cliente.id}`}
        className="font-medium text-sky-600 hover:underline"
      >
        {row.original.cliente.nombre}
      </Link>
    ),
  },
  {
    accessorKey: 'plan.nombre',
    header: 'Plan',
  },
  {
    accessorKey: 'estado',
    header: 'Estado',
    cell: ({ row }) => <EstadoBadge estado={row.getValue('estado')} />,
  },
  {
    accessorKey: 'fechaInicio',
    header: 'Inicio',
    cell: ({ row }) => {
      const date = row.getValue('fechaInicio') as Date | null
      if (!date) return '—'
      return new Intl.DateTimeFormat('es-DO', { dateStyle: 'short' }).format(date)
    },
  },
  {
    accessorKey: 'fechaVencimiento',
    header: 'Vencimiento',
    cell: ({ row }) => {
      const date = row.getValue('fechaVencimiento') as Date | null
      if (!date) return '—'
      return new Intl.DateTimeFormat('es-DO', { dateStyle: 'short' }).format(date)
    },
  },
  {
    id: 'usos',
    header: 'Usos rest.',
    cell: ({ row }) =>
      row.original.plan.esIlimitado ? '∞' : row.original.lavadosRestantes,
  },
  {
    id: 'actions',
    header: 'Acciones',
    cell: ({ row }) => (
      <Link href={`/admin/membresias/${row.original.id}`} title="Ver detalles">
        <ExternalLink className="h-4 w-4 text-slate-400 hover:text-slate-600" />
      </Link>
    ),
  },
]

export function MembresíasTable({ data }: { data: MembershipRow[] }) {
  return (
    <DataTable
      columns={columns as unknown as ColumnDef<Record<string, unknown>, unknown>[]}
      data={data as unknown as Record<string, unknown>[]}
      searchPlaceholder="Buscar por cliente o plan..."
      searchKey="cliente.nombre"
      pageSize={15}
      exportable
      exportFilename="membresias.csv"
    />
  )
}
