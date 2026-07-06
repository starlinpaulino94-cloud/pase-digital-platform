'use server'

import { prisma } from '@/lib/prisma'
import { cookies } from 'next/headers'

const RATE_LIMIT_WINDOW = 60 * 1000 // 1 minute
const MAX_VIEWS_PER_WINDOW = 10
const MAX_SHARES_PER_WINDOW = 5

async function getRateLimitKey(type: 'view' | 'share', id: string): Promise<string> {
  return `ratelimit:${type}:${id}:${Math.floor(Date.now() / RATE_LIMIT_WINDOW)}`
}

export async function recordPromotionView(promotionId: string): Promise<boolean> {
  if (!promotionId) return false

  try {
    const cookieStore = await cookies()
    const sessionId = cookieStore.get('session')?.value || `anonymous:${Date.now()}`

    // Simple client-side rate limiting via cookie
    const viewsKey = `promo_views:${promotionId}`
    const existingViews = cookieStore.get(viewsKey)
    const viewCount = existingViews ? parseInt(existingViews.value) : 0

    if (viewCount >= MAX_VIEWS_PER_WINDOW) {
      return false
    }

    // Record the view
    await prisma.promocion.update({
      where: { id: promotionId },
      data: {
        viewCount: {
          increment: 1,
        },
      },
    })

    // Update rate limit cookie (will be set by response)
    ;(await cookies()).set(viewsKey, String(viewCount + 1), {
      maxAge: RATE_LIMIT_WINDOW / 1000,
      httpOnly: false,
      sameSite: 'lax',
    })

    return true
  } catch (error) {
    console.error('[recordPromotionView] Error:', error)
    return false
  }
}

export async function recordPromotionShare(promotionId: string): Promise<boolean> {
  if (!promotionId) return false

  try {
    const cookieStore = await cookies()

    // Simple client-side rate limiting via cookie
    const sharesKey = `promo_shares:${promotionId}`
    const existingShares = cookieStore.get(sharesKey)
    const shareCount = existingShares ? parseInt(existingShares.value) : 0

    if (shareCount >= MAX_SHARES_PER_WINDOW) {
      return false
    }

    // Record the share
    await prisma.promocion.update({
      where: { id: promotionId },
      data: {
        shareCount: {
          increment: 1,
        },
      },
    })

    // Update rate limit cookie
    ;(await cookies()).set(sharesKey, String(shareCount + 1), {
      maxAge: RATE_LIMIT_WINDOW / 1000,
      httpOnly: false,
      sameSite: 'lax',
    })

    return true
  } catch (error) {
    console.error('[recordPromotionShare] Error:', error)
    return false
  }
}

// Future: These will be implemented when ClientFavorite table is created
// For now, they're placeholders that return false

export async function addCompanyToFavorites(companySlug: string): Promise<boolean> {
  // TODO: Implement when ClientFavorite table is created
  // Requires authentication via requireUser()
  console.log('[addCompanyToFavorites] Not yet implemented:', companySlug)
  return false
}

export async function removeCompanyFromFavorites(companySlug: string): Promise<boolean> {
  // TODO: Implement when ClientFavorite table is created
  // Requires authentication via requireUser()
  console.log('[removeCompanyFromFavorites] Not yet implemented:', companySlug)
  return false
}
