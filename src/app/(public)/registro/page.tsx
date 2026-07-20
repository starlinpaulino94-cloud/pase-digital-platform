import { redirect } from 'next/navigation'
import { getEmpresaPrincipal } from '@/modules/marketplace/marcaUnica'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Crear cuenta - MembeGo',
  description: 'Crea tu cuenta y activa tu membresía digital en minutos',
}

/**
 * Modo MARCA ÚNICA: el registro entra DIRECTO a la empresa principal, sin
 * elegir empresa ni categorías. El registro por empresa (/registro/[slug])
 * sigue siendo la maquinaria real, así que cuando la plataforma tenga más
 * empresas solo hay que volver a mostrar el selector.
 */
export default async function RegistroPage() {
  const empresa = await getEmpresaPrincipal()
  if (empresa) redirect(`/registro/${empresa.slug}`)
  // Sin empresa publicada aún: cuenta general (sin membresía).
  redirect('/registro/cuenta')
}
