import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import type { NovedadInicio } from '@/modules/social/queries'
import { PromoBanner } from '@/components/ui/promo-banner'
import { FeedNovedades } from '@/components/cliente/FeedNovedades'

/**
 * Sección secundaria de descubrimiento al final del Home: una franja fina de
 * "Invita y gana" (no un hero — la wallet ya es el protagonista de la
 * pantalla) seguida de las novedades de las empresas que el cliente sigue.
 */
export function DescubreMas({
  novedades,
  mostrarInvitaYGana = true,
}: {
  novedades: NovedadInicio[]
  /** false cuando "Invita y gana" ya es el héroe de la pantalla (no repetir). */
  mostrarInvitaYGana?: boolean
}) {
  return (
    <section className="animate-fade-up space-y-5">
      <p className="text-overline text-muted-foreground">Descubre más</p>

      {mostrarInvitaYGana && (
        <PromoBanner
          tono="celebracion"
          size="slim"
          titulo="Regala beneficios, gana premios"
          descripcion="Comparte tu enlace: tus amigos reciben un regalo y tú acumulas recompensas."
        >
          <Link
            href="/cliente/invita-y-gana"
            className="inline-flex shrink-0 items-center gap-1 text-sm font-bold text-white"
          >
            Invitar
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </PromoBanner>
      )}

      <FeedNovedades novedades={novedades} />
    </section>
  )
}
