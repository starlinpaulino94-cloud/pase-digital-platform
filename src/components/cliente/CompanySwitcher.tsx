'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { Building2, ChevronDown, Check, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { switchCompany } from '@/modules/cliente/actions'

export interface CompanyOption {
  companyId: string
  name: string
  logoUrl: string | null
  active: boolean
}

export function CompanySwitcher({ companies }: { companies: CompanyOption[] }) {
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()

  if (companies.length < 2) return null

  const current = companies.find((c) => c.active) ?? companies[0]

  function pick(companyId: string) {
    setOpen(false)
    startTransition(() => {
      switchCompany(companyId)
    })
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        disabled={pending}
        className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-medium text-slate-600 transition hover:bg-slate-100 disabled:opacity-50"
      >
        <Building2 className="h-4 w-4 text-sky-500" />
        <span className="hidden sm:block">{current.name}</span>
        <ChevronDown className="h-3.5 w-3.5" />
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setOpen(false)}
          />
          <div className="absolute right-0 z-50 mt-2 w-56 rounded-xl border border-slate-200 bg-white p-1.5 shadow-lg">
            {companies.map((c) => (
              <button
                key={c.companyId}
                type="button"
                onClick={() => pick(c.companyId)}
                className={cn(
                  'flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-left text-sm transition hover:bg-slate-50',
                  c.active ? 'font-semibold text-sky-600' : 'text-slate-700'
                )}
              >
                <span>{c.name}</span>
                {c.active && <Check className="h-4 w-4 shrink-0" />}
              </button>
            ))}
            <div className="mt-1 border-t border-slate-100 pt-1">
              <Link
                href="/cliente/explorar"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-sky-600 transition hover:bg-sky-50"
              >
                <Plus className="h-4 w-4" />
                Unirme a otra empresa
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
