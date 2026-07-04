import Link from 'next/link'
import {
  Car,
  UtensilsCrossed,
  Check,
  Sparkles,
  QrCode,
  Users,
  Store,
  Ticket,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { SEED_COMPANIES } from '@/lib/data/companies'
import { prisma } from '@/lib/prisma'

function formatPrice(n: number) {
  return new Intl.NumberFormat('es-DO').format(n)
}

function formatNumber(n: number) {
  return new Intl.NumberFormat('es-DO').format(n)
}

async function getStats() {
  try {
    const [empresas, clientes, membresias, visitas] = await Promise.all([
      prisma.company.count({ where: { isActive: true } }),
      prisma.cliente.count(),
      prisma.membership.count({ where: { estado: 'ACTIVA' } }),
      prisma.visit.count(),
    ])
    return { empresas, clientes, membresias, visitas }
  } catch {
    return { empresas: 0, clientes: 0, membresias: 0, visitas: 0 }
  }
}

/** Forma normalizada usada por la sección de empresas/planes de la landing. */
interface LandingCompany {
  slug: string
  name: string
  description: string
  type: string
  plans: {
    nombre: string
    precio: number
    esIlimitado: boolean
    descripcion: string
    beneficios: string[]
  }[]
}

/**
 * Obtiene las empresas y planes reales desde la BD para que los enlaces de
 * registro usen el slug real (evita 404 en /registro/[slug]). Si la BD está
 * vacía o no disponible, usa SEED_COMPANIES como respaldo visual.
 */
async function getCompanies(): Promise<LandingCompany[]> {
  try {
    const companies = await prisma.company.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
      include: {
        plans: {
          where: { activo: true },
          orderBy: { precio: 'asc' },
        },
      },
    })

    if (companies.length > 0) {
      return companies.map((c) => ({
        slug: c.slug,
        name: c.name,
        description: c.description ?? '',
        type: c.type,
        plans: c.plans.map((p) => ({
          nombre: p.nombre,
          precio: Number(p.precio),
          esIlimitado: p.esIlimitado,
          descripcion: p.descripcion ?? '',
          beneficios: p.beneficios,
        })),
      }))
    }
  } catch (err) {
    console.error('[landing] DB error al cargar empresas:', err)
  }

  // Respaldo: datos estáticos (BD vacía o sin conexión).
  return SEED_COMPANIES.map((c) => ({
    slug: c.slug,
    name: c.name,
    description: c.description,
    type: c.type,
    plans: c.plans.map((p) => ({
      nombre: p.nombre,
      precio: p.precio,
      esIlimitado: p.esIlimitado,
      descripcion: p.descripcion,
      beneficios: p.beneficios,
    })),
  }))
}

export default async function LandingPage() {
  const [stats, companies] = await Promise.all([getStats(), getCompanies()])

  return (
    <main className="min-h-screen bg-[#0f172a] text-white">
      {/* Nav */}
      <header className="sticky top-0 z-30 border-b border-white/10 bg-[#0f172a]/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-2 text-xl font-bold">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-500">
              <QrCode className="h-5 w-5 text-white" />
            </span>
            MembreGo
          </Link>
          <nav className="flex items-center gap-2">
            <Link href="/empresas">
              <Button
                variant="ghost"
                size="sm"
                className="text-slate-300 hover:bg-white/10 hover:text-white"
              >
                Empresas
              </Button>
            </Link>
            <Link href="/login">
              <Button
                size="sm"
                className="bg-sky-500 hover:bg-sky-400"
              >
                Iniciar sesión
              </Button>
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-20"
          style={{
            background:
              'radial-gradient(circle at 30% 20%, #0ea5e9 0%, transparent 50%), radial-gradient(circle at 70% 60%, #6366f1 0%, transparent 50%)',
          }}
        />
        <div className="relative mx-auto max-w-4xl px-6 py-24 text-center">
          <Badge className="mb-6 border-sky-400/30 bg-sky-500/10 text-sky-300 hover:bg-sky-500/10">
            <Sparkles className="mr-1.5 h-3 w-3" />
            Membresías digitales exclusivas
          </Badge>
          <h1 className="mx-auto max-w-3xl text-4xl font-extrabold leading-tight tracking-tight md:text-6xl">
            Tu membresía abre la puerta a{' '}
            <span className="bg-gradient-to-r from-sky-400 to-indigo-400 bg-clip-text text-transparent">
              promociones privadas
            </span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-300">
            Regístrate gratuitamente, activa tu Pase Digital y comienza a
            disfrutar promociones exclusivas en nuestros establecimientos
            participantes.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link href="/empresas">
              <Button
                size="lg"
                className="w-full bg-sky-500 hover:bg-sky-400 sm:w-auto"
              >
                Quiero mi membresía MembreGo
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link href="/login">
              <Button
                size="lg"
                variant="outline"
                className="w-full border-white/20 bg-transparent text-white hover:bg-white/10 sm:w-auto"
              >
                Ya soy miembro
              </Button>
            </Link>
          </div>
          <p className="mt-4 text-xs text-slate-500">
            Algunas promociones solo están disponibles para clientes registrados.
          </p>
        </div>
      </section>

      {/* Prueba social — stats reales */}
      {stats.clientes > 0 && (
        <section className="border-y border-white/10 bg-white/5">
          <div className="mx-auto grid max-w-5xl grid-cols-2 gap-6 px-6 py-10 md:grid-cols-4">
            <Stat
              icon={<Users className="h-5 w-5" />}
              value={`${formatNumber(stats.clientes)}+`}
              label="Clientes registrados"
            />
            <Stat
              icon={<Ticket className="h-5 w-5" />}
              value={`${formatNumber(stats.membresias)}+`}
              label="Membresías activas"
            />
            <Stat
              icon={<Store className="h-5 w-5" />}
              value={formatNumber(stats.empresas)}
              label="Establecimientos"
            />
            <Stat
              icon={<QrCode className="h-5 w-5" />}
              value={`${formatNumber(stats.visitas)}+`}
              label="Visitas registradas"
            />
          </div>
        </section>
      )}

      {/* Cómo funciona */}
      <section className="mx-auto max-w-5xl px-6 py-20">
        <div className="mb-12 text-center">
          <h2 className="text-3xl font-bold">Activa tu Pase Digital en 5 pasos</h2>
          <p className="mt-3 text-slate-400">
            Tu acceso exclusivo está listo en minutos. Sin complicaciones.
          </p>
        </div>
        <div className="grid gap-6 md:grid-cols-5">
          {[
            { n: 1, t: 'Elige tu empresa', d: 'Entre nuestros establecimientos' },
            { n: 2, t: 'Selecciona tu plan', d: 'La promoción que prefieras' },
            { n: 3, t: 'Regístrate', d: 'Completa tus datos' },
            { n: 4, t: 'Recibe tu Pase QR', d: 'Al instante en tu cuenta' },
            { n: 5, t: 'Disfruta', d: 'Presenta tu QR en cada visita' },
          ].map((s) => (
            <div
              key={s.n}
              className="rounded-2xl border border-white/10 bg-white/5 p-5 text-center"
            >
              <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-sky-500 font-bold">
                {s.n}
              </div>
              <p className="font-semibold">{s.t}</p>
              <p className="mt-1 text-xs text-slate-400">{s.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Empresas y planes */}
      {companies.map((company) => (
        <section key={company.slug} className="mx-auto max-w-6xl px-6 py-12">
          <div className="mb-8 flex items-center gap-4">
            <div
              className={`flex h-14 w-14 items-center justify-center rounded-xl ${
                company.type === 'carwash'
                  ? 'bg-sky-500/20'
                  : 'bg-amber-500/20'
              }`}
            >
              {company.type === 'carwash' ? (
                <Car className="h-7 w-7 text-sky-400" />
              ) : (
                <UtensilsCrossed className="h-7 w-7 text-amber-400" />
              )}
            </div>
            <div>
              <h2 className="text-2xl font-bold">{company.name}</h2>
              <p className="text-slate-400">{company.description}</p>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {company.plans.map((plan) => (
              <div
                key={plan.nombre}
                className="flex flex-col rounded-2xl border border-white/10 bg-white/5 p-6 transition hover:border-sky-400/50 hover:bg-white/[0.07]"
              >
                <div className="mb-2 flex items-center justify-between">
                  <h3 className="text-xl font-semibold">{plan.nombre}</h3>
                  {plan.esIlimitado && (
                    <Badge className="bg-amber-500/20 text-amber-300 hover:bg-amber-500/20">
                      Ilimitado
                    </Badge>
                  )}
                </div>
                <p className="mb-1 text-3xl font-extrabold">
                  RD${formatPrice(plan.precio)}
                  <span className="text-base font-normal text-slate-400">
                    /mes
                  </span>
                </p>
                <p className="mb-4 text-sm text-slate-400">{plan.descripcion}</p>
                <ul className="mb-6 flex-1 space-y-2">
                  {plan.beneficios.map((b) => (
                    <li
                      key={b}
                      className="flex items-start gap-2 text-sm text-slate-300"
                    >
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-sky-400" />
                      {b}
                    </li>
                  ))}
                </ul>
                <Link href={`/registro/${company.slug}`}>
                  <Button className="w-full bg-sky-500 hover:bg-sky-400">
                    Quiero este plan
                  </Button>
                </Link>
              </div>
            ))}
          </div>
        </section>
      ))}

      {/* CTA final */}
      <section className="mx-auto max-w-4xl px-6 py-20 text-center">
        <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-sky-500/10 to-indigo-500/10 p-10">
          <ShieldCheck className="mx-auto mb-4 h-10 w-10 text-sky-400" />
          <h2 className="text-2xl font-bold md:text-3xl">
            ¿Listo para activar tu Pase Digital?
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-slate-300">
            Únete a los clientes que ya disfrutan promociones exclusivas en
            nuestros establecimientos.
          </p>
          <Link href="/empresas">
            <Button
              size="lg"
              className="mt-6 bg-sky-500 hover:bg-sky-400"
            >
              Comenzar ahora
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>

      <footer className="border-t border-white/10 py-8 text-center text-sm text-slate-500">
        © {new Date().getFullYear()} MembreGo · Plataforma inteligente para membresías
        promociones privadas
      </footer>
    </main>
  )
}

function Stat({
  icon,
  value,
  label,
}: {
  icon: React.ReactNode
  value: string
  label: string
}) {
  return (
    <div className="text-center">
      <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-sky-500/20 text-sky-400">
        {icon}
      </div>
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-xs text-slate-400">{label}</p>
    </div>
  )
}
