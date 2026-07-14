'use client'

import { useActionState, useEffect, useMemo, useRef, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  Loader2,
  Gift,
  Clock,
  Shield,
  CheckCircle2,
  PartyPopper,
  Wallet,
  Share2,
  Sparkles,
} from 'lucide-react'
import { toast } from 'sonner'
import { registrarCliente, type RegistroState } from '@/modules/registro/actions'
import { registrarEventoCampana } from '@/modules/invitaciones/clienteActions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { QRDisplay } from '@/components/qr/QRDisplay'
import { landingUrlFor } from '@/lib/site'

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
  /** true = mostrar página de presentación; false = registro directo. */
  usarBanner: boolean
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

  // Estado inicial DETERMINISTA (sin Date.now()): así el HTML del servidor y el
  // primer render del cliente coinciden y no hay error de hidratación.
  const [time, setTime] = useState({ d: 0, h: 0, m: 0, s: 0, expired: false })
  useEffect(() => {
    setTime(calc())
    const id = setInterval(() => setTime(calc()), 1000)
    return () => clearInterval(id)
  }, [calc])
  return time
}

const CONFETTI_COLORS = ['#10b981', '#f59e0b', '#3b82f6', '#ec4899', '#8b5cf6', '#ef4444']

function generateConfettiPieces() {
  return Array.from({ length: 70 }, (_, i) => ({
    left: Math.random() * 100,
    delay: Math.random() * 2.5,
    duration: 2.5 + Math.random() * 2,
    size: 6 + Math.random() * 7,
    color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
    rotate: Math.random() * 360,
  }))
}

/** Lluvia de confeti en CSS puro (sin dependencias). */
function Confetti() {
  const pieces = useMemo(() => generateConfettiPieces(), [])
  return (
    <div className="pointer-events-none fixed inset-0 z-[110] overflow-hidden" aria-hidden>
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

/** Chips del contador (compartido por ambos modos). */
function Countdown({ d, h, m, s }: { d: number; h: number; m: number; s: number }) {
  return (
    <div className="flex justify-center gap-2 text-center">
      {[
        { val: d, label: 'd' },
        { val: h, label: 'h' },
        { val: m, label: 'm' },
        { val: s, label: 's' },
      ].map((t) => (
        <div key={t.label} className="rounded-lg bg-white/20 px-3 py-1.5 backdrop-blur-sm">
          <span className="text-xl font-bold tabular-nums">{String(t.val).padStart(2, '0')}</span>
          <span className="ml-0.5 text-xs opacity-80">{t.label}</span>
        </div>
      ))}
    </div>
  )
}

export function CampanaLanding({ campana, refCode, invitanteNombre }: Props) {
  const router = useRouter()
  const countdown = useCountdown(campana.fechaFin)
  const [state, action, pending] = useActionState(registrarCliente, init)
  const [registrado, setRegistrado] = useState(false)
  // En modo banner el formulario se revela tras "Quiero mi regalo"; en modo
  // registro directo (por defecto) el formulario está visible de entrada.
  const [mostrarFormulario, setMostrarFormulario] = useState(!campana.usarBanner)
  const formRef = useRef<HTMLDivElement>(null)
  const inicioTracked = useRef(false)

  const primary = campana.colorPrimario || '#10b981'
  const secondary = campana.colorSecundario || '#059669'
  const regalo = campana.beneficioInvitado?.descripcion || campana.beneficioInvitado?.valor

  useEffect(() => {
    if (state.pendingVerification || state.success) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setRegistrado(true)
      if (state.pendingVerification) {
        toast.success('Te enviamos un correo de confirmación.')
      }
    }
  }, [state.success, state.pendingVerification])

  // En registro directo, marca REGISTRO_INICIADO al montar (el form ya está a la vista).
  useEffect(() => {
    if (!campana.usarBanner && campana.abierta && !inicioTracked.current) {
      inicioTracked.current = true
      void registrarEventoCampana(campana.id, 'REGISTRO_INICIADO', {
        ...(refCode ? { refCode } : {}),
      })
    }
  }, [campana.usarBanner, campana.abierta, campana.id, refCode])

  const quieroMiRegalo = () => {
    setMostrarFormulario(true)
    if (!inicioTracked.current) {
      inicioTracked.current = true
      void registrarEventoCampana(campana.id, 'REGISTRO_INICIADO', {
        ...(refCode ? { refCode } : {}),
      })
    }
    requestAnimationFrame(() => {
      formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    })
  }

  // El recién registrado comparte SU propio enlace desde la celebración, sin
  // esperar a iniciar sesión (el código viene en el state del registro).
  const compartirCelebracion = async () => {
    if (!state.codigoInvitacion) return
    const url = `${window.location.origin}/invitar/${state.codigoInvitacion}`
    const regaloTexto = regalo || 'un regalo de bienvenida'
    const text = `🎉 ¡A mí ya me regalaron: ${regaloTexto}!\n\nAcabo de registrarme en MembeGo y tú también puedes recibir el tuyo GRATIS al crear tu cuenta.\n\nRegístrate aquí:`
    const copiar = async () => {
      await navigator.clipboard.writeText(`${text} ${url}`)
      toast.success('Enlace copiado. ¡Compártelo con tus amigos!')
    }
    try {
      if (typeof navigator !== 'undefined' && navigator.share) {
        await navigator.share({ title: campana.titulo, text, url })
        return
      }
      await copiar()
    } catch (e) {
      if (e instanceof DOMException && e.name === 'AbortError') return
      await copiar().catch(() => toast.error('No se pudo compartir.'))
    }
  }

  // ── Formulario de registro (compartido) ──────────────────────────────────
  const RegistroForm = (
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
        className="w-full py-6 text-base font-bold text-white shadow-lg transition-transform hover:scale-[1.02]"
        style={{ backgroundColor: primary }}
      >
        {pending ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Gift className="mr-2 h-5 w-5" />}
        {pending ? 'Creando tu cuenta...' : 'Registrarme y obtener mi regalo'}
      </Button>

      <p className="text-center text-xs text-slate-500">
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
  )

  // ── Celebración post-registro: MODAL por encima de todo (estilo Temu) ─────
  const Celebracion = registrado ? (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Fondo oscuro difuminado: el modal queda "por encima" de la pantalla */}
      <div className="absolute inset-0 bg-slate-900/70 backdrop-blur-sm" />
      <Confetti />
      <style>{`
        @keyframes celebra-pop {
          0% { transform: scale(0.85) translateY(12px); opacity: 0; }
          100% { transform: scale(1) translateY(0); opacity: 1; }
        }
      `}</style>
      <div
        className="relative z-[120] max-h-[92vh] w-full max-w-md overflow-y-auto rounded-3xl bg-white p-6 text-center shadow-2xl"
        style={{ animation: 'celebra-pop 0.45s cubic-bezier(0.16,1,0.3,1)' }}
        role="dialog"
        aria-modal="true"
      >
        <div className="mx-auto flex h-20 w-20 animate-bounce items-center justify-center rounded-full bg-emerald-100 shadow-lg">
          <PartyPopper className="h-10 w-10 text-emerald-600" />
        </div>
        <h1 className="mt-4 text-3xl font-extrabold text-slate-900">🎉 ¡Felicidades!</h1>
        <p className="mt-1.5 text-slate-600">
          {state.pendingVerification
            ? 'Revisa tu correo y confirma tu cuenta para activar tu regalo.'
            : `Ya eres parte de ${campana.empresa.name}.`}
        </p>

        {/* Regalo destacado */}
        <div className="mt-5 rounded-2xl border-2 border-emerald-300 bg-gradient-to-br from-emerald-50 to-white p-5 shadow-sm">
          <Gift className="mx-auto mb-1.5 h-9 w-9 text-emerald-600" />
          <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
            Por tu registro recibiste
          </p>
          <p className="mt-1 text-2xl font-extrabold text-slate-900">
            {regalo || 'Un lavado GRATIS'}
          </p>
          {campana.beneficioInvitado?.vigenciaDias ? (
            <p className="mt-1 text-xs text-slate-500">
              Vigencia: {campana.beneficioInvitado.vigenciaDias} días
            </p>
          ) : null}
        </div>

        {/* QR del regalo, inmediato */}
        {state.qrBienvenida && (
          <div className="mt-5 flex flex-col items-center gap-2">
            <QRDisplay token={state.qrBienvenida} size={180} />
            <p className="text-xs text-slate-500">
              Presenta este código QR en el negocio para usar tu beneficio.
            </p>
          </div>
        )}

        {/* Invitar amigos: el momento de máxima emoción → cadena viral */}
        {state.codigoInvitacion && (
          <div className="mt-5 rounded-2xl border-2 border-amber-200 bg-gradient-to-br from-amber-50 to-white p-5 shadow-sm">
            <Sparkles className="mx-auto mb-1.5 h-8 w-8 text-amber-500" />
            <h2 className="text-lg font-bold text-slate-900">Invita a tus amigos</h2>
            <p className="mt-1 text-sm text-slate-600">
              Ellos también recibirán{' '}
              <span className="font-semibold text-slate-800">
                {regalo || 'su regalo de bienvenida'}
              </span>{' '}
              al registrarse con tu enlace.
            </p>
            <Button
              onClick={compartirCelebracion}
              className="mt-3 w-full py-6 text-lg font-bold text-white shadow-lg transition-transform hover:scale-[1.02]"
              style={{ backgroundColor: secondary }}
            >
              <Share2 className="mr-2 h-5 w-5" />
              Compartir mi enlace
            </Button>
          </div>
        )}

        {!state.pendingVerification && (
          <Button
            onClick={() => router.push('/login?next=/mis-membresias')}
            variant="outline"
            className="mt-4 w-full py-5 font-semibold"
          >
            <Wallet className="mr-2 h-5 w-5" />
            Entrar a mi cuenta
          </Button>
        )}
      </div>
    </div>
  ) : null

  // ─────────────────────────────────────────────────────────────────────────
  // MODO REGISTRO DIRECTO (por defecto): el enlace lleva directo al formulario.
  // ─────────────────────────────────────────────────────────────────────────
  if (!campana.usarBanner) {
    return (
      <div
        className="min-h-screen px-4 py-10"
        style={{ background: `linear-gradient(160deg, ${primary}14, #ffffff 42%, ${secondary}14)` }}
      >
        {Celebracion}
        <div className="mx-auto w-full max-w-md">
          {/* Marca */}
          <div className="mb-6 flex flex-col items-center gap-2 text-center">
            {campana.empresa.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={campana.empresa.logoUrl}
                alt={campana.empresa.name}
                className="h-16 w-16 rounded-2xl bg-white object-contain p-1 shadow-md"
              />
            ) : (
              <div
                className="flex h-16 w-16 items-center justify-center rounded-2xl text-white shadow-md"
                style={{ background: `linear-gradient(135deg, ${primary}, ${secondary})` }}
              >
                <Gift className="h-8 w-8" />
              </div>
            )}
            <p className="text-sm font-semibold text-slate-500">{campana.empresa.name}</p>
          </div>

          {/* Tarjeta principal */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xl">
            {invitanteNombre && (
              <p className="mb-2 text-center text-sm font-medium text-slate-500">
                <span className="font-bold text-slate-700">{invitanteNombre}</span> te invitó 🎁
              </p>
            )}
            <h1 className="text-center text-2xl font-extrabold leading-tight text-slate-900">
              {campana.titulo}
            </h1>
            {regalo && (
              <div className="mx-auto mt-3 flex w-fit items-center gap-2 rounded-full bg-emerald-50 px-4 py-1.5">
                <Gift className="h-4 w-4 text-emerald-600" />
                <span className="text-sm font-bold text-emerald-700">{regalo}</span>
              </div>
            )}
            <p className="mt-3 text-center text-sm text-slate-600">{campana.descripcion}</p>

            {campana.abierta && !countdown.expired && (
              <div
                className="mt-4 rounded-2xl px-4 py-3 text-white"
                style={{ background: `linear-gradient(135deg, ${primary}, ${secondary})` }}
              >
                <p className="mb-1.5 flex items-center justify-center gap-1.5 text-xs opacity-90">
                  <Clock className="h-3.5 w-3.5" /> Termina en
                </p>
                <Countdown d={countdown.d} h={countdown.h} m={countdown.m} s={countdown.s} />
              </div>
            )}

            <div className="mt-6">
              {campana.abierta ? (
                <>
                  <h2 className="mb-3 text-center text-lg font-bold text-slate-900">
                    Crea tu cuenta gratis
                  </h2>
                  <div ref={formRef}>{RegistroForm}</div>
                </>
              ) : (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 text-center">
                  <Clock className="mx-auto mb-2 h-9 w-9 text-slate-400" />
                  <h2 className="text-lg font-bold text-slate-900">
                    {campana.expirada ? 'Campaña finalizada' : 'Campaña no disponible'}
                  </h2>
                  <p className="mt-1.5 text-sm text-slate-600">
                    {campana.expirada
                      ? 'Esta promoción ya terminó. Visita la empresa para ver ofertas vigentes.'
                      : 'Esta campaña no está activa en este momento.'}
                  </p>
                  <a
                    href={landingUrlFor(`/empresas/${campana.empresa.slug}`)}
                    className="mt-3 inline-block text-sm font-medium underline"
                    style={{ color: primary }}
                  >
                    Ir a {campana.empresa.name}
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Confianza */}
          <div className="mt-4 flex items-center justify-center gap-4 text-xs text-slate-500">
            <span className="flex items-center gap-1">
              <Shield className="h-3.5 w-3.5" /> Sin costo
            </span>
            <span className="flex items-center gap-1">
              <CheckCircle2 className="h-3.5 w-3.5" /> 30 segundos
            </span>
            <span className="flex items-center gap-1">
              <Gift className="h-3.5 w-3.5" /> Regalo inmediato
            </span>
          </div>
        </div>
      </div>
    )
  }

  // ─────────────────────────────────────────────────────────────────────────
  // MODO BANNER: página de presentación (hero) antes del formulario.
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-white">
      {Celebracion}
      {/* Hero */}
      <section
        className="relative px-4 py-16 text-center text-white"
        style={{ background: `linear-gradient(135deg, ${primary}, ${secondary})` }}
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
          <h1 className="text-3xl font-extrabold leading-tight sm:text-4xl">{campana.titulo}</h1>
          <p className="text-lg opacity-90">{campana.descripcion}</p>

          {campana.abierta && !countdown.expired && (
            <div className="space-y-2 pt-4">
              <p className="flex items-center justify-center gap-1.5 text-sm opacity-90">
                <Clock className="h-4 w-4" />
                La promoción termina en:
              </p>
              <Countdown d={countdown.d} h={countdown.h} m={countdown.m} s={countdown.s} />
            </div>
          )}
        </div>
      </section>

      {/* Venta del beneficio */}
      <section className="mx-auto max-w-3xl space-y-10 px-4 py-12">
        {campana.imagenUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={campana.imagenUrl}
            alt={campana.titulo}
            className="mx-auto max-h-64 rounded-2xl object-cover shadow-md"
          />
        )}

        {campana.textoLanding && (
          <p className="text-center text-lg leading-relaxed text-slate-700">
            {campana.textoLanding}
          </p>
        )}

        <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-6 shadow-sm">
          <h3 className="mb-4 text-center text-xl font-bold text-slate-900">Obtendrás:</h3>
          <ul className="mx-auto max-w-sm space-y-3">
            {regalo && (
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" style={{ color: primary }} />
                <span className="font-semibold text-slate-800">{regalo}</span>
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

        <div className="grid gap-4 text-center sm:grid-cols-3">
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

      {campana.abierta && mostrarFormulario ? (
        <section id="registro" ref={formRef} className="mx-auto max-w-md px-4 pb-16">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="mb-6 text-center text-xl font-bold text-slate-900">
              Crea tu cuenta gratis
            </h2>
            {RegistroForm}
          </div>
        </section>
      ) : !campana.abierta ? (
        <section className="mx-auto max-w-md px-4 pb-16 text-center">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-8">
            <Clock className="mx-auto mb-3 h-10 w-10 text-slate-400" />
            <h2 className="text-xl font-bold text-slate-900">
              {campana.expirada ? 'Campaña finalizada' : 'Campaña no disponible'}
            </h2>
            <p className="mt-2 text-slate-600">
              {campana.expirada
                ? 'Esta promoción ya terminó. Visita la empresa para ver ofertas vigentes.'
                : 'Esta campaña no está activa en este momento.'}
            </p>
            <a
              href={landingUrlFor(`/empresas/${campana.empresa.slug}`)}
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
