'use client'

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'

interface DataPoint {
  estado: string
  total: number
}

const COLORS: Record<string, string> = {
  'Activas': '#22c55e',
  'Pendiente pago': '#f59e0b',
  'Completadas': '#3b82f6',
  'Expiradas': '#94a3b8',
  'Canceladas': '#ef4444',
}

interface Props {
  data: DataPoint[]
}

export function AsignacionesDonut({ data }: Props) {
  const withData = data.filter((d) => d.total > 0)

  if (withData.length === 0) {
    return (
      <div className="bg-card border border-border rounded-xl p-5">
        <h3 className="text-sm font-semibold text-foreground mb-4">Asignaciones por estado</h3>
        <div className="flex items-center justify-center h-[180px] text-sm text-muted-foreground">
          Sin datos
        </div>
      </div>
    )
  }

  return (
    <div className="bg-card border border-border rounded-xl p-5">
      <h3 className="text-sm font-semibold text-foreground mb-4">Asignaciones por estado</h3>
      <ResponsiveContainer width="100%" height={220}>
        <PieChart>
          <Pie
            data={withData}
            dataKey="total"
            nameKey="estado"
            cx="50%"
            cy="50%"
            innerRadius={55}
            outerRadius={85}
            paddingAngle={3}
          >
            {withData.map((entry) => (
              <Cell key={entry.estado} fill={COLORS[entry.estado] ?? '#6366f1'} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              background: 'var(--card)',
              border: '1px solid var(--border)',
              borderRadius: '8px',
              fontSize: '12px',
            }}
          />
          <Legend wrapperStyle={{ fontSize: 12 }} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}
