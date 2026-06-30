import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { RegisterForm } from '@/components/auth/RegisterForm'

export const dynamic = 'force-dynamic'

export default async function RegistroPage({
  params,
}: {
  params: Promise<{ companySlug: string }>
}) {
  const { companySlug } = await params

  const company = await prisma.company.findUnique({
    where: { slug: companySlug },
    include: {
      plans: {
        where: { activo: true },
        orderBy: { precio: 'asc' },
      },
    },
  })

  if (!company || !company.isActive) notFound()

  return (
    <RegisterForm
      companySlug={company.slug}
      companyName={company.name}
      isCarwash={company.type === 'carwash'}
      plans={company.plans.map((p) => ({
        id: p.id,
        nombre: p.nombre,
        precio: Number(p.precio),
        lavadosIncluidos: p.lavadosIncluidos,
        esIlimitado: p.esIlimitado,
        descripcion: p.descripcion ?? null,
        beneficios: p.beneficios,
        vigenciaDias: p.vigenciaDias,
      }))}
    />
  )
}
