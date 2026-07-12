import Link from 'next/link'
import Image from 'next/image'

const COLUMNAS = [
  {
    titulo: 'Explorar',
    links: [
      { href: '/empresas', label: 'Empresas' },
      { href: '/promociones', label: 'Promociones' },
      { href: '/login', label: 'Ingresar' },
    ],
  },
  {
    titulo: 'Para empresas',
    links: [
      { href: '/registro-empresa', label: 'Registrar mi empresa' },
      { href: '/empresas', label: 'Ver empresas' },
    ],
  },
  {
    titulo: 'Legal',
    links: [
      { href: '/privacy', label: 'Privacidad' },
      { href: '/terms', label: 'Términos' },
      { href: '/contact', label: 'Contacto' },
    ],
  },
]

export function PublicFooter() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="relative overflow-hidden bg-slate-950 text-white/80">
      {/* Glow de marca sutil en el borde superior */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-sky-500/60 to-transparent" />
      <div className="absolute -top-24 left-1/2 h-48 w-96 -translate-x-1/2 rounded-full bg-primary/10 blur-3xl" />

      <div className="relative mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="mb-10 grid grid-cols-1 gap-10 md:grid-cols-4">
          {/* Marca */}
          <div>
            <Link href="/" className="flex items-center gap-2">
              <Image src="/logo.svg" alt="MembeGo" width={28} height={28} />
              <span className="text-lg font-bold tracking-tight text-white">
                Membe<span className="text-gradient">Go</span>
              </span>
            </Link>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted-foreground">
              La plataforma de membresías digitales y beneficios para empresas y
              sus clientes.
            </p>
          </div>

          {COLUMNAS.map((col) => (
            <div key={col.titulo}>
              <h4 className="mb-4 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                {col.titulo}
              </h4>
              <ul className="space-y-2.5 text-sm">
                {col.links.map((l) => (
                  <li key={l.href + l.label}>
                    <Link
                      href={l.href}
                      className="text-muted-foreground transition-colors duration-150 hover:text-white"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Pie — enlaces sociales omitidos hasta tener URLs reales (no dejar href="#") */}
        <div className="flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-8 sm:flex-row">
          <p className="text-sm text-muted-foreground">
            © {currentYear} MembeGo. Todos los derechos reservados.
          </p>
        </div>
      </div>
    </footer>
  )
}
