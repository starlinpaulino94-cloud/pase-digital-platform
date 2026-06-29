'use client'

import { useActionState } from 'react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { scanQRAction } from '@/modules/validacion-qr/actions'
import type { ActionResult } from '@/types/auth'
import type { ValidationSession } from '@/modules/validacion-qr/types'

const initialState: ActionResult<{ validation: ValidationSession; alreadyScanned: boolean }> = {
  success: false,
}

interface QRScannerFormProps {
  companyId: string
  branchId?: string
  redirectBase: string // e.g. /dashboard/validaciones or /admin/validaciones
}

export function QRScannerForm({ companyId, branchId, redirectBase }: QRScannerFormProps) {
  const router = useRouter()
  const [state, formAction, pending] = useActionState(scanQRAction, initialState)

  useEffect(() => {
    if (state.success && state.data) {
      router.push(`${redirectBase}/${state.data.validation.id}`)
    }
  }, [state, router, redirectBase])

  return (
    <form action={formAction} className="space-y-5">
      {state.error && (
        <Alert variant="destructive">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      )}

      <input type="hidden" name="companyId" value={companyId} />
      {branchId && <input type="hidden" name="branchId" value={branchId} />}

      <div className="space-y-1.5">
        <Label htmlFor="token">Token QR</Label>
        <Input
          id="token"
          name="token"
          placeholder="Escanea el QR o ingresa el token manualmente..."
          autoFocus
          autoComplete="off"
          className="font-mono"
        />
        <p className="text-xs text-muted-foreground">
          Puedes usar un lector de QR físico, el campo se llenará automáticamente.
        </p>
      </div>

      <Button type="submit" disabled={pending} className="w-full">
        {pending ? 'Verificando...' : 'Verificar Pase Digital'}
      </Button>
    </form>
  )
}
