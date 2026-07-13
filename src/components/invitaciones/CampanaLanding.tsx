'use client'

import { useActionState, useEffect, useState, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Gift, Clock, Shield, CheckCircle2, PartyPopper } from 'lucide-react'
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

const init: RegistroState = {}

export function CampanaLanding({ campana, refCode }: Props) {
  const router = useRouter()
  const countdown = useCountdown(campana.fechaFin)
  const [state, action, pending] = useActionState(registrarCliente, init)
  const [registrado, setRegistrado] = useState(false)
  const inicioTracked = useRef(false)

  // Embudo: el primer contacto con el formulario cuenta como registro
  // iniciado (una sola vez por vista de landing).
  const trackInicio = useCallback(() => {
    if (inicioTracked.current) return
    inicioTracked.current = true
    void registrarEventoCampana(campana.id, 'REGISTRO_INICIADO', {
      ...(refCode ? { refCode } : {}),
    })
  }, [campana.id, refCode])

  const primary = campana.colorPrimario || '#10b981'
  const secondary = campana.colorSecundario || '#059669'

  useEffect(() => {
    if (state.pendingVerification) {
      toast.success('Te enviamos un correo de confirmación.')
      setRegistrado(true)
      return
    }
    if (state.success) {
      setRegistrado(true)
    }
  }, [state.success, state.pendingVerification])

  if (registrado) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-emerald-50 to-white px-4">
        <div className="w-full max-w-md text-center space-y-6 py-12">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100">
            <PartyPopper className="h-10 w-10 text-emerald-600" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900">
            {state.pendingVerification ? 'Casi listo...' : '!Bienvenido!'}
          </h1>
          <p className="text-slate-600">
            {state.pendingVerification
              ? 'Revisa tu correo y confirma tu cuenta para activar tu beneficio.'
              : `Ya eres parte de ${campana.empresa.name}. Tu beneficio te espera.`}
          </p>
          {campana.beneficioInvitado?.descripcion && (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
              <Gift className="mx-auto h-8 w-8 text-emerald-600 mb-2" />
              <p className="font-semibold text-emerald-900">Tu regalo de bienvenida</p>
              <p className="text-sm text-emerald-700 mt-1">
                {campana.beneficioInvitado.descripcion}
              </p>
            </div>
          )}
          {!state.pendingVerification && (
            <Button
              onClick={() => router.push('/login')}
              className="w-full"
              style={{ backgroundColor: primary }}
            >
              Iniciar sesión
            </Button>
          )}
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
          <h1 className="text-3xl font-extrabold sm:text-4xl leading-tight">
            {campana.titulo}
          </h1>
          <p className="text-lg opacity-90">{campana.descripcion}</p>

          {/* Countdown */}
          {campana.abierta && !countdown.expired && (
            <div className="flex items-center justify-center gap-3 pt-4">
              <Clock className="h-5 w-5" />
              <div className="flex gap-2 text-center">
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

      {/* Benefits & Trust */}
      <section className="mx-auto max-w-3xl px-4 py-12 space-y-10">
        {campana.textoLanding && (
          <p className="text-center text-lg text-slate-700 leading-relaxed">
            {campana.textoLanding}
          </p>
        )}

        {campana.beneficioInvitado && (
          <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-6 text-center shadow-sm">
            <Gift className="mx-auto h-10 w-10 mb-3" style={{ color: primary }} />
            <h3 className="text-xl font-bold text-slate-900">
              Tu beneficio al registrarte
            </h3>
            {campana.beneficioInvitado.descripcion && (
              <p className="mt-2 text-slate-600">{campana.beneficioInvitado.descripcion}</p>
            )}
            {campana.beneficioInvitado.vigenciaDias && (
              <p className="mt-1 text-sm text-slate-500">
                Vigencia: {campana.beneficioInvitado.vigenciaDias} dias
              </p>
            )}
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

      {/* Registration Form */}
      {campana.abierta ? (
        <section id="registro" className="mx-auto max-w-md px-4 pb-16">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-bold text-slate-900 text-center mb-6">
              Crea tu cuenta gratis
            </h2>

            <form action={action} className="space-y-4" onFocus={trackInicio}>
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
      ) : (
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
      )}
    </div>
  )
}
