'use client'

import { useActionState, useEffect, useRef, useState } from 'react'
import { Loader2, Upload, CheckCircle2, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import {
  enviarComprobante,
  type ComprobanteState,
} from '@/modules/membresia/actions'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

interface Props {
  membershipId: string
  metodoPagoId?: string | null
}

const initial: ComprobanteState = {}

export function ComprobanteForm({ membershipId, metodoPagoId }: Props) {
  const [state, formAction, pending] = useActionState(enviarComprobante, initial)
  const [uploading, setUploading] = useState(false)
  const [comprobanteUrl, setComprobanteUrl] = useState('')
  const [fileName, setFileName] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)
  const formRef = useRef<HTMLFormElement>(null)

  useEffect(() => {
    if (state.success) {
      toast.success('Comprobante enviado. Esperando validación.')
    }
  }, [state.success])

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
    if (!allowed.includes(file.type)) {
      toast.error('Solo se aceptan imágenes (JPG, PNG, WEBP) o PDF.')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('El archivo no puede superar 5 MB.')
      return
    }

    setUploading(true)
    try {
      const supabase = createClient()
      const ext = file.name.split('.').pop()
      const path = `comprobantes/${membershipId}-${Date.now()}.${ext}`
      const { error } = await supabase.storage
        .from('comprobantes')
        .upload(path, file, { upsert: true })
      if (error) throw error

      const { data } = supabase.storage.from('comprobantes').getPublicUrl(path)
      setComprobanteUrl(data.publicUrl)
      setFileName(file.name)
      toast.success('Archivo cargado correctamente.')
    } catch {
      toast.error('No se pudo cargar el archivo. Intenta de nuevo.')
    } finally {
      setUploading(false)
    }
  }

  if (state.success) {
    return (
      <div className="flex items-center gap-2 rounded-xl bg-green-50 p-4 text-green-700">
        <CheckCircle2 className="h-5 w-5 shrink-0" />
        <p className="text-sm font-medium">
          Comprobante enviado. El equipo lo revisará pronto.
        </p>
      </div>
    )
  }

  return (
    <form ref={formRef} action={formAction} className="space-y-4">
      <input type="hidden" name="membershipId" value={membershipId} />
      <input type="hidden" name="comprobanteUrl" value={comprobanteUrl} />
      {metodoPagoId && (
        <input type="hidden" name="metodoPagoId" value={metodoPagoId} />
      )}

      {state.error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-2">
        <Label>Comprobante de pago *</Label>
        <div
          onClick={() => fileRef.current?.click()}
          className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 p-8 text-slate-500 transition hover:border-sky-400 hover:bg-sky-50"
        >
          {uploading ? (
            <Loader2 className="h-8 w-8 animate-spin text-sky-500" />
          ) : fileName ? (
            <>
              <CheckCircle2 className="h-8 w-8 text-green-500" />
              <p className="text-sm font-medium text-green-700">{fileName}</p>
              <p className="text-xs">Clic para cambiar</p>
            </>
          ) : (
            <>
              <Upload className="h-8 w-8" />
              <p className="text-sm">Sube tu foto o PDF del comprobante</p>
              <p className="text-xs">JPG, PNG, WEBP o PDF · máx 5 MB</p>
            </>
          )}
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,application/pdf"
          className="hidden"
          onChange={handleFile}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="nota">Nota (opcional)</Label>
        <Textarea
          id="nota"
          name="nota"
          placeholder="Ej: Transferencia enviada el 30/06 desde cuenta BHD..."
          rows={2}
        />
      </div>

      <Button
        type="submit"
        disabled={!comprobanteUrl || uploading || pending}
        className="w-full bg-sky-500 hover:bg-sky-400"
      >
        {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Enviar comprobante
      </Button>
    </form>
  )
}
