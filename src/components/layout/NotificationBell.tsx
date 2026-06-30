'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Bell, CheckCheck, ExternalLink } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  getNotificaciones,
  marcarTodasLeidas,
  marcarLeida,
} from '@/modules/notificaciones/actions'
import type { Notificacion } from '@prisma/client'

const TIPO_ICON: Record<string, string> = {
  PAGO_APROBADO: '✅',
  PAGO_RECHAZADO: '❌',
  NUEVO_COMPROBANTE: '📄',
  MEMBRESIA_POR_VENCER: '⚠️',
  MEMBRESIA_ACTIVADA: '🎉',
  PROMOCION_NUEVA: '🎁',
  SISTEMA: '🔔',
}

function timeAgo(date: Date) {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000)
  if (seconds < 60) return 'ahora'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h`
  return new Intl.DateTimeFormat('es-DO', { dateStyle: 'short' }).format(new Date(date))
}

export function NotificationBell({ initialCount }: { initialCount: number }) {
  const [open, setOpen] = useState(false)
  const [count, setCount] = useState(initialCount)
  const [notifs, setNotifs] = useState<Notificacion[] | null>(null)
  const [, startTransition] = useTransition()
  const router = useRouter()

  function handleOpen() {
    if (!open && notifs === null) {
      startTransition(async () => {
        const data = await getNotificaciones()
        setNotifs(data)
        setCount(data.filter((n) => !n.leida).length)
      })
    }
    setOpen((o) => !o)
  }

  function handleMarkAll() {
    startTransition(async () => {
      await marcarTodasLeidas()
      setNotifs((prev) => prev?.map((n) => ({ ...n, leida: true })) ?? null)
      setCount(0)
    })
  }

  function handleClick(notif: Notificacion) {
    if (!notif.leida) {
      startTransition(async () => {
        await marcarLeida(notif.id)
        setNotifs((prev) =>
          prev?.map((n) => (n.id === notif.id ? { ...n, leida: true } : n)) ?? null
        )
        setCount((c) => Math.max(0, c - 1))
      })
    }
    setOpen(false)
    if (notif.href) router.push(notif.href)
  }

  return (
    <div className="relative">
      <button
        onClick={handleOpen}
        className="relative flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
        aria-label="Notificaciones"
      >
        <Bell className="h-4 w-4" />
        {count > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
            {count > 9 ? '9+' : count}
          </span>
        )}
      </button>

      {open && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setOpen(false)}
          />

          {/* Panel */}
          <div className="absolute right-0 top-11 z-50 w-80 rounded-xl border border-border/60 bg-white shadow-lg sm:w-96">
            <div className="flex items-center justify-between border-b border-border/40 px-4 py-3">
              <p className="text-sm font-semibold text-slate-900">Notificaciones</p>
              {count > 0 && (
                <button
                  onClick={handleMarkAll}
                  className="flex items-center gap-1 text-xs text-sky-600 hover:underline"
                >
                  <CheckCheck className="h-3 w-3" />
                  Marcar todas leídas
                </button>
              )}
            </div>

            <div className="max-h-[26rem] overflow-y-auto">
              {notifs === null ? (
                <div className="py-8 text-center text-sm text-slate-400">Cargando…</div>
              ) : notifs.length === 0 ? (
                <div className="py-8 text-center text-sm text-slate-400">
                  No tienes notificaciones.
                </div>
              ) : (
                <ul>
                  {notifs.map((n) => (
                    <li key={n.id}>
                      <button
                        onClick={() => handleClick(n)}
                        className={cn(
                          'w-full px-4 py-3 text-left transition hover:bg-slate-50',
                          !n.leida && 'bg-sky-50/60'
                        )}
                      >
                        <div className="flex items-start gap-3">
                          <span className="mt-0.5 text-base leading-none">
                            {TIPO_ICON[n.tipo] ?? '🔔'}
                          </span>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-2">
                              <p className={cn('truncate text-sm', !n.leida ? 'font-semibold text-slate-900' : 'font-medium text-slate-700')}>
                                {n.titulo}
                              </p>
                              <span className="shrink-0 text-xs text-slate-400">
                                {timeAgo(n.createdAt)}
                              </span>
                            </div>
                            <p className="mt-0.5 line-clamp-2 text-xs text-slate-500">
                              {n.mensaje}
                            </p>
                            {n.href && (
                              <span className="mt-1 flex items-center gap-1 text-xs text-sky-600">
                                <ExternalLink className="h-3 w-3" /> Ver detalle
                              </span>
                            )}
                          </div>
                          {!n.leida && (
                            <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-sky-500" />
                          )}
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
