import { redirect } from 'next/navigation'

// El módulo de WhatsApp fue reemplazado por "Comunicación y Soporte".
export default function WhatsAppRedirect() {
  redirect('/admin/comunicacion')
}
