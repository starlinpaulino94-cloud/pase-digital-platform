/**
 * PrismaExecutionLogSink: adaptador del puerto ExecutionLogSink sobre Prisma.
 *
 * Persiste cada evaluación en `rule_execution_logs`. NO se usa por defecto en
 * Fase 1 (el motor arranca con NoopExecutionLogSink); se inyecta cuando se
 * quiera activar la observabilidad, sin tocar el núcleo. Nunca lanza: la
 * auditoría jamás debe romper el flujo que se está evaluando.
 */

import type { PrismaClient, Prisma } from '@prisma/client'
import type { ExecutionLogSink, RuleExecutionLogEntry } from '../application/ports'

export class PrismaExecutionLogSink implements ExecutionLogSink {
  constructor(private readonly db: PrismaClient) {}

  async record(entry: RuleExecutionLogEntry): Promise<void> {
    try {
      await this.db.ruleExecutionLog.create({
        data: {
          ruleId: entry.ruleId,
          companyId: entry.companyId,
          matched: entry.matched,
          resultado: entry.result as Prisma.InputJsonValue,
          contexto: entry.context as Prisma.InputJsonValue,
          duracionMs: entry.durationMs,
          error: entry.error ?? null,
        },
      })
    } catch (err) {
      console.error('[rule-engine] no se pudo registrar la auditoría:', err)
    }
  }
}
