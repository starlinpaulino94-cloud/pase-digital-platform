'use client'

import { AlertCircle } from 'lucide-react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

export interface ConfirmDialogProps {
  open: boolean
  title: string
  description?: string
  onConfirm: () => void | Promise<void>
  onCancel?: () => void
  confirmText?: string
  cancelText?: string
  isDangerous?: boolean
  isLoading?: boolean
}

export function ConfirmDialog({
  open,
  title,
  description,
  onConfirm,
  onCancel,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  isDangerous = false,
  isLoading = false,
}: ConfirmDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={(isOpen) => !isOpen && onCancel?.()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="flex items-start gap-3">
            {isDangerous && (
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-destructive/10">
                <AlertCircle className="h-4 w-4 text-destructive" />
              </div>
            )}
            <div className="flex-1">
              <AlertDialogTitle className={isDangerous ? 'text-destructive' : ''}>
                {title}
              </AlertDialogTitle>
              {description && <AlertDialogDescription>{description}</AlertDialogDescription>}
            </div>
          </div>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>{cancelText}</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={isLoading}
            className={isDangerous ? 'bg-destructive text-white hover:bg-destructive/90' : ''}
          >
            {isLoading ? 'Procesando...' : confirmText}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
