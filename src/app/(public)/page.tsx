import Link from 'next/link'
import { ArrowRight, Building2 } from 'lucide-react'
import { HeroSection } from '@/components/public/HeroSection'
import { ValueProps } from '@/components/public/ValueProps'
import { HowItWorks } from '@/components/public/HowItWorks'
import { ForBusinessCTA } from '@/components/public/ForBusinessCTA'
import { CategoriesSection } from '@/components/public/CategoriesSection'
import { CompanyCard } from '@/components/public/CompanyCard'
import { PromotionCard } from '@/components/public/PromotionCard'
import {
  getFeaturedPromotions,
  getFeaturedCompanies,
  getRecentCompanies,
  getCategoriesPublic,
  getPlatformStats,
} from '@/modules/marketplace/queries'

export const revalidate = 600

export default async function HomePage() {
  const [stats, promotions, featured, categories, recientes] =
    await Promise.all([
      getPlatformStats(),
      getFeaturedPromotions(6),
      getFeaturedCompanies(4),
      getCategoriesPublic(),
      getRecentCompanies(8),
    ])

  // Si no hay destacadas, mostramos las más recientes para no dejar vacío.
  const empresas = featured.length > 0 ? featured : recientes.slice(0, 4)

  // "Recién llegadas": las más nuevas que no estén ya en destacadas.
  const featuredIds = new Set(featured.map((c) => c.id))
  const nuevas = recientes.filter((c) => !featuredIds.has(c.id)).slice(0, 4)

  return (
    <>
      <HeroSection stats={stats} />
      <ValueProps />

      {/* Empresas destacadas */}
      {empresas.length > 0 && (
        <section className="bg-muted py-16 sm:py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-8 flex items-end justify-between gap-4">
              <div>
                <h2 className="text-3xl font-bold tracking-tight text-foreground">
                  Empresas destacadas
                </h2>
                <p className="mt-2 text-muted-foreground">
                  Descubre negocios afiliados y sus membresías.
                </p>
              </div>
              <Link
                href="/empresas"
                className="hidden items-center gap-1 text-sm font-semibold text-primary hover:text-info sm:inline-flex"
              >
                Ver todas <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {empresas.map((c) => (
                <CompanyCard key={c.id} company={c} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Explora por categoría */}
      <CategoriesSection categories={categories} />

      {/* Promociones destacadas */}
      {promotions.length > 0 && (
        <section className="bg-muted py-16 sm:py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-8 flex items-end justify-between gap-4">
              <div>
                <h2 className="text-3xl font-bold tracking-tight text-foreground">
                  Promociones del momento
                </h2>
                <p className="mt-2 text-muted-foreground">
                  Ofertas y beneficios vigentes que no querrás perderte.
                </p>
              </div>
              <Link
                href="/promociones"
                className="hidden items-center gap-1 text-sm font-semibold text-primary hover:text-info sm:inline-flex"
              >
                Ver todas <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {promotions.map((p) => (
                <PromotionCard key={p.id} promotion={p} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Recién llegadas */}
      {nuevas.length > 0 && (
        <section className="bg-card py-16 sm:py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-8 flex items-end justify-between gap-4">
              <div>
                <h2 className="text-3xl font-bold tracking-tight text-foreground">
                  Recién llegadas
                </h2>
                <p className="mt-2 text-muted-foreground">
                  Las empresas más nuevas en MembeGo.
                </p>
              </div>
              <Link
                href="/empresas"
                className="hidden items-center gap-1 text-sm font-semibold text-primary hover:text-info sm:inline-flex"
              >
                Ver todas <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {nuevas.map((c) => (
                <CompanyCard key={c.id} company={c} />
              ))}
            </div>
          </div>
        </section>
      )}

      <HowItWorks />
      <ForBusinessCTA />

      {/* CTA final */}
      <section className="bg-gradient-to-br from-blue-700 to-indigo-800 py-16 text-center text-white">
        <div className="mx-auto max-w-2xl px-4">
          <Building2 className="mx-auto h-10 w-10 text-primary" />
          <h2 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
            Empieza hoy con MembeGo
          </h2>
          <p className="mt-3 text-white/80">
            Explora las empresas disponibles y activa tu primera membresía digital
            en minutos.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link
              href="/empresas"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-card px-6 py-3 font-semibold text-info transition hover:bg-info/10"
            >
              Explorar empresas <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center justify-center rounded-xl border border-white/30 bg-white/10 px-6 py-3 font-semibold text-white backdrop-blur transition hover:bg-white/20"
            >
              Ya tengo cuenta
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}
