'use client'

import { useActionState, useEffect, useMemo, useRef, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Gift, Clock, Shield, CheckCircle2, PartyPopper, Wallet } from 'lucide-react'
import { toast } from 'sonner'
import { registrarCliente, type RegistroState } from '@/modules/registro/actions'
import { registrarEventoCampana } from '@/modules/invitaciones/clienteActions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface CampanaData {
  id: string
  slug: string
  titulo: string
  descripcion: string
  textoLanding: string | null
  imagenUrl: string | null
  bannerUrl: string | null
  fechaFin: string
  colorPrimario: string | null
  colorSecundario: string | null
  abierta: boolean
  expirada: boolean
  beneficioInvitado: {
    tipo?: string
    valor?: string
    descripcion?: string
    vigenciaDias?: number
  } | null
  empresa: {
    name: string
    slug: string
    logoUrl: string | null
  }
}

interface Props {
  campana: CampanaData
  refCode: string
  invitanteNombre?: string | null
}

function useCountdown(fechaFin: string) {
  const calc = useCallback(() => {
    const diff = new Date(fechaFin).getTime() - Date.now()
    if (diff <= 0) return { d: 0, h: 0, m: 0, s: 0, expired: true }
    return {
      d: Math.floor(diff / 86400000),
      h: Math.floor((diff % 86400000) / 3600000),
      m: Math.floor((diff % 3600000) / 60000),
      s: Math.floor((diff % 60000) / 1000),
      expired: false,
    }
  }, [fechaFin])

  const [time, setTime] = useState(calc)
  useEffect(() => {
    const id = setInterval(() => setTime(calc()), 1000)
    return () => clearInterval(id)
  }, [calc])
  return time
}

const CONFETTI_COLORS = ['#10b981', '#f59e0b', '#3b82f6', '#ec4899', '#8b5cf6', '#ef4444']

// Memoized random generator for confetti (must be defined outside component to avoid linter issues)
function generateConfettiPieces() {
  return Array.from({ length: 60 }, (_, i) => ({
    left: Math.random() * 100,
    delay: Math.random() * 2.5,
    duration: 2.5 + Math.random() * 2,
    size: 6 + Math.random() * 6,
    color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
    rotate: Math.random() * 360,
  }))
}

/** Lluvia de confeti en CSS puro (sin dependencias). */
function Confetti() {
  const pieces = useMemo(() => generateConfettiPieces(), [])
  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden>
      <style>{`
        @keyframes confetti-fall {
          0% { transform: translateY(-10vh) rotate(0deg); opacity: 1; }
          100% { transform: translateY(110vh) rotate(720deg); opacity: 0.6; }
        }
      `}</style>
      {pieces.map((p, i) => (
        <span
          key={i}
          className="absolute top-0 block"
          style={{
            left: `${p.left}%`,
            width: p.size,
            height: p.size * 0.45,
            backgroundColor: p.color,
            transform: `rotate(${p.rotate}deg)`,
            animation: `confetti-fall ${p.duration}s linear ${p.delay}s infinite`,
          }}
        />
      ))}
    </div>
  )
}

const init: RegistroState = {}

export function CampanaLanding({ campana, refCode, invitanteNombre }: Props) {
  const router = useRouter()
  const countdown = useCountdown(campana.fechaFin)
  const [state, action, pending] = useActionState(registrarCliente, init)
  const [registrado, setRegistrado] = useState(false)
  // Flujo en dos pasos (spec): primero VENDER el beneficio, el formulario
  // solo aparece cuando el visitante pulsa "Quiero mi regalo".
  const [mostrarFormulario, setMostrarFormulario] = useState(false)
  const formRef = useRef<HTMLDivElement>(null)
  const inicioTracked = useRef(false)

  const primary = campana.colorPrimario || '#10b981'
  const secondary = campana.colorSecundario || '#059669'

  useEffect(() => {
    if (state.pendingVerification || state.success) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setRegistrado(true)
      if (state.pendingVerification) {
        toast.success('Te enviamos un correo de confirmación.')
      }
    }
  }, [state.success, state.pendingVerification])

  const quieroMiRegalo = () => {
    setMostrarFormulario(true)
    if (!inicioTracked.current) {
      inicioTracked.current = true
      void registrarEventoCampana(campana.id, 'REGISTRO_INICIADO', {
        ...(refCode ? { refCode } : {}),
      })
    }
    // El formulario se monta en este mismo render: esperar al próximo frame.
    requestAnimationFrame(() => {
      formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    })
  }

  // ── Celebración post-registro (pantalla completa + confeti) ──────────────
  if (registrado) {
    return (
      <div className="relative flex min-h-screen items-center justify-center bg-gradient-to-br from-emerald-50 via-white to-amber-50 px-4">
        <Confetti />
        <div className="relative z-10 w-full max-w-md text-center space-y-6 py-12">
          <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-emerald-100 shadow-lg animate-bounce">
            <PartyPopper className="h-12 w-12 text-emerald-600" />
          </div>
          <h1 className="text-4xl font-extrabold text-slate-900">
            🎉 ¡¡Bienvenido a MembeGo!!
          </h1>
          <p className="text-lg text-slate-600">
            {state.pendingVerification
              ? 'Revisa tu correo y confirma tu cuenta para activar tu regalo.'
              : `Ya eres parte de ${campana.empresa.name}.`}
          </p>
          {campana.beneficioInvitado?.descripcion && (
            <div className="rounded-2xl border-2 border-emerald-300 bg-white p-6 shadow-xl">
              <Gift className="mx-auto h-10 w-10 text-emerald-600 mb-2" />
              <p className="text-sm font-medium text-emerald-700 uppercase tracking-wide">
                Acabas de obtener
              </p>
              <p className="mt-1 text-xl font-bold text-slate-900">
                {campana.beneficioInvitado.descripcion}
              </p>
              {campana.beneficioInvitado.vigenciaDias ? (
                <p className="mt-1 text-xs text-slate-500">
                  Vigencia: {campana.beneficioInvitado.vigenciaDias} días
                </p>
              ) : null}
            </div>
          )}
          {!state.pendingVerification && (
            <Button
              onClick={() => router.push('/login?next=/cliente/mis-promociones')}
              className="w-full py-6 text-lg font-bold text-white shadow-lg"
              style={{ backgroundColor: primary }}
            >
              <Wallet className="mr-2 h-5 w-5" />
              Reclamar mi premio
            </Button>
          )}
          <p className="text-xs text-slate-500">
            Tu regalo ya está en tu wallet de MembeGo con su código QR. Preséntalo en el
            negocio para usarlo.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <section
        className="relative px-4 py-16 text-center text-white"
        style={{
          background: `linear-gradient(135deg, ${primary}, ${secondary})`,
        }}
      >
        {campana.bannerUrl && (
          <div
            className="absolute inset-0 bg-cover bg-center opacity-20"
            style={{ backgroundImage: `url(${campana.bannerUrl})` }}
          />
        )}
        <div className="relative z-10 mx-auto max-w-2xl space-y-4">
          {campana.empresa.logoUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={campana.empresa.logoUrl}
              alt={campana.empresa.name}
              className="mx-auto h-14 w-14 rounded-full bg-white/90 object-contain p-1"
            />
          )}
          <p className="text-sm font-medium opacity-90">{campana.empresa.name}</p>
          <p className="text-base font-semibold opacity-95">
            🎉 Has recibido una invitación exclusiva
          </p>
          {invitanteNombre && (
            <p className="text-lg opacity-95">
              <span className="font-bold">{invitanteNombre}</span> quiere regalarte:
            </p>
          )}
          <h1 className="text-3xl font-extrabold sm:text-4xl leading-tight">
            {campana.titulo}
          </h1>
          <p className="text-lg opacity-90">{campana.descripcion}</p>

          {/* Countdown */}
          {campana.abierta && !countdown.expired && (
            <div className="pt-4 space-y-2">
              <p className="text-sm opacity-90 flex items-center justify-center gap-1.5">
                <Clock className="h-4 w-4" />
                La promoción termina en:
              </p>
              <div className="flex justify-center gap-2 text-center">
                {[
                  { val: countdown.d, label: 'd' },
                  { val: countdown.h, label: 'h' },
                  { val: countdown.m, label: 'm' },
                  { val: countdown.s, label: 's' },
                ].map((t) => (
                  <div
                    key={t.label}
                    className="rounded-lg bg-white/20 px-3 py-1.5 backdrop-blur-sm"
                  >
                    <span className="text-xl font-bold tabular-nums">
                      {String(t.val).padStart(2, '0')}
                    </span>
                    <span className="ml-0.5 text-xs opacity-80">{t.label}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Venta del beneficio */}
      <section className="mx-auto max-w-3xl px-4 py-12 space-y-10">
        {campana.imagenUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={campana.imagenUrl}
            alt={campana.titulo}
            className="mx-auto max-h-64 rounded-2xl object-cover shadow-md"
          />
        )}

        {campana.textoLanding && (
          <p className="text-center text-lg text-slate-700 leading-relaxed">
            {campana.textoLanding}
          </p>
        )}

        <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-6 shadow-sm">
          <h3 className="text-center text-xl font-bold text-slate-900 mb-4">Obtendrás:</h3>
          <ul className="mx-auto max-w-sm space-y-3">
            {campana.beneficioInvitado?.descripcion && (
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" style={{ color: primary }} />
                <span className="font-semibold text-slate-800">
                  {campana.beneficioInvitado.descripcion}
                </span>
              </li>
            )}
            <li className="flex items-start gap-2.5">
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" style={{ color: primary }} />
              <span className="text-slate-700">Cuenta gratuita en MembeGo</span>
            </li>
            <li className="flex items-start gap-2.5">
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" style={{ color: primary }} />
              <span className="text-slate-700">Acceso a promociones exclusivas</span>
            </li>
          </ul>
        </div>

        {/* CTA principal: el formulario NO aparece hasta pulsar aquí */}
        {campana.abierta && !mostrarFormulario && (
          <div className="text-center">
            <Button
              onClick={quieroMiRegalo}
              className="w-full max-w-md py-7 text-xl font-bold text-white shadow-xl transition-transform hover:scale-[1.02]"
              style={{ backgroundColor: primary }}
            >
              <Gift className="mr-2 h-6 w-6" />
              Quiero mi regalo
            </Button>
          </div>
        )}

        {/* Trust indicators */}
        <div className="grid gap-4 sm:grid-cols-3 text-center">
          {[
            { icon: Shield, text: 'Sin costo ni compromiso' },
            { icon: CheckCircle2, text: 'Registro en 30 segundos' },
            { icon: Gift, text: 'Beneficio inmediato' },
          ].map((t) => (
            <div
              key={t.text}
              className="flex flex-col items-center gap-2 rounded-xl border border-slate-100 bg-slate-50/50 p-4"
            >
              <t.icon className="h-6 w-6 text-slate-500" />
              <span className="text-sm font-medium text-slate-700">{t.text}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Registro (solo tras "Quiero mi regalo") */}
      {campana.abierta && mostrarFormulario ? (
        <section id="registro" ref={formRef} className="mx-auto max-w-md px-4 pb-16">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-bold text-slate-900 text-center mb-6">
              Crea tu cuenta gratis
            </h2>

            <form action={action} className="space-y-4">
              <input type="hidden" name="companySlug" value={campana.empresa.slug} />
              <input type="hidden" name="campanaId" value={campana.id} />
              {refCode && <input type="hidden" name="refCode" value={refCode} />}
              <input type="hidden" name="seguirEmpresa" value="on" />
              <input type="hidden" name="terminos" value="on" />

              {state.error && (
                <Alert variant="destructive">
                  <AlertDescription>{state.error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-1.5">
                <Label htmlFor="nombre">Nombre completo</Label>
                <Input id="nombre" name="nombre" required placeholder="Tu nombre" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="email">Correo electrónico</Label>
                <Input id="email" name="email" type="email" required placeholder="tu@correo.com" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="telefono">Teléfono</Label>
                <Input id="telefono" name="telefono" type="tel" required placeholder="809-555-0000" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="password">Contraseña</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  required
                  minLength={6}
                  placeholder="Mínimo 6 caracteres"
                />
              </div>

              <Button
                type="submit"
                disabled={pending}
                className="w-full text-white font-semibold py-3"
                style={{ backgroundColor: primary }}
              >
                {pending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Gift className="mr-2 h-4 w-4" />
                )}
                {pending ? 'Creando tu cuenta...' : 'Registrarme y obtener mi regalo'}
              </Button>

              <p className="text-xs text-center text-slate-500">
                Al registrarte aceptas los{' '}
                <a href="/terminos" className="underline" target="_blank">
                  términos
                </a>{' '}
                y{' '}
                <a href="/privacidad" className="underline" target="_blank">
                  política de privacidad
                </a>
                .
              </p>
            </form>
          </div>
        </section>
      ) : !campana.abierta ? (
        <section className="mx-auto max-w-md px-4 pb-16 text-center">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-8">
            <Clock className="mx-auto h-10 w-10 text-slate-400 mb-3" />
            <h2 className="text-xl font-bold text-slate-900">
              {campana.expirada ? 'Campaña finalizada' : 'Campaña no disponible'}
            </h2>
            <p className="mt-2 text-slate-600">
              {campana.expirada
                ? 'Esta promoción ya terminó. Visita la empresa para ver ofertas vigentes.'
                : 'Esta campaña no está activa en este momento.'}
            </p>
            <a
              href={`/empresas/${campana.empresa.slug}`}
              className="mt-4 inline-block text-sm font-medium underline"
              style={{ color: primary }}
            >
              Ir a {campana.empresa.name}
            </a>
          </div>
        </section>
      ) : null}
    </div>
  )
}
