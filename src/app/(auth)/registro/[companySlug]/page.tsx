import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { getUser } from '@/lib/auth'
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

  const company = await prisma.company.findUnique({
    where: { slug: companySlug },
  })

  if (!company || !company.isActive) notFound()

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
