import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface StatCardProps {
  label: string
  value: string | number
  sub?: string
  icon?: LucideIcon
  trend?: { value: number; positive?: boolean }
  accent?: 'sky' | 'green' | 'amber' | 'red' | 'indigo' | 'violet'
  className?: string
}

const ACCENT = {
  sky:    { bar: 'bg-sky-500',    iconBg: 'bg-sky-50 ring-sky-100',    iconText: 'text-sky-600'    },
  green:  { bar: 'bg-green-500',  iconBg: 'bg-green-50 ring-green-100', iconText: 'text-green-600'  },
  amber:  { bar: 'bg-amber-500',  iconBg: 'bg-amber-50 ring-amber-100', iconText: 'text-amber-600'  },
  red:    { bar: 'bg-red-500',    iconBg: 'bg-red-50 ring-red-100',     iconText: 'text-red-600'    },
  indigo: { bar: 'bg-indigo-500', iconBg: 'bg-indigo-50 ring-indigo-100', iconText: 'text-indigo-600' },
  violet: { bar: 'bg-violet-500', iconBg: 'bg-violet-50 ring-violet-100', iconText: 'text-violet-600' },
}

export function StatCard({ label, value, sub, icon: Icon, trend, accent, className }: StatCardProps) {
  const a = accent ? ACCENT[accent] : null

  return (
    <div
      className={cn(
        'group relative overflow-hidden rounded-2xl border border-border/60 bg-card p-5 shadow-card transition-all duration-200 hover:shadow-card-hover hover:-translate-y-0.5',
        className
      )}
    >
      {/* Top accent bar */}
      {a && <div className={cn('absolute inset-x-0 top-0 h-0.5 rounded-t-2xl', a.bar)} />}

      {/* Subtle blurred orb */}
      {a && <div className={cn('absolute -right-6 -top-6 h-24 w-24 rounded-full opacity-20 blur-xl', a.bar)} />}

      <div className="relative flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
          <p className="mt-1.5 text-3xl font-bold tracking-tight text-foreground tabular-nums">
            {value}
          </p>
          {sub && <p className="mt-0.5 text-xs text-muted-foreground">{sub}</p>}
          {trend && (
            <span
              className={cn(
                'mt-1.5 inline-flex items-center rounded-md px-1.5 py-0.5 text-xs font-medium',
                trend.positive !== false
                  ? 'bg-green-50 text-green-700'
                  : 'bg-red-50 text-red-700'
              )}
            >
              {trend.positive !== false ? '↑' : '↓'} {Math.abs(trend.value)}%
            </span>
          )}
        </div>

        {Icon && a && (
          <div className={cn('shrink-0 rounded-xl p-2.5 ring-1', a.iconBg)}>
            <Icon className={cn('h-5 w-5', a.iconText)} />
          </div>
        )}
      </div>
    </div>
  )
}
