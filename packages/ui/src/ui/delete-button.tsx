'use client'

import { useState, useTransition } from 'react'
import { Loader2, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'

export interface DeleteButtonProps {
  /** Acción de servidor a ejecutar al confirmar. Lanza o devuelve { error } para fallar. */
  action: () => Promise<{ error?: string } | void>
  /** Título del diálogo, ej. `¿Eliminar la promoción "2x1 Martes"?`. */
  title: string
  description?: string
  confirmText?: string
  /** Mensaje del toast de éxito. */
  successMessage?: string
  /** aria-label del botón (obligatorio: el botón es solo un icono por defecto). */
  label: string
  /** Contenido alternativo del botón (por defecto icono de papelera). */
  children?: React.ReactNode
  variant?: 'ghost' | 'outline' | 'destructive'
  size?: 'icon' | 'icon-sm' | 'sm' | 'default'
  disabled?: boolean
  disabledReason?: string
}

/**
 * Botón de borrado estándar del design system: icono + ConfirmDialog peligroso +
 * estado de carga + toast. Reemplaza los `window.confirm()` dispersos.
 */
export function DeleteButton({
  action,
  title,
  description = 'Esta acción no se puede deshacer.',
  confirmText = 'Eliminar',
  successMessage = 'Eliminado correctamente.',
  label,
  children,
  variant = 'ghost',
  size = 'icon',
  disabled = false,
  disabledReason,
}: DeleteButtonProps) {
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()

  function handleConfirm() {
    startTransition(async () => {
      try {
        const result = await action()
        if (result && 'error' in result && result.error) {
          toast.error(result.error)
        } else {
          toast.success(successMessage)
          setOpen(false)
        }
      } catch {
        toast.error('No se pudo completar la operación. Intenta de nuevo.')
      }
    })
  }

  return (
    <>
      <Button
        type="button"
        variant={variant}
        size={size}
        disabled={disabled}
        aria-label={label}
        title={disabled && disabledReason ? disabledReason : label}
        onClick={() => {
          if (disabled) return
          setOpen(true)
        }}
        className={variant === 'ghost' ? 'text-muted-foreground hover:text-destructive' : undefined}
      >
        {children ?? (pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />)}
      </Button>
      <ConfirmDialog
        open={open}
        title={title}
        description={description}
        confirmText={confirmText}
        isDangerous
        isLoading={pending}
        onConfirm={handleConfirm}
        onCancel={() => setOpen(false)}
      />
    </>
  )
}
