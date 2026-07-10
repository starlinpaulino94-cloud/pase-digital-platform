import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Política de Privacidad',
  description: 'Cómo MembeGo recopila, usa y protege tus datos personales.',
  alternates: { canonical: '/privacy' },
}

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-3xl font-bold text-slate-900">Política de Privacidad</h1>
        <p className="text-slate-500 text-sm mt-1">
          Última actualización: {new Date().getFullYear()}
        </p>

        <section className="mt-8 space-y-6 text-slate-700 leading-relaxed">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">1. Datos que recopilamos</h2>
            <p>
              Recopilamos los datos que nos proporcionas al registrarte (nombre,
              correo electrónico, teléfono y, en el caso de lavaderos, los datos de
              tu vehículo) y los datos de uso necesarios para operar tu membresía.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-slate-900">2. Uso de los datos</h2>
            <p>
              Usamos tus datos para gestionar tu membresía, validar el uso mediante
              QR, enviarte notificaciones relacionadas con tu cuenta y mejorar el
              servicio. No vendemos tus datos personales a terceros.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-slate-900">3. El código QR</h2>
            <p>
              El código QR de tu membresía contiene únicamente un identificador
              anónimo. Nunca incluye datos personales.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-slate-900">4. Seguridad</h2>
            <p>
              Aplicamos medidas técnicas y organizativas para proteger tus datos,
              incluyendo autenticación segura y aislamiento de la información por
              empresa.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-slate-900">5. Tus derechos</h2>
            <p>
              Puedes solicitar el acceso, rectificación o eliminación de tus datos
              personales escribiéndonos a{' '}
              <a href="mailto:contacto@membego.com" className="text-blue-600 hover:underline">
                contacto@membego.com
              </a>
              .
            </p>
          </div>
        </section>
      </div>
    </div>
  )
}
