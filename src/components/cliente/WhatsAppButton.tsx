import Link from 'next/link'
import { MessageCircle } from 'lucide-react'
import { buildWaLink } from '@/lib/soporte'

export function WhatsAppButton({
  codigoPais = '',
  numero,
  mensaje,
  className,
}: {
  codigoPais?: string
  numero: string
  mensaje: string
  className?: string
}) {
  const href = buildWaLink(codigoPais, numero, mensaje)
  return (
    <Link
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={
        className ??
        'inline-flex items-center gap-2 rounded-lg bg-success px-4 py-2 text-sm font-medium text-white hover:bg-success'
      }
    >
      <MessageCircle className="h-4 w-4" />
      Contactar por WhatsApp
    </Link>
  )
}
