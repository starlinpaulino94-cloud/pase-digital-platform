'use client'

import { PanelError } from '@/components/PanelError'

export default function SuperadminPanelError(props: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return <PanelError {...props} />
}
