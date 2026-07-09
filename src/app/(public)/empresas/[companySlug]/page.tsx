import Link from 'next/link'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import {
  ArrowLeft,
  ArrowRight,
  MapPin,
  Mail,
  Phone,
  MessageCircle,
  Globe,
  Instagram,
  Facebook,
  Music2,
  Star,
  Gift,
  Users,
  Check,
  Crown,
  Sparkles,
  QrCode,
  BadgeCheck,
  CalendarDays,
  Newspaper,
  Clock,
} from 'lucide-react'
import { PromotionGrid } from '@/components/public/PromotionGrid'
import { FollowButton } from '@/components/public/FollowButton'
import { ShareButton } from '@/components/public/ShareButton'
import {
  getCompanyPublic,
  getCompanyStats,
  getCompanyPlanesPublic,
  getCompanyPostsPublic,
  getPromotionsPublic,
} from '@/modules/marketplace/queries'
import { getRegionalPrefs } from '@/modules/empresas/regional'
import { formatMoney } from '@/lib/format'

interface CompanyDetailPageProps {
  params: Promise<{ companySlug: string }>
}

export const revalidate = 3600

const TIPO_LABEL: Record<string, string> = {
  carwash: 'Car Wash',
  restaurante: 'Restaurante',
  gimnasio: 'Gimnasio',
  salon: 'Salón',
}

export default async function CompanyDetailPage({
  params,
}: CompanyDetailPageProps) {
  const { companySlug } = await params

  const company = await getCompanyPublic(companySlug)
  if (!company) notFound()

  const [stats, planes, promotions, posts, prefs] = await Promise.all([
    getCompanyStats(companySlug),
    getCompanyPlanesPublic(company.id),
    getPromotionsPublic({ company: companySlug, limit: 12 }),
    getCompanyPostsPublic(company.id),
    getRegionalPrefs(company.id),
  ])

  // Navegación por secciones (solo las que tienen contenido).
  const seccionesNav = [
    planes.length > 0 && { id: 'membresias', label: 'Membresías' },
    promotions.length > 0 && { id: 'promociones', label: 'Promociones' },
    posts.beneficios.length > 0 && { id: 'beneficios', label: 'Beneficios' },
    posts.eventos.length > 0 && { id: 'eventos', label: 'Eventos' },
    posts.noticias.length > 0 && { id: 'noticias', label: 'Noticias' },
    company.galleryImages.length > 0 && { id: 'galeria', label: 'Galería' },
    { id: 'informacion', label: 'Información' },
  ].filter(Boolean) as { id: string; label: string }[]

  const initials = company.name.slice(0, 2).toUpperCase()
  const location = [company.ciudad, company.provincia, company.pais]
    .filter(Boolean)
    .join(', ')

  const contactLinks = [
    company.email && { icon: Mail, label: company.email, href: `mailto:${company.email}` },
    company.telefono && { icon: Phone, label: company.telefono, href: `tel:${company.telefono}` },
    company.whatsapp && {
      icon: MessageCircle,
      label: 'WhatsApp',
      href: `https://wa.me/${company.whatsapp.replace(/\D/g, '')}`,
    },
    company.website && { icon: Globe, label: 'Sitio web', href: company.website },
  ].filter(Boolean) as { icon: typeof Mail; label: string; href: string }[]

  const socialLinks = [
    company.instagram && { icon: Instagram, label: 'Instagram', href: company.instagram },
    company.facebook && { icon: Facebook, label: 'Facebook', href: company.facebook },
    company.tiktok && { icon: Music2, label: 'TikTok', href: company.tiktok },
  ].filter(Boolean) as { icon: typeof Mail; label: string; href: string }[]

  return (
    <div className="min-h-screen bg-white">
      {/* Hero / Banner */}
      <section className="relative h-56 w-full overflow-hidden bg-gradient-to-br from-blue-800 via-blue-700 to-indigo-900 sm:h-72">
        {company.bannerUrl ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={company.bannerUrl}
              alt=""
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/70 via-slate-900/20 to-transparent" />
          </>
        ) : (
          <>
            <div className="absolute inset-0 bg-grid-light mask-fade" />
            <div className="absolute -top-10 right-16 h-56 w-56 rounded-full bg-sky-400/25 blur-3xl" />
          </>
        )}
        <div className="absolute left-0 top-0 p-4 sm:p-6">
          <Link
            href="/empresas"
            className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/15 px-3.5 py-1.5 text-sm font-medium text-white backdrop-blur transition-colors hover:bg-white/25"
          >
            <ArrowLeft className="h-4 w-4" /> Empresas
          </Link>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        {/* Header card */}
        <div className="relative -mt-16 animate-slide-up rounded-3xl border border-slate-200/80 bg-white p-6 shadow-premium-lg sm:p-8">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
            {/* Logo */}
            <div className="-mt-16 shrink-0 sm:-mt-20">
              {company.logoUrl ? (
                <div className="relative h-28 w-28 overflow-hidden rounded-2xl border-4 border-white bg-white shadow-md sm:h-32 sm:w-32">
                  <Image src={company.logoUrl} alt={company.name} fill className="object-cover" />
                </div>
              ) : (
                <div className="flex h-28 w-28 items-center justify-center rounded-2xl border-4 border-white bg-gradient-to-br from-blue-500 to-indigo-600 text-3xl font-bold text-white shadow-md sm:h-32 sm:w-32">
                  {initials}
                </div>
              )}
            </div>

            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-700">
                  {TIPO_LABEL[company.type] ?? company.type}
                </span>
                {company.isFeatured && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-700">
                    <Star className="h-3 w-3 fill-amber-500 text-amber-500" /> Destacada
                  </span>
                )}
              </div>

              <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
                {company.name}
              </h1>

              {(location || company.horario) && (
                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-500">
                  {location && (
                    <span className="inline-flex items-center gap-1.5">
                      <MapPin className="h-4 w-4" /> {location}
                    </span>
                  )}
                  {company.horario && (
                    <span className="inline-flex items-center gap-1.5">
                      <Clock className="h-4 w-4" /> {company.horario}
                    </span>
                  )}
                </div>
              )}

              {company.description && (
                <p className="mt-3 max-w-2xl text-slate-600">{company.description}</p>
              )}

              {/* Chips de datos reales (solo si aportan) */}
              <div className="mt-4 flex flex-wrap gap-2">
                {stats && stats.activePromotions > 0 && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 px-3 py-1 text-sm font-medium text-rose-700">
                    <Gift className="h-4 w-4" /> {stats.activePromotions} promociones
                  </span>
                )}
                {stats && stats.totalMembers > 0 && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-sm font-medium text-blue-700">
                    <Users className="h-4 w-4" /> {stats.totalMembers} miembros
                  </span>
                )}
                {stats && stats.averageRating != null && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-sm font-medium text-amber-700">
                    <Star className="h-4 w-4 fill-amber-500 text-amber-500" />
                    {stats.averageRating.toFixed(1)}
                    <span className="text-amber-600/70">({stats.totalRatings})</span>
                  </span>
                )}
              </div>
            </div>

            {/* CTA */}
            <div className="flex w-full shrink-0 flex-col gap-2 sm:w-auto">
              <Link
                href={`/registro/${company.slug}`}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white shadow-sm transition hover:bg-blue-700 sm:w-auto"
              >
                Quiero una membresía <ArrowRight className="h-4 w-4" />
              </Link>
              <FollowButton
                companyId={company.id}
                redirectTo={`/empresas/${company.slug}`}
              />
              <ShareButton
                title={company.name}
                text={`Descubre ${company.name} en MembeGo: membresías, promociones y beneficios.`}
                path={`/empresas/${company.slug}`}
              />
            </div>
          </div>

          {/* Contacto y redes */}
          {(contactLinks.length > 0 || socialLinks.length > 0) && (
            <div className="mt-6 flex flex-wrap gap-x-5 gap-y-2 border-t border-slate-100 pt-5">
              {contactLinks.map((c) => (
                <a
                  key={c.label}
                  href={c.href}
                  target={c.href.startsWith('http') ? '_blank' : undefined}
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm text-slate-600 transition hover:text-blue-600"
                >
                  <c.icon className="h-4 w-4" /> {c.label}
                </a>
              ))}
              {socialLinks.map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm text-slate-600 transition hover:text-blue-600"
                >
                  <s.icon className="h-4 w-4" /> {s.label}
                </a>
              ))}
            </div>
          )}
        </div>

        {/* Navegación de secciones (mini web) */}
        {seccionesNav.length > 1 && (
          <nav className="sticky top-16 z-30 mt-6 -mx-4 overflow-x-auto border-b border-slate-200 bg-white/90 px-4 backdrop-blur sm:mx-0 sm:rounded-full sm:border sm:px-2">
            <div className="flex gap-1 py-2">
              {seccionesNav.map((s) => (
                <a
                  key={s.id}
                  href={`#${s.id}`}
                  className="whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-medium text-slate-600 transition hover:bg-blue-50 hover:text-blue-700"
                >
                  {s.label}
                </a>
              ))}
            </div>
          </nav>
        )}

        {/* Planes */}
        {planes.length > 0 && (
          <section id="membresias" className="mt-14 scroll-mt-32">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                Planes de membresía
              </h2>
              <p className="mt-2 text-slate-600">
                Elige el plan que mejor se adapte a ti y recibe tu membresía
                digital con QR.
              </p>
            </div>

            <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {planes.map((plan, i) => {
                const featured = planes.length > 1 && i === Math.floor(planes.length / 2)
                return (
                  <div
                    key={plan.id}
                    className={`card-interactive relative flex flex-col rounded-3xl border bg-white p-6 ${
                      featured
                        ? 'border-blue-300 shadow-premium ring-1 ring-blue-200'
                        : 'border-slate-200/80 shadow-card'
                    }`}
                  >
                    {featured && (
                      <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-blue-600 px-3.5 py-1 text-xs font-semibold text-white shadow-glow">
                        Más popular
                      </span>
                    )}

                    <div className="flex items-center gap-2">
                      {plan.esIlimitado ? (
                        <Crown className="h-5 w-5 text-amber-500" />
                      ) : (
                        <Sparkles className="h-5 w-5 text-sky-500" />
                      )}
                      <h3 className="font-semibold text-slate-900">{plan.nombre}</h3>
                      {plan.esIlimitado && (
                        <span className="ml-auto rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700">
                          Ilimitado
                        </span>
                      )}
                    </div>

                    <p className="mt-4 text-3xl font-extrabold text-slate-900">
                      {formatMoney(plan.precio, prefs)}
                      <span className="text-base font-normal text-slate-400">/mes</span>
                    </p>
                    {plan.descripcion && (
                      <p className="mt-2 text-sm text-slate-500">{plan.descripcion}</p>
                    )}

                    <div className="mt-4 rounded-lg bg-slate-50 p-3 text-sm">
                      <p className="font-medium text-slate-700">
                        {plan.esIlimitado
                          ? 'Usos ilimitados'
                          : `${plan.lavadosIncluidos} usos incluidos`}
                      </p>
                      <p className="text-xs text-slate-500">
                        Vigencia: {plan.vigenciaDias} días
                      </p>
                    </div>

                    {plan.beneficios.length > 0 && (
                      <ul className="mt-4 space-y-2">
                        {plan.beneficios.map((b) => (
                          <li key={b} className="flex items-start gap-2 text-sm text-slate-600">
                            <Check className="mt-0.5 h-4 w-4 shrink-0 text-green-500" />
                            {b}
                          </li>
                        ))}
                      </ul>
                    )}

                    <Link
                      href={`/registro/${company.slug}`}
                      className={`mt-6 inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 font-semibold transition ${
                        featured
                          ? 'bg-blue-600 text-white hover:bg-blue-700'
                          : 'bg-slate-100 text-slate-800 hover:bg-slate-200'
                      }`}
                    >
                      Elegir plan <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                )
              })}
            </div>
          </section>
        )}

        {/* Promociones */}
        {promotions && promotions.length > 0 && (
          <section id="promociones" className="mt-14 scroll-mt-32">
            <h2 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              Promociones vigentes
            </h2>
            <p className="mt-2 text-slate-600">
              Beneficios exclusivos disponibles ahora mismo.
            </p>
            <div className="mt-6">
              <PromotionGrid promotions={promotions} isLoading={false} variant="default" />
            </div>
          </section>
        )}

        {/* Beneficios para miembros */}
        {posts.beneficios.length > 0 && (
          <section id="beneficios" className="mt-14 scroll-mt-32">
            <h2 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              Beneficios para miembros
            </h2>
            <p className="mt-2 text-slate-600">
              Ventajas permanentes por ser miembro de {company.name}.
            </p>
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {posts.beneficios.map((b) => (
                <div
                  key={b.id}
                  className="rounded-2xl border border-emerald-100 bg-emerald-50/50 p-5"
                >
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
                    <BadgeCheck className="h-3.5 w-3.5" /> Beneficio
                  </span>
                  <h3 className="mt-3 font-semibold text-slate-900">{b.titulo}</h3>
                  <p className="mt-1 text-sm text-slate-600">{b.contenido}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Eventos */}
        {posts.eventos.length > 0 && (
          <section id="eventos" className="mt-14 scroll-mt-32">
            <h2 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              Próximos eventos
            </h2>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {posts.eventos.map((e) => (
                <div
                  key={e.id}
                  className="flex gap-4 rounded-2xl border border-slate-200 bg-white p-5"
                >
                  <div className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-xl bg-violet-50 text-violet-700">
                    <span className="text-lg font-bold leading-none">
                      {e.fechaEvento ? new Date(e.fechaEvento).getDate() : '—'}
                    </span>
                    <span className="text-[10px] font-semibold uppercase">
                      {e.fechaEvento
                        ? new Intl.DateTimeFormat('es-DO', { month: 'short' }).format(
                            new Date(e.fechaEvento)
                          )
                        : ''}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900">{e.titulo}</h3>
                    <p className="mt-1 line-clamp-2 text-sm text-slate-600">
                      {e.contenido}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
                      {e.fechaEvento && (
                        <span className="inline-flex items-center gap-1">
                          <CalendarDays className="h-3.5 w-3.5" />
                          {new Intl.DateTimeFormat('es-DO', {
                            dateStyle: 'medium',
                            timeStyle: 'short',
                          }).format(new Date(e.fechaEvento))}
                        </span>
                      )}
                      {e.lugar && (
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5" /> {e.lugar}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Noticias */}
        {posts.noticias.length > 0 && (
          <section id="noticias" className="mt-14 scroll-mt-32">
            <h2 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              Noticias
            </h2>
            <div className="mt-6 space-y-4">
              {posts.noticias.map((n) => (
                <article
                  key={n.id}
                  className="rounded-2xl border border-slate-200 bg-white p-5"
                >
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <Newspaper className="h-3.5 w-3.5" />
                    {new Intl.DateTimeFormat('es-DO', { dateStyle: 'long' }).format(
                      new Date(n.publicadaEn)
                    )}
                  </div>
                  <h3 className="mt-2 font-semibold text-slate-900">{n.titulo}</h3>
                  <p className="mt-1 text-sm text-slate-600">{n.contenido}</p>
                </article>
              ))}
            </div>
          </section>
        )}

        {/* Galería */}
        {company.galleryImages && company.galleryImages.length > 0 && (
          <section id="galeria" className="mt-14 scroll-mt-32">
            <h2 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              Galería
            </h2>
            <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {company.galleryImages.map((image, idx) => (
                <div
                  key={idx}
                  className="relative aspect-square w-full overflow-hidden rounded-xl bg-slate-100"
                >
                  <Image
                    src={image}
                    alt={`${company.name} - ${idx + 1}`}
                    fill
                    className="object-cover transition-transform duration-300 hover:scale-105"
                  />
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Información */}
        <section id="informacion" className="mt-14 scroll-mt-32">
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Información
          </h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {company.horario && (
              <div className="rounded-2xl border border-slate-200 bg-white p-5">
                <h3 className="flex items-center gap-2 font-semibold text-slate-900">
                  <Clock className="h-4 w-4 text-blue-600" /> Horario de atención
                </h3>
                <p className="mt-2 text-sm text-slate-600">{company.horario}</p>
              </div>
            )}
            {location && (
              <div className="rounded-2xl border border-slate-200 bg-white p-5">
                <h3 className="flex items-center gap-2 font-semibold text-slate-900">
                  <MapPin className="h-4 w-4 text-blue-600" /> Ubicación
                </h3>
                <p className="mt-2 text-sm text-slate-600">{location}</p>
                {company.googleMapsUrl && (
                  <a
                    href={company.googleMapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-blue-600 transition hover:bg-slate-50"
                  >
                    Ver en Google Maps
                  </a>
                )}
              </div>
            )}
            {contactLinks.length > 0 && (
              <div className="rounded-2xl border border-slate-200 bg-white p-5">
                <h3 className="flex items-center gap-2 font-semibold text-slate-900">
                  <Phone className="h-4 w-4 text-blue-600" /> Contacto
                </h3>
                <div className="mt-2 space-y-2">
                  {contactLinks.map((c) => (
                    <a
                      key={c.label}
                      href={c.href}
                      target={c.href.startsWith('http') ? '_blank' : undefined}
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm text-slate-600 transition hover:text-blue-600"
                    >
                      <c.icon className="h-4 w-4" /> {c.label}
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>
      </div>

      {/* CTA final */}
      <section className="mt-16 bg-gradient-to-br from-blue-700 to-indigo-800 py-14 text-center text-white">
        <div className="mx-auto max-w-2xl px-4">
          <QrCode className="mx-auto h-10 w-10 text-sky-200" />
          <h2 className="mt-4 text-2xl font-bold tracking-tight sm:text-3xl">
            Activa tu membresía en {company.name}
          </h2>
          <p className="mt-3 text-sky-100">
            Regístrate, elige tu plan y recibe tu membresía digital con QR en
            minutos.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link
              href={`/registro/${company.slug}`}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-6 py-3 font-semibold text-blue-700 transition hover:bg-sky-50"
            >
              Registrarme <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/empresas"
              className="inline-flex items-center justify-center rounded-xl border border-white/30 bg-white/10 px-6 py-3 font-semibold text-white backdrop-blur transition hover:bg-white/20"
            >
              Ver otras empresas
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
