'use client'

import { PanelError } from '@/components/PanelError'

export default function OnboardingErrorBoundary(props: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return <PanelError {...props} />
}
