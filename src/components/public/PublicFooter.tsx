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
    <footer className="relative overflow-hidden bg-slate-950 text-slate-100">
      {/* Glow de marca sutil en el borde superior */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-sky-500/60 to-transparent" />
      <div className="absolute -top-24 left-1/2 h-48 w-96 -translate-x-1/2 rounded-full bg-blue-600/10 blur-3xl" />

      <div className="relative mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="mb-10 grid grid-cols-1 gap-10 md:grid-cols-4">
          {/* Marca */}
          <div>
            <Link href="/" className="flex items-center gap-2">
              <Image src="/logo.svg" alt="MembeGo" width={28} height={28} />
              <span className="text-lg font-bold tracking-tight text-white">
                Membe<span className="text-emerald-400">Go</span>
              </span>
            </Link>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-slate-400">
              La plataforma de membresías digitales y beneficios para empresas y
              sus clientes.
            </p>
          </div>

          {COLUMNAS.map((col) => (
            <div key={col.titulo}>
              <h4 className="mb-4 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">
                {col.titulo}
              </h4>
              <ul className="space-y-2.5 text-sm">
                {col.links.map((l) => (
                  <li key={l.href + l.label}>
                    <Link
                      href={l.href}
                      className="text-slate-400 transition-colors duration-150 hover:text-white"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Pie */}
        <div className="flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-8 sm:flex-row">
          <p className="text-sm text-slate-500">
            © {currentYear} MembeGo. Todos los derechos reservados.
          </p>
          <div className="flex gap-2">
            <a
              href="#"
              aria-label="X (Twitter)"
              className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition-colors duration-150 hover:bg-white/5 hover:text-white"
            >
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
            </a>
            <a
              href="#"
              aria-label="Facebook"
              className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition-colors duration-150 hover:bg-white/5 hover:text-white"
            >
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
              </svg>
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}
