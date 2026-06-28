// Schema enums (from DB)
export type PromotionType =
  | 'COUPON'
  | 'DISCOUNT'
  | 'PLAN'
  | 'MEMBERSHIP'
  | 'VISIT_BASED'
  | 'TEMPORARY_OFFER'
  | 'BUNDLE'
  | 'CASHBACK'
  | 'REFERRAL'

// ACTIVE = Published, CANCELLED = Archived
export type PromotionStatus = 'DRAFT' | 'ACTIVE' | 'PAUSED' | 'EXPIRED' | 'CANCELLED'

// Friendly UI aliases
export type PromotionStatusDisplay = 'Draft' | 'Published' | 'Paused' | 'Expired' | 'Archived'

export interface Promotion {
  id: string
  companyId: string
  name: string
  description?: string | null
  type: PromotionType
  status: PromotionStatus
  config: PromotionConfig
  maxUses?: number | null
  usedCount: number
  startsAt?: Date | string | null
  expiresAt?: Date | string | null
  createdById: string
  createdAt: Date | string
  updatedAt: Date | string
  company?: { id: string; name: string }
  createdBy?: { id: string; name: string | null }
  _count?: { assignments: number }
}

// ─── Per-type config shapes ───────────────────────────────────────────────────

export interface CouponConfig {
  code: string
  discountType: 'percentage' | 'fixed'
  discountValue: number
  minOrderAmount?: number
  singleUse?: boolean
}

export interface DiscountConfig {
  discountType: 'percentage' | 'fixed'
  discountValue: number
  appliesTo?: string // product / category / all
  minOrderAmount?: number
}

export interface PlanConfig {
  price: number
  currency: string
  billingPeriod: 'monthly' | 'quarterly' | 'annual'
  features: string[]
  maxMembers?: number
}

export interface MembershipConfig {
  price: number
  currency: string
  durationDays: number
  benefits: string[]
  autoRenew?: boolean
}

export interface VisitBasedConfig {
  visitsRequired: number
  reward: string // description of the reward
  rewardType?: 'discount' | 'free_item' | 'credit'
  rewardValue?: number
}

export interface TemporaryOfferConfig {
  discountType: 'percentage' | 'fixed'
  discountValue: number
  urgencyMessage?: string
}

export interface BundleConfig {
  items: Array<{ name: string; quantity: number }>
  bundlePrice: number
  currency: string
  savings?: number
}

export interface CashbackConfig {
  cashbackPercentage: number
  maxCashback?: number
  minPurchase?: number
  currency: string
}

export interface ReferralConfig {
  referrerReward: string
  referreeReward: string
  rewardType: 'discount' | 'credit' | 'free_item'
  rewardValue?: number
}

export type PromotionConfig =
  | CouponConfig
  | DiscountConfig
  | PlanConfig
  | MembershipConfig
  | VisitBasedConfig
  | TemporaryOfferConfig
  | BundleConfig
  | CashbackConfig
  | ReferralConfig
  | Record<string, unknown>
