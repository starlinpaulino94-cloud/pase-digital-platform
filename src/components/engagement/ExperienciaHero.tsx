'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowRight } from 'lucide-react'
import type { ExperienciaHero as Experiencia } from '@/modules/experience/engine'
import { FlashPromotion } from '@/components/ui/flash-promotion'
import { PromoBanner } from '@/components/ui/promo-banner'
import { Shine } from '@/components/ui/shine'
import { Button } from '@/components/ui/button'

/**
 * MEE · Renderer del motor de experiencias: traduce la urgencia decidida por
 * `elegirExperienciaHero` a la pieza visual correspondiente (MMS):
 *
 *  - ALTA  → FlashPromotion: countdown, barra de tiempo que se agota, glow
 *            que respira, shine y CTA pulsante (estilo Temu).
 *  - MEDIA → PromoBanner hero con barrido de Shine y CTA glass.
 *  - BAJA  → PromoBanner estándar (celebración sin estridencia).
 */
export function ExperienciaHero({ exp }: { exp: Experiencia }) {
  const router = useRouter()

  if (exp.urgencia === 'alta' && exp.hasta) {
    return (
      <div className="mb-6" data-experiencia={exp.tipo}>
        <FlashPromotion
          eyebrow={exp.eyebrow}
          titulo={exp.titulo}
          descripcion={exp.descripcion}
          hasta={exp.hasta}
          ctaLabel={exp.ctaTexto}
          onCta={() => router.push(exp.ctaHref)}
          tono={exp.tono === 'brand' ? 'brand' : 'hot'}
        />
      </div>
    )
  }

  return (
    <div
      className={exp.urgencia === 'media' ? 'animate-scale-in mb-6' : 'animate-fade-up mb-6'}
      data-experiencia={exp.tipo}
    >
      <Shine modo="loop" className="block rounded-3xl">
        <PromoBanner
          tono={exp.tono}
          size={exp.urgencia === 'media' ? 'hero' : 'base'}
          eyebrow={exp.eyebrow}
          titulo={exp.titulo}
          descripcion={exp.descripcion}
        >
          <Button
            asChild
            size={exp.urgencia === 'media' ? 'xl' : 'lg'}
            variant="glass"
            className="w-full font-bold text-white sm:w-auto"
          >
            <Link href={exp.ctaHref}>
              {exp.ctaTexto}
              <ArrowRight className="ml-1 h-4 w-4" aria-hidden />
            </Link>
          </Button>
        </PromoBanner>
      </Shine>
    </div>
  )
}
