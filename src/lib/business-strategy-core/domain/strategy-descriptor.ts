/**
 * Universal Strategy Descriptor Interface (Fase E3).
 *
 * Defines the standard metadata that ALL strategies (Promotion, Membership, Benefit, etc.)
 * must declare. This allows the Business Strategy Core to manage strategies uniformly
 * without hardcoding module-specific fields.
 *
 * Strategy types (PromotionStrategy, MembershipStrategy, etc.) EXTEND this interface
 * to add module-specific fields beyond the 20 required base fields.
 *
 * @example
 *   interface PromotionStrategy extends StrategyDescriptor {
 *     readonly category: PromotionStrategyCategory  // promotion-specific
 *     readonly enginesUsed: readonly EngineId[]      // promotion-specific
 *   }
 */

export interface StrategyDescriptor {
  /** Unique strategy ID, e.g. "carwash.promo.captacion". */
  readonly id: string

  /** Industry/vertical, e.g. "carwash". */
  readonly industry: string

  /** Human-readable strategy name. */
  readonly name: string

  /** One-line description of the strategy's purpose. */
  readonly description: string

  // ── Business diagnosis ──
  /** Objective this strategy solves (e.g. "acquire new customers"). */
  readonly objective: string

  /** Problem this strategy addresses. */
  readonly problemSolved: string

  /** Expected business result. */
  readonly expectedResult: string

  /** When to use this strategy. */
  readonly whenToUse: string

  /** When NOT to use this strategy (anti-patterns). */
  readonly whenNotToUse: string

  // ── Compatibility ──
  /** Recommended segments or audiences. */
  readonly recommendedSegment?: readonly string[]

  /** Recommended duration for this strategy. */
  readonly recommendedDuration?: string

  /** Recommended execution frequency. */
  readonly recommendedFrequency?: string

  /** Operational complexity: 'baja' | 'media' | 'alta'. */
  readonly complexity: 'baja' | 'media' | 'alta'

  // ── Integration with engines ──
  /** Engine IDs this strategy depends on or integrates with. */
  readonly enginesUsed?: readonly string[]

  /** Automation playbooks that work with this strategy. */
  readonly automationPlaybooks?: readonly string[]

  /** Compatible benefits/rewards. */
  readonly compatibleBenefits?: readonly string[]

  // ── Execution guidance ──
  /** KPIs to measure success. */
  readonly kpis: readonly string[]

  /** Best practices when implementing. */
  readonly bestPractices: readonly string[]

  /** Common mistakes to avoid. */
  readonly commonMistakes: readonly string[]

  /** Operational or compliance risks. */
  readonly risks: readonly string[]

  // ── Variants and versioning ──
  /** Template IDs (plantilla keys) that materialize this strategy. */
  readonly variantKeys: readonly string[]

  /** Semantic version of this strategy definition. */
  readonly version: string

  /** Technical notes, constraints, or implementation details. */
  readonly technicalNotes: string
}

/**
 * Validates that an object conforms to StrategyDescriptor contract.
 * Used to ensure strategies don't have empty required fields.
 */
export function validateStrategyDescriptor(strategy: Partial<StrategyDescriptor>): string[] {
  const errors: string[] = []
  const required: (keyof StrategyDescriptor)[] = [
    'id', 'industry', 'name', 'description',
    'objective', 'problemSolved', 'expectedResult',
    'whenToUse', 'whenNotToUse', 'complexity',
    'kpis', 'bestPractices', 'commonMistakes', 'risks',
    'variantKeys', 'version', 'technicalNotes',
  ]

  for (const field of required) {
    const value = strategy[field]
    if (!value || (Array.isArray(value) && value.length === 0)) {
      errors.push(`${String(field)}: required field is empty or missing`)
    }
  }

  return errors
}
