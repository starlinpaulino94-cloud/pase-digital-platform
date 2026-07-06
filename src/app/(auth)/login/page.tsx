import Link from 'next/link'
import { Suspense } from 'react'
import { LoginForm } from '@/components/auth/LoginForm'

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-blue-50">
      <div className="max-w-md mx-auto px-4 py-12">
        <Suspense fallback={<div className="text-slate-400">Cargando...</div>}>
          <LoginForm />
        </Suspense>

        {/* Additional Context */}
        <div className="mt-8 space-y-6">
          <div className="text-center">
            <p className="text-neutral-600 text-sm mb-4">
              ¿Aún no tienes cuenta?
            </p>
            <Link
              href="/empresas"
              className="inline-block bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-semibold"
            >
              Explorar Empresas
            </Link>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
            <p className="text-blue-900 text-xs">
              Descubre promociones y beneficios exclusivos antes de registrarte
            </p>
            <Link
              href="/promociones"
              className="text-blue-600 hover:text-blue-700 font-semibold text-xs mt-2 inline-block"
            >
              Ver todas las promociones →
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
