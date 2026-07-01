'use client'

import { PanelError } from '@/components/PanelError'

export default function PanelErrorBoundary(props: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return <PanelError {...props} />
}
