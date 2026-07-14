import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { getUser } from '@/lib/auth'
import { registrarRegistroIniciado } from '@/lib/referidos-attribution'
import { RegisterForm } from '@/components/auth/RegisterForm'
import { CompanyRegistroHeader } from '@/components/auth/CompanyRegistroHeader'
import { AfiliarEmpresaCard } from '@/components/cliente/AfiliarEmpresaCard'

export const dynamic = 'force-dynamic'

export default async function RegistroPage({
  params,
  searchParams,
}: {
  params: Promise<{ companySlug: string }>
  searchParams: Promise<{ ref?: string }>
}) {
  const { companySlug } = await params
  const { ref } = await searchParams

  // select explícito: el registro es la puerta de entrada de clientes y no
  // puede caerse porque el modelo Company tenga una columna más nueva que la
  // BD de producción (p. ej. un deploy cuya migración aún no se aplicó).
  const company = await prisma.company.findUnique({
    where: { slug: companySlug },
    select: {
      id: true,
      slug: true,
      name: true,
      type: true,
      isActive: true,
      logoUrl: true,
      bannerUrl: true,
      colorPrimario: true,
    },
  })

  if (!company || !company.isActive) notFound()

  // Fase E6 · Embudo: landing de registro con atribución (dedup 24 h).
  if (ref) await registrarRegistroIniciado(ref)

  // Si el usuario ya inició sesión como cliente, no debe registrarse de nuevo:
  // se afilia a esta empresa con su cuenta existente (un clic).
  const user = await getUser()
  if (user && user.metadata.role === 'CLIENTE') {
    const yaEsMiembro = await prisma.cliente
      .findUnique({
        where: {
          supabaseId_companyId: {
            supabaseId: user.supabaseId,
            companyId: company.id,
          },
        },
        select: { id: true },
      })
      .then((c) => !!c)
      .catch(() => false)

    return (
      <AfiliarEmpresaCard
        companySlug={company.slug}
        companyName={company.name}
        yaEsMiembro={yaEsMiembro}
      />
    )
  }

  return (
    <>
      <CompanyRegistroHeader
        name={company.name}
        logoUrl={company.logoUrl}
        bannerUrl={company.bannerUrl}
        colorPrimario={company.colorPrimario}
        referido={!!ref}
      />
      <RegisterForm
        companySlug={company.slug}
        companyName={company.name}
        isCarwash={company.type === 'carwash'}
        colorPrimario={company.colorPrimario}
      />
    </>
  )
}
