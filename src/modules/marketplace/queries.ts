import { prisma } from '@/lib/prisma'
import type {
  CompanyPublic,
  PromotionPublic,
  CategoryPublic,
  MarketplaceFilters,
  PromotionFilters,
  CompanyStats,
} from './types'

/**
 * PUBLIC QUERIES - No authentication required
 * These queries only expose non-sensitive fields
 */

export async function getCompaniesPublic(filters: MarketplaceFilters = {}): Promise<CompanyPublic[]> {
  const {
    search,
    category,
    city,
    country,
    type,
    featured,
    limit = 50,
    offset = 0,
  } = filters

  try {
    const companies = await prisma.company.findMany({
      where: {
        isPublished: true,
        isActive: true,
        ...(search && {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { description: { contains: search, mode: 'insensitive' } },
          ],
        }),
        ...(city && { ciudad: city }),
        ...(country && { pais: country }),
        ...(type && { type }),
        ...(featured && { isFeatured: true }),
        ...(category && {
          categories: {
            some: {
              category: { slug: category },
            },
          },
        }),
      },
      select: {
        id: true,
        name: true,
        slug: true,
        type: true,
        description: true,
        logoUrl: true,
        bannerUrl: true,
        galleryImages: true,
        ciudad: true,
        provincia: true,
        pais: true,
        telefono: true,
        whatsapp: true,
        email: true,
        website: true,
        instagram: true,
        facebook: true,
        tiktok: true,
        googleMapsUrl: true,
        totalMembersCount: true,
        activePromotionsCount: true,
        averageRating: true,
        isFeatured: true,
        createdAt: true,
        categories: {
          select: {
            category: {
              select: { slug: true },
            },
          },
        },
      },
      orderBy: [
        { isFeatured: 'desc' },
        { createdAt: 'desc' },
      ],
      take: limit,
      skip: offset,
    })

    return companies.map((c) => ({
      ...c,
      categories: c.categories.map((cc) => cc.category.slug),
    })) as CompanyPublic[]
  } catch (error) {
    console.error('[getCompaniesPublic] Error:', error)
    return []
  }
}

export async function getCompanyPublic(companySlug: string): Promise<CompanyPublic | null> {
  if (!companySlug) return null

  try {
    const company = await prisma.company.findUnique({
      where: { slug: companySlug },
      select: {
        id: true,
        name: true,
        slug: true,
        type: true,
        description: true,
        logoUrl: true,
        bannerUrl: true,
        galleryImages: true,
        ciudad: true,
        provincia: true,
        pais: true,
        telefono: true,
        whatsapp: true,
        email: true,
        website: true,
        instagram: true,
        facebook: true,
        tiktok: true,
        googleMapsUrl: true,
        totalMembersCount: true,
        activePromotionsCount: true,
        averageRating: true,
        isFeatured: true,
        isPublished: true,
        isActive: true,
        createdAt: true,
        categories: {
          select: {
            category: {
              select: { slug: true },
            },
          },
        },
      },
    })

    if (!company || !company.isPublished || !company.isActive) return null

    return {
      ...company,
      categories: company.categories.map((c) => c.category.slug),
    } as CompanyPublic
  } catch (error) {
    console.error('[getCompanyPublic] Error:', error)
    return null
  }
}

export async function getPromotionsPublic(filters: PromotionFilters = {}): Promise<PromotionPublic[]> {
  const {
    search,
    company,
    type,
    tag,
    limit = 50,
    offset = 0,
  } = filters

  const now = new Date()

  try {
    const promotions = await prisma.promocion.findMany({
      where: {
        activo: true,
        vigenciaHasta: {
          gt: now,
        },
        // El filtro por slug se fusiona dentro de company para no sobrescribir
        // (y perder) las condiciones isPublished/isActive.
        company: {
          isPublished: true,
          isActive: true,
          ...(company && { slug: company }),
        },
        ...(search && {
          OR: [
            { titulo: { contains: search, mode: 'insensitive' } },
            { descripcion: { contains: search, mode: 'insensitive' } },
          ],
        }),
        ...(type && { tipo: type }),
        ...(tag && {
          tags: {
            has: tag,
          },
        }),
      },
      select: {
        id: true,
        titulo: true,
        slug: true,
        descripcion: true,
        imagenUrl: true,
        tipo: true,
        descuento: true,
        codigo: true,
        vigenciaDesde: true,
        vigenciaHasta: true,
        viewCount: true,
        shareCount: true,
        tags: true,
        isFeatured: true,
        createdAt: true,
        company: {
          select: {
            id: true,
            name: true,
            slug: true,
            logoUrl: true,
          },
        },
      },
      orderBy: [
        { isFeatured: 'desc' },
        { createdAt: 'desc' },
      ],
      take: limit,
      skip: offset,
    })

    return promotions as PromotionPublic[]
  } catch (error) {
    console.error('[getPromotionsPublic] Error:', error)
    return []
  }
}

export async function getFeaturedPromotions(limit: number = 6): Promise<PromotionPublic[]> {
  const now = new Date()

  try {
    const promotions = await prisma.promocion.findMany({
      where: {
        isFeatured: true,
        activo: true,
        vigenciaHasta: {
          gt: now,
        },
        company: {
          isPublished: true,
          isActive: true,
        },
      },
      select: {
        id: true,
        titulo: true,
        slug: true,
        descripcion: true,
        imagenUrl: true,
        tipo: true,
        descuento: true,
        codigo: true,
        vigenciaDesde: true,
        vigenciaHasta: true,
        viewCount: true,
        shareCount: true,
        tags: true,
        isFeatured: true,
        createdAt: true,
        company: {
          select: {
            id: true,
            name: true,
            slug: true,
            logoUrl: true,
          },
        },
      },
      orderBy: [
        { featuredOrder: 'asc' },
        { createdAt: 'desc' },
      ],
      take: limit,
    })

    return promotions as PromotionPublic[]
  } catch (error) {
    console.error('[getFeaturedPromotions] Error:', error)
    return []
  }
}

export async function getPromotionDetail(promotionId: string): Promise<PromotionPublic | null> {
  if (!promotionId) return null

  const now = new Date()

  try {
    const promotion = await prisma.promocion.findUnique({
      where: { id: promotionId },
      select: {
        id: true,
        titulo: true,
        slug: true,
        descripcion: true,
        imagenUrl: true,
        tipo: true,
        descuento: true,
        codigo: true,
        vigenciaDesde: true,
        vigenciaHasta: true,
        viewCount: true,
        shareCount: true,
        tags: true,
        isFeatured: true,
        createdAt: true,
        company: {
          select: {
            id: true,
            name: true,
            slug: true,
            logoUrl: true,
            isPublished: true,
            isActive: true,
          },
        },
        activo: true,
      },
    })

    if (!promotion || !promotion.activo || !promotion.company) return null
    if (!promotion.company.isPublished || !promotion.company.isActive) return null
    if (promotion.vigenciaHasta && promotion.vigenciaHasta < now) return null

    const { activo, ...rest } = promotion
    // No exponer flags internos de la empresa en el payload público.
    const { isPublished: _p, isActive: _a, ...company } = rest.company
    return { ...rest, company } as PromotionPublic
  } catch (error) {
    console.error('[getPromotionDetail] Error:', error)
    return null
  }
}

export async function getCategoriesPublic(): Promise<CategoryPublic[]> {
  try {
    const categories = await prisma.businessCategory.findMany({
      where: { active: true },
      select: {
        id: true,
        name: true,
        slug: true,
        icon: true,
        description: true,
        order: true,
        _count: {
          select: {
            companies: {
              where: {
                company: { isPublished: true, isActive: true },
              },
            },
          },
        },
      },
      orderBy: { order: 'asc' },
    })

    return categories.map((c) => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      icon: c.icon,
      description: c.description,
      order: c.order,
      companyCount: c._count.companies,
    })) as CategoryPublic[]
  } catch (error) {
    console.error('[getCategoriesPublic] Error:', error)
    return []
  }
}

export async function getCompanyStats(companySlug: string): Promise<CompanyStats | null> {
  if (!companySlug) return null

  try {
    const company = await prisma.company.findUnique({
      where: { slug: companySlug },
      select: {
        totalMembersCount: true,
        activePromotionsCount: true,
        averageRating: true,
        ratings: {
          select: { id: true },
        },
      },
    })

    if (!company) return null

    return {
      totalMembers: company.totalMembersCount,
      activePromotions: company.activePromotionsCount,
      averageRating: company.averageRating ? Number(company.averageRating) : null,
      totalRatings: company.ratings.length,
    }
  } catch (error) {
    console.error('[getCompanyStats] Error:', error)
    return null
  }
}

export async function getRecentCompanies(limit: number = 6): Promise<CompanyPublic[]> {
  return getCompaniesPublic({
    featured: false,
    limit,
    offset: 0,
  })
}

export async function getFeaturedCompanies(limit: number = 6): Promise<CompanyPublic[]> {
  return getCompaniesPublic({
    featured: true,
    limit,
    offset: 0,
  })
}
