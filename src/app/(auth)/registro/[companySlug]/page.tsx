import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { RegisterForm } from '@/components/auth/RegisterForm'

export const dynamic = 'force-dynamic'

const FALLBACK_COMPANIES: Record<string, { id: string; name: string; slug: string; type: string }> = {
  'cartown-wash': { id: 'company-cartown', name: 'CARTOWN Wash & Detailing', slug: 'cartown-wash', type: 'carwash' },
  'tonis':        { id: 'company-tonis',   name: "Toni's Restaurante",        slug: 'tonis',        type: 'restaurante' },
}

export default async function RegistroPage({
  params,
}: {
  params: Promise<{ companySlug: string }>
}) {
  const { companySlug } = await params

  let company: { id: string; name: string; slug: string; type: string } | null = null
  try {
    company = await prisma.company.findUnique({ where: { slug: companySlug } })
  } catch (err) {
    console.error('[registro] DB error:', err)
  }

  // Fallback to hardcoded data if DB fails or company not seeded yet
  if (!company) company = FALLBACK_COMPANIES[companySlug] ?? null

  if (!company) notFound()

  return (
    <RegisterForm
      companySlug={company.slug}
      companyName={company.name}
      isCarwash={company.type === 'carwash'}
    />
  )
}
