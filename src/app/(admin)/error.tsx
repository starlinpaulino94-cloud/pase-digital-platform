'use client'

import { PanelError } from '@/components/PanelError'

export default function AdminPanelError(props: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return <PanelError {...props} />
}
