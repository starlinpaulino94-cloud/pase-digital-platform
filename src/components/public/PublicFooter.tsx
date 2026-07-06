import Link from 'next/link'

export function PublicFooter() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-neutral-900 text-neutral-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand */}
          <div>
            <h3 className="font-bold text-xl text-white mb-4">MembeGo</h3>
            <p className="text-neutral-400 text-sm">
              La plataforma de membresías y beneficios para empresas y sus clientes.
            </p>
          </div>

          {/* Explore */}
          <div>
            <h4 className="font-semibold text-white mb-4">Explorar</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/empresas" className="text-neutral-400 hover:text-white">
                  Empresas
                </Link>
              </li>
              <li>
                <Link href="/promociones" className="text-neutral-400 hover:text-white">
                  Promociones
                </Link>
              </li>
              <li>
                <Link href="/login" className="text-neutral-400 hover:text-white">
                  Ingresar
                </Link>
              </li>
            </ul>
          </div>

          {/* For Businesses */}
          <div>
            <h4 className="font-semibold text-white mb-4">Para Empresas</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/registro" className="text-neutral-400 hover:text-white">
                  Registrarse como Empresa
                </Link>
              </li>
              <li>
                <Link href="/features" className="text-neutral-400 hover:text-white">
                  Características
                </Link>
              </li>
              <li>
                <Link href="/pricing" className="text-neutral-400 hover:text-white">
                  Planes
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="font-semibold text-white mb-4">Legal</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/privacy" className="text-neutral-400 hover:text-white">
                  Privacidad
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-neutral-400 hover:text-white">
                  Términos
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-neutral-400 hover:text-white">
                  Contacto
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="border-t border-neutral-800 pt-8 flex flex-col sm:flex-row justify-between items-center">
          <p className="text-neutral-400 text-sm">
            © {currentYear} MembeGo. Todos los derechos reservados.
          </p>
          <div className="flex gap-4 mt-4 sm:mt-0">
            <a href="#" className="text-neutral-400 hover:text-white">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M23 3a10.9 10.9 0 01-3.14 1.53 4.48 4.48 0 00-7.86 3v1A10.66 10.66 0 013 4s-4 9 5 13a11.64 11.64 0 01-7 2s9 5 20 5a9.5 9.5 0 00-9-5.5c4.75 2.25 7-7 7-7" />
              </svg>
            </a>
            <a href="#" className="text-neutral-400 hover:text-white">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M18 2h-3a6 6 0 00-6 6v3H7v4h2v8h4v-8h3l1-4h-4V8a2 2 0 012-2h3z" />
              </svg>
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}
