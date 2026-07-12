'use client'

import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts'

interface DataPoint {
  estado: string
  total: number
}

const COLORS: Record<string, string> = {
  'Activas': '#22c55e',
  'Pendiente': '#f59e0b',
  'Vencidas': '#94a3b8',
  'Canceladas': '#ef4444',
}

export function MembresiasPie({ data }: { data: DataPoint[] }) {
  const withData = data.filter((d) => d.total > 0)

  return (
    <div className="rounded-xl border bg-card p-5 shadow-sm">
      <h3 className="mb-4 text-sm font-semibold text-foreground">Membresías por estado</h3>
      {withData.length === 0 ? (
        <div className="flex h-[180px] items-center justify-center text-sm text-muted-foreground">
          Sin datos
        </div>
      ) : (
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
                background: '#fff',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                fontSize: '12px',
              }}
            />
            <Legend wrapperStyle={{ fontSize: 12 }} />
          </PieChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}
