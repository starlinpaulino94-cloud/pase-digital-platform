/**
 * AutomationService: API interna de administración del Automation Engine
 * (Fase E1). CRUD del catálogo de automatizaciones (crear, editar, publicar,
 * pausar, archivar). La ejecución la hace AutomationEngine.
 */

import type { Automation } from '../domain/types'
import type {
  AutomationRepository,
  CreateAutomationData,
  UpdateAutomationData,
} from './ports'

export class AutomationService {
  constructor(private readonly repo: AutomationRepository) {}

  createAutomation(data: CreateAutomationData): Promise<Automation> {
    return this.repo.createAutomation(data)
  }
  updateAutomation(id: string, data: UpdateAutomationData): Promise<Automation> {
    return this.repo.updateAutomation(id, data)
  }
  getAutomation(id: string): Promise<Automation | null> {
    return this.repo.findAutomation(id)
  }
  listAutomations(
    companyId: string,
    filter?: Parameters<AutomationRepository['listAutomations']>[1],
  ): Promise<Automation[]> {
    return this.repo.listAutomations(companyId, filter)
  }
  publishAutomation(id: string): Promise<Automation> {
    return this.repo.updateAutomation(id, { status: 'PUBLISHED' })
  }
  pauseAutomation(id: string): Promise<Automation> {
    return this.repo.updateAutomation(id, { status: 'PAUSED' })
  }
  archiveAutomation(id: string): Promise<Automation> {
    return this.repo.updateAutomation(id, { status: 'ARCHIVED' })
  }
}
