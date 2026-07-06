export function HowItWorks() {
  const steps = [
    {
      number: '1',
      title: 'Explora Empresas',
      description: 'Descubre las mejores empresas de tu ciudad con sus perfiles completos y ofertas.',
      icon: '🏢',
    },
    {
      number: '2',
      title: 'Descubre Beneficios',
      description: 'Accede a promociones, descuentos y beneficios exclusivos de cada empresa.',
      icon: '🎁',
    },
    {
      number: '3',
      title: 'Regístrate',
      description: 'Crea tu cuenta y obtén acceso a todos los beneficios de membresía.',
      icon: '📝',
    },
    {
      number: '4',
      title: 'Disfruta Beneficios',
      description: 'Accede a tu dashboard de membresías y disfruta de todos tus beneficios.',
      icon: '🎉',
    },
  ]

  return (
    <section className="py-12 sm:py-16 bg-neutral-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-neutral-900">
            Cómo Funciona
          </h2>
          <p className="text-neutral-600 mt-2 text-lg">
            Cuatro pasos simples para acceder a beneficios exclusivos
          </p>
        </div>

        {/* Steps */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((step, index) => (
            <div key={index} className="relative">
              {/* Card */}
              <div className="bg-white rounded-lg p-6 text-center h-full">
                <div className="text-5xl mb-4">{step.icon}</div>
                <div className="text-3xl font-bold text-blue-600 mb-2">
                  {step.number}
                </div>
                <h3 className="font-bold text-neutral-900 mb-2">
                  {step.title}
                </h3>
                <p className="text-neutral-600 text-sm">
                  {step.description}
                </p>
              </div>

              {/* Arrow */}
              {index < steps.length - 1 && (
                <div className="hidden lg:block absolute -right-3 top-1/2 -translate-y-1/2 text-2xl text-neutral-300">
                  →
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
