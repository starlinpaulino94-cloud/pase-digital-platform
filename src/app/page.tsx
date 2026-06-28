import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function Home() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-primary flex items-center justify-center shrink-0">
              <span className="text-[10px] font-bold text-primary-foreground">P</span>
            </div>
            <span className="font-semibold text-sm text-foreground">PASE Digital</span>
          </div>
          <nav className="hidden md:flex items-center gap-1">
            <Link href="/empresas" className="px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted transition-colors">
              Empresas
            </Link>
            <Link href="/faq" className="px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted transition-colors">
              FAQ
            </Link>
          </nav>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/login">Iniciar sesión</Link>
            </Button>
            <Button size="sm" asChild>
              <Link href="/registro">Registrarse</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero */}
        <section className="max-w-6xl mx-auto px-6 pt-24 pb-20 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-border bg-muted text-xs text-muted-foreground mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            Plataforma de promociones digitales
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-foreground max-w-3xl mx-auto leading-tight">
            Tus promociones favoritas,{' '}
            <span className="relative">
              <span className="text-gradient">en un solo pase</span>
            </span>
          </h1>
          <p className="mt-6 text-lg text-muted-foreground max-w-xl mx-auto leading-relaxed">
            Accede a ofertas exclusivas de las empresas que te importan con tu pase digital QR. Sin papel, sin apps extra, sin complicaciones.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button size="lg" asChild className="w-full sm:w-auto min-w-36">
              <Link href="/registro">Obtener mi pase</Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="w-full sm:w-auto">
              <Link href="/empresas">Ver empresas</Link>
            </Button>
          </div>
          <p className="mt-4 text-xs text-muted-foreground">Gratis. Sin tarjeta de crédito.</p>
        </section>

        {/* Features */}
        <section className="max-w-6xl mx-auto px-6 pb-20">
          <div className="grid gap-4 sm:grid-cols-3">
            {[
              {
                title: 'Pase QR único',
                description: 'Un código que centraliza todas tus promociones. Muéstralo en cualquier empresa participante.',
                number: '01',
              },
              {
                title: 'Validación al instante',
                description: 'El empleado escanea tu pase y confirma el beneficio en segundos. Sin esperas ni formularios.',
                number: '02',
              },
              {
                title: 'Historial completo',
                description: 'Consulta cada uso, cuándo y dónde. Nunca pierdas un beneficio ni una oferta especial.',
                number: '03',
              },
            ].map((feat) => (
              <div
                key={feat.number}
                className="group bg-card border border-border rounded-2xl p-6 hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-200"
              >
                <span className="text-xs font-mono text-muted-foreground/60">{feat.number}</span>
                <h3 className="mt-3 text-base font-semibold text-foreground">{feat.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{feat.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* How it works */}
        <section className="border-t border-border bg-muted/30">
          <div className="max-w-6xl mx-auto px-6 py-20">
            <div className="text-center mb-12">
              <h2 className="text-2xl font-bold text-foreground">¿Cómo funciona?</h2>
              <p className="mt-2 text-sm text-muted-foreground">Tres pasos y listo</p>
            </div>
            <div className="grid gap-8 sm:grid-cols-3 text-center">
              {[
                { step: '1', title: 'Regístrate', desc: 'Crea tu cuenta gratis en menos de un minuto.' },
                { step: '2', title: 'Obtén tu pase', desc: 'Recibe tu pase digital QR único y personal.' },
                { step: '3', title: 'Valida tus ofertas', desc: 'Muestra el QR en las empresas participantes para canjear tus promociones.' },
              ].map((s) => (
                <div key={s.step} className="space-y-3">
                  <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground font-bold text-sm flex items-center justify-center mx-auto">
                    {s.step}
                  </div>
                  <h3 className="font-semibold text-foreground">{s.title}</h3>
                  <p className="text-sm text-muted-foreground">{s.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="max-w-6xl mx-auto px-6 py-20 text-center">
          <div className="bg-primary rounded-3xl px-8 py-14">
            <h2 className="text-2xl font-bold text-primary-foreground">Empieza hoy, es gratis</h2>
            <p className="mt-3 text-sm text-primary-foreground/70 max-w-md mx-auto">
              Únete a miles de clientes que ya disfrutan sus promociones digitales sin complicaciones.
            </p>
            <Button size="lg" variant="secondary" className="mt-8" asChild>
              <Link href="/registro">Crear cuenta gratis</Link>
            </Button>
          </div>
        </section>
      </main>

      <footer className="border-t border-border py-8">
        <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded bg-primary flex items-center justify-center">
              <span className="text-[8px] font-bold text-primary-foreground">P</span>
            </div>
            <span>PASE Digital</span>
          </div>
          <p>© {new Date().getFullYear()} PASE Digital. Todos los derechos reservados.</p>
          <nav className="flex gap-4">
            <Link href="/empresas" className="hover:text-foreground transition-colors">Empresas</Link>
            <Link href="/faq" className="hover:text-foreground transition-colors">FAQ</Link>
          </nav>
        </div>
      </footer>
    </div>
  )
}
