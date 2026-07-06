import { HeroSection } from '@/components/public/HeroSection'
import { FeaturedPromotions } from '@/components/public/FeaturedPromotions'
import { HowItWorks } from '@/components/public/HowItWorks'
import { getFeaturedPromotions } from '@/modules/marketplace/queries'

export const revalidate = 3600 // Revalidate every hour

export default async function HomePage() {
  const promotions = await getFeaturedPromotions(6)

  return (
    <>
      <HeroSection />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <FeaturedPromotions promotions={promotions} isLoading={false} />
      </div>
      <HowItWorks />
    </>
  )
}
