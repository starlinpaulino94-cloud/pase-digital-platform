import Link from 'next/link'
import { Suspense } from 'react'
import { LoginForm } from '@/components/auth/LoginForm'

export default function LoginPage() {
  return (
    <>
      <Suspense fallback={<div className="text-white/60">Cargando...</div>}>
        <LoginForm />
      </Suspense>

      {/* Additional Context */}
      <div className="mt-8 space-y-6">
        <div className="text-center">
          <p className="text-white/60 text-sm mb-4">¿Aún no tienes cuenta?</p>
          <Link
            href="/empresas"
            className="inline-block rounded-lg border border-white/20 px-6 py-2 text-sm font-semibold text-white transition-colors hover:bg-white/10"
          >
            Explorar Empresas
          </Link>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-lg p-4 text-center">
          <p className="text-white/70 text-xs">
            Descubre promociones y beneficios exclusivos antes de registrarte
          </p>
          <Link
            href="/promociones"
            className="text-primary hover:text-primary font-semibold text-xs mt-2 inline-block"
          >
            Ver todas las promociones →
          </Link>
        </div>
      </div>
    </>
  )
}
