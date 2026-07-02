import { MessagesSquare } from 'lucide-react'
import { requireRole } from '@/lib/auth/guards'
import {
  resolveCompanyContext,
  getComunicacionConfig,
  getFaqs,
} from '@/modules/soporte/queries'
import { PageHeader } from '@/components/ui/page-header'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { CompanySelector } from '@/components/admin/CompanySelector'
import { ComunicacionConfigForm } from '@/components/admin/ComunicacionConfigForm'
import { FaqManager } from '@/components/admin/FaqManager'
import { EmptyState } from '@/components/ui/empty-state'

export const dynamic = 'force-dynamic'

export default async function ComunicacionPage({
  searchParams,
}: {
  searchParams: Promise<{ company?: string }>
}) {
  const user = await requireRole(['ADMIN_EMPRESA', 'SUPERADMIN'])
  const sp = await searchParams
  const ctx = await resolveCompanyContext(user, sp.company)

  const [config, faqs] = await Promise.all([
    getComunicacionConfig(ctx.companyId),
    getFaqs(ctx.companyId),
  ])

  return (
    <div className="space-y-6">
      <PageHeader
        title="Comunicación y Soporte"
        description="Configura cómo tus clientes pueden contactarte y administra el Centro de Ayuda."
        action={
          ctx.isSuperadmin ? (
            <CompanySelector companies={ctx.companies} current={ctx.companyId} />
          ) : undefined
        }
      />

      {!ctx.companyId ? (
        <EmptyState
          icon={<MessagesSquare className="h-6 w-6" />}
          title="No hay empresa seleccionada"
          description="Crea o selecciona una empresa para configurar su comunicación y soporte."
        />
      ) : (
        <Tabs defaultValue="config" className="space-y-4">
          <TabsList>
            <TabsTrigger value="config">Configuración</TabsTrigger>
            <TabsTrigger value="faq">Preguntas frecuentes</TabsTrigger>
          </TabsList>

          <TabsContent value="config">
            <ComunicacionConfigForm
              companyId={ctx.companyId}
              existing={
                config
                  ? {
                      codigoPais: config.codigoPais,
                      numero: config.numero,
                      mensajePlantilla: config.mensajePlantilla,
                      activo: config.activo,
                      correoSoporte: config.correoSoporte,
                      horaInicio: config.horaInicio,
                      horaCierre: config.horaCierre,
                      diasLaborales: config.diasLaborales,
                    }
                  : undefined
              }
            />
          </TabsContent>

          <TabsContent value="faq">
            <FaqManager
              companyId={ctx.companyId}
              faqs={faqs.map((f) => ({
                id: f.id,
                pregunta: f.pregunta,
                respuesta: f.respuesta,
                orden: f.orden,
                activo: f.activo,
              }))}
            />
          </TabsContent>
        </Tabs>
      )}
    </div>
  )
}
