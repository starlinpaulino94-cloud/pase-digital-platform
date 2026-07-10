import type { Metadata } from 'next'
import { Mail, Building2 } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Contacto',
  description: 'Ponte en contacto con el equipo de MembeGo.',
  alternates: { canonical: '/contact' },
}

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-3xl font-bold text-slate-900">Contacto</h1>
        <p className="text-slate-600 mt-2">
          ¿Tienes preguntas o quieres registrar tu empresa en MembeGo? Escríbenos.
        </p>

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-slate-200 p-6">
            <Mail className="h-6 w-6 text-blue-600" />
            <h2 className="mt-3 font-semibold text-slate-900">Correo</h2>
            <p className="text-slate-600 text-sm mt-1">
              Soporte general y clientes
            </p>
            <a
              href="mailto:contacto@membego.com"
              className="text-blue-600 hover:underline text-sm font-medium"
            >
              contacto@membego.com
            </a>
          </div>

          <div className="rounded-xl border border-slate-200 p-6">
            <Building2 className="h-6 w-6 text-blue-600" />
            <h2 className="mt-3 font-semibold text-slate-900">Empresas</h2>
            <p className="text-slate-600 text-sm mt-1">
              ¿Quieres ofrecer membresías a tus clientes?
            </p>
            <a
              href="mailto:empresas@membego.com"
              className="text-blue-600 hover:underline text-sm font-medium"
            >
              empresas@membego.com
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
