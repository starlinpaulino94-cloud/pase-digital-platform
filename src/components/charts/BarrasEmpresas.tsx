'use client'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts'

const COLORS = ['#3b82f6', '#8b5cf6', '#22c55e', '#f59e0b', '#ef4444']

interface DataPoint {
  nombre: string
  total: number
}

export function BarrasEmpresas({ data, titulo = 'Empresas más activas' }: { data: DataPoint[]; titulo?: string }) {
  if (data.length === 0) {
    return (
      <div className="rounded-xl border bg-white p-5 shadow-sm">
        <h3 className="mb-4 text-sm font-semibold text-slate-800">{titulo}</h3>
        <div className="flex h-[180px] items-center justify-center text-sm text-slate-400">Sin datos</div>
      </div>
    )
  }

  return (
    <div className="rounded-xl border bg-white p-5 shadow-sm">
      <h3 className="mb-4 text-sm font-semibold text-slate-800">{titulo}</h3>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis
            dataKey="nombre"
            tick={{ fontSize: 11 }}
            stroke="#94a3b8"
            interval={0}
            tickFormatter={(v: string) => (v.length > 10 ? v.slice(0, 10) + '…' : v)}
          />
          <YAxis tick={{ fontSize: 11 }} stroke="#94a3b8" allowDecimals={false} />
          <Tooltip
            contentStyle={{
              background: '#fff',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              fontSize: '12px',
            }}
          />
          <Bar dataKey="total" name="Visitas" radius={[4, 4, 0, 0]}>
            {data.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
