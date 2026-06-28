import { cn } from '@/lib/utils'

interface StatCardProps {
  label: string
  value: string | number
  sub?: string
  trend?: { value: number; positive?: boolean }
  accent?: 'blue' | 'green' | 'amber' | 'red' | 'purple'
  className?: string
}

const accentMap = {
  blue:   { dot: 'bg-blue-500',   text: 'text-blue-600',   bg: 'bg-blue-50'   },
  green:  { dot: 'bg-emerald-500', text: 'text-emerald-600', bg: 'bg-emerald-50' },
  amber:  { dot: 'bg-amber-500',  text: 'text-amber-600',  bg: 'bg-amber-50'  },
  red:    { dot: 'bg-red-500',    text: 'text-red-600',    bg: 'bg-red-50'    },
  purple: { dot: 'bg-violet-500', text: 'text-violet-600', bg: 'bg-violet-50' },
}

export function StatCard({ label, value, sub, trend, accent, className }: StatCardProps) {
  const a = accent ? accentMap[accent] : null

  return (
    <div
      className={cn(
        'group relative bg-card border border-border rounded-xl p-5 shadow-card transition-all duration-200 hover:shadow-card-hover hover:-translate-y-0.5',
        className
      )}
    >
      {a && (
        <div className={cn('absolute inset-x-0 top-0 h-0.5 rounded-t-xl', a.dot)} />
      )}
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        {trend && (
          <span
            className={cn(
              'text-xs font-medium px-1.5 py-0.5 rounded-md',
              trend.positive !== false
                ? 'text-emerald-700 bg-emerald-50'
                : 'text-red-700 bg-red-50'
            )}
          >
            {trend.positive !== false ? '+' : ''}{trend.value}%
          </span>
        )}
      </div>
      <p className="mt-2 text-2xl font-bold tracking-tight text-foreground">{value}</p>
      {sub && <p className="mt-0.5 text-xs text-muted-foreground">{sub}</p>}
    </div>
  )
}
