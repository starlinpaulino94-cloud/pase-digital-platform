import Link from 'next/link'
import {
  MessageCircle,
  Mail,
  HelpCircle,
  Clock,
  Ticket as TicketIcon,
  ChevronRight,
} from 'lucide-react'
import { requireRole } from '@/lib/auth/guards'
import { prisma } from '@/lib/prisma'
import { getFaqs, listTicketsCliente } from '@/modules/soporte/queries'
import { renderPlantilla, buildWaLink, horarioLegible, estadoLabel, estadoBadgeClass } from '@/lib/soporte'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { ReportarProblemaForm } from '@/components/cliente/ReportarProblemaForm'

export const dynamic = 'force-dynamic'

export default async function AyudaPage() {
  const user = await requireRole('CLIENTE')
  const companyId = user.metadata.companyId
  const clienteId = user.metadata.clienteId

  const [config, cliente, faqs, tickets] = await Promise.all([
    companyId ? prisma.whatsAppConfig.findUnique({ where: { companyId } }) : null,
    clienteId
      ? prisma.cliente.findUnique({
          where: { id: clienteId },
          include: { company: { select: { name: true } } },
        })
      : null,
    getFaqs(companyId ?? null, { activeOnly: true }),
    clienteId ? listTicketsCliente(clienteId) : [],
  ])

  const empresaNombre = cliente?.company.name ?? 'la empresa'
  const mensajeWa = config
    ? renderPlantilla(config.mensajePlantilla, {
        cliente: cliente?.nombre,
        empresa: empresaNombre,
      })
    : ''
  const waLink = config ? buildWaLink(config.codigoPais, config.numero, mensajeWa) : null
  const horario = horarioLegible(config?.horaInicio, config?.horaCierre, config?.diasLaborales)
  const mailto = config?.correoSoporte
    ? `mailto:${config.correoSoporte}?subject=${encodeURIComponent('Soporte · ' + empresaNombre)}`
    : null

  return (
    <div className="space-y-6 animate-fade-up">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Centro de Ayuda</h1>
        <p className="text-sm text-muted-foreground">
          Contáctanos o encuentra respuestas rápidas · {empresaNombre}
        </p>
      </div>

      {/* Contacto rápido */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardContent className="flex flex-col gap-3 pt-6">
            <div className="flex items-center gap-2">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600">
                <MessageCircle className="h-5 w-5" />
              </span>
              <div>
                <p className="font-semibold text-foreground">WhatsApp</p>
                <p className="text-xs text-muted-foreground">Respuesta rápida por chat</p>
              </div>
            </div>
            {config?.activo && waLink ? (
              <a href={waLink} target="_blank" rel="noopener noreferrer">
                <Button className="w-full bg-emerald-600 hover:bg-emerald-500">
                  <MessageCircle className="mr-2 h-4 w-4" /> Contactar por WhatsApp
                </Button>
              </a>
            ) : (
              <p className="text-sm text-muted-foreground">
                El contacto por WhatsApp no está disponible por ahora.
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex flex-col gap-3 pt-6">
            <div className="flex items-center gap-2">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-100 text-sky-600">
                <Mail className="h-5 w-5" />
              </span>
              <div>
                <p className="font-semibold text-foreground">Correo</p>
                <p className="text-xs text-muted-foreground">Escríbenos por email</p>
              </div>
            </div>
            {mailto ? (
              <a href={mailto}>
                <Button variant="outline" className="w-full">
                  <Mail className="mr-2 h-4 w-4" /> Enviar correo
                </Button>
              </a>
            ) : (
              <p className="text-sm text-muted-foreground">
                Aún no hay un correo de soporte configurado.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {horario && (
        <div className="flex items-center gap-2 rounded-lg bg-muted/50 px-4 py-3 text-sm">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <span className="text-muted-foreground">Horario de atención:</span>
          <span className="font-medium text-foreground">{horario}</span>
        </div>
      )}

      {/* FAQ */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <HelpCircle className="h-4 w-4" /> Preguntas frecuentes
          </CardTitle>
        </CardHeader>
        <CardContent>
          {faqs.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Aún no hay preguntas frecuentes publicadas.
            </p>
          ) : (
            <Accordion type="single" collapsible className="w-full">
              {faqs.map((f) => (
                <AccordionItem key={f.id} value={f.id}>
                  <AccordionTrigger className="text-left">{f.pregunta}</AccordionTrigger>
                  <AccordionContent className="whitespace-pre-wrap text-muted-foreground">
                    {f.respuesta}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          )}
        </CardContent>
      </Card>

      {/* Reportar un problema */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Reportar un problema</CardTitle>
        </CardHeader>
        <CardContent>
          <ReportarProblemaForm />
        </CardContent>
      </Card>

      {/* Mis tickets */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <TicketIcon className="h-4 w-4" /> Mis reportes
          </CardTitle>
        </CardHeader>
        <CardContent>
          {tickets.length === 0 ? (
            <EmptyState
              icon={<TicketIcon className="h-6 w-6" />}
              title="Sin reportes"
              description="Cuando envíes un reporte, aparecerá aquí con su estado."
            />
          ) : (
            <div className="space-y-2">
              {tickets.map((t) => (
                <Link
                  key={t.id}
                  href={`/cliente/ayuda/${t.id}`}
                  className="flex items-center gap-3 rounded-lg border border-border/60 px-4 py-3 transition hover:bg-muted/50"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-foreground">{t.asunto}</p>
                    <p className="text-xs text-muted-foreground">
                      {t._count.mensajes} mensaje{t._count.mensajes !== 1 ? 's' : ''}
                    </p>
                  </div>
                  <Badge className={estadoBadgeClass(t.estado)}>{estadoLabel(t.estado)}</Badge>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
