'use client'

import { useEffect, useState } from 'react'
import { X } from 'lucide-react'
import { OnboardingClienteCard } from './OnboardingClienteCard'
import type { OnboardingCliente } from '@/modules/social/queries'

const COOKIE_NAME = 'membego_onboarding_seen'

export function OnboardingClienteFirstVisit({ onboarding }: { onboarding: OnboardingCliente }) {
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    document.cookie = `${COOKIE_NAME}=1; path=/; max-age=${365 * 24 * 60 * 60}; samesite=lax`
  }, [])

  if (!visible || onboarding.completados === onboarding.total) return null

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setVisible(false)}
        className="absolute right-3 top-3 z-10 rounded-full p-1 text-primary transition hover:bg-info/15 hover:text-info"
        aria-label="Cerrar"
      >
        <X className="h-4 w-4" />
      </button>
      <OnboardingClienteCard onboarding={onboarding} />
    </div>
  )
}
