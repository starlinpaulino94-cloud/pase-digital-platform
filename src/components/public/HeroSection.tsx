import Link from 'next/link'

export function HeroSection() {
  return (
    <section className="bg-gradient-to-br from-blue-600 to-blue-800 text-white py-20 sm:py-32">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          {/* Content */}
          <div className="space-y-6">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold">
              Descubre Beneficios Exclusivos
            </h1>
            <p className="text-lg sm:text-xl text-blue-100">
              Accede a promociones, descuentos y beneficios especiales de las mejores empresas de tu ciudad.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href="/empresas"
                className="inline-block bg-white text-blue-600 font-bold px-6 sm:px-8 py-3 rounded-lg hover:bg-blue-50 transition-colors text-center"
              >
                Explorar Empresas
              </Link>
              <Link
                href="/promociones"
                className="inline-block border-2 border-white text-white font-bold px-6 sm:px-8 py-3 rounded-lg hover:bg-blue-700 transition-colors text-center"
              >
                Ver Promociones
              </Link>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white/10 backdrop-blur rounded-lg p-6 text-center">
              <div className="text-3xl sm:text-4xl font-bold mb-2">500+</div>
              <div className="text-blue-100">Empresas Afiliadas</div>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-lg p-6 text-center">
              <div className="text-3xl sm:text-4xl font-bold mb-2">10K+</div>
              <div className="text-blue-100">Miembros Activos</div>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-lg p-6 text-center">
              <div className="text-3xl sm:text-4xl font-bold mb-2">2K+</div>
              <div className="text-blue-100">Promociones Vigentes</div>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-lg p-6 text-center">
              <div className="text-3xl sm:text-4xl font-bold mb-2">4.8⭐</div>
              <div className="text-blue-100">Calificación</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
