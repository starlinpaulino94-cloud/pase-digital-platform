/**
 * Tipos de plantillas del Benefit Transformation Engine (Fase E1.7).
 */

import type { TransformationType, TransformationPolicyConfig } from '../domain/types'

export interface TransformationPolicyTemplate {
  readonly key: string
  readonly name: string
  readonly description: string
  readonly industry: string
  readonly type: TransformationType
  readonly config: TransformationPolicyConfig
  readonly tags?: readonly string[]
}
