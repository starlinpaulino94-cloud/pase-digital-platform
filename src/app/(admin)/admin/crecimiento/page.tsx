import { ADMIN_ROLES } from '@/types'
import { requireRole } from '@/lib/auth/guards'
import { companyFilter } from '@/modules/admin/queries'
import { getGrowthAdminData } from '@/modules/growth/queries'
import { GROWTH_DURACIONES } from '@/modules/growth/config'
import {
  guardarGrowthConfigAction,
  crearGrowthRuleAction,
  toggleGrowthRuleAction,
  eliminarGrowthRuleAction,
} from '@/modules/growth/actions'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Rocket, Trash2 } from 'lucide-react'

export const dynamic = 'force-dynamic'

const TRIGGER_LABEL: Record<string, string> = {
  LINK_ABIERTO: 'Abre el enlace',
  REGISTRO: 'Se registra',
  VERIFICADO: 'Verifica correo',
  MEMBRESIA: 'Adquiere membresía',
  COMPRA: 'Hace una compra',
  PRIMER_USO: 'Primer uso del beneficio',
  N_REFERIDOS: 'Alcanza N referidos',
}
const TIPO_LABEL: Record<string, string> = {
  PUNTOS: 'Puntos',
  CREDITOS: 'Créditos (RD$)',
  BENEFICIO: 'Beneficio Digital',
  LAVADOS_GRATIS: 'Lavados gratis',
  DESCUENTO_PORCENTAJE: 'Descuento %',
  DESCUENTO_MONTO: 'Descuento RD$',
}
const BENEF_LABEL: Record<string, string> = {
  REFERENTE: 'Quien invita',
  REFERIDO: 'El invitado',
  AMBOS: 'Ambos',
}

function Toggle({ name, checked, label }: { name: string; checked: boolean; label: string }) {
  return (
    <label className="flex items-center justify-between gap-3 rounded-lg border border-border px-3 py-2 text-sm">
      <span className="text-foreground">{label}</span>
      <span>
        <input type="hidden" name={name} value="off" />
        <input type="checkbox" name={name} value="on" defaultChecked={checked} className="h-4 w-4" />
      </span>
    </label>
  )
}

export default async function CrecimientoPage() {
  const user = await requireRole(ADMIN_ROLES)
  const companyId = companyFilter(user)

  if (!companyId) {
    return (
      <div className="space-y-2">
        <h1 className="text-2xl font-bold text-foreground">Crecimiento</h1>
        <p className="text-muted-foreground">
          Selecciona una empresa (vista de empresa) para configurar su programa de crecimiento.
        </p>
      </div>
    )
  }

  const { config, rules, promos, plans } = await getGrowthAdminData(companyId)

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Rocket className="h-6 w-6 text-primary" />
        <div>
          <h1 className="text-2xl font-bold text-foreground">Growth Engine</h1>
          <p className="text-muted-foreground">
            Configura qué premia tu programa de referidos y con qué recompensa.
          </p>
        </div>
      </div>

      {/* Configuración general */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Configuración del programa</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={guardarGrowthConfigAction} className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <Toggle name="landingActiva" checked={config.landingActiva} label="Mostrar landing antes del registro" />
              <label className="flex items-center justify-between gap-3 rounded-lg border border-border px-3 py-2 text-sm">
                <span className="text-foreground">Duración por defecto del enlace</span>
                <select
                  name="duracionHorasDefault"
                  defaultValue={config.duracionHorasDefault}
                  className="rounded-md border border-border bg-background px-2 py-1"
                >
                  {GROWTH_DURACIONES.map((d) => (
                    <option key={d.horas} value={d.horas}>
                      {d.label}
                    </option>
                  ))}
                </select>
              </label>
              <Toggle name="premiaClic" checked={config.premiaClic} label="Premiar apertura del enlace" />
              <Toggle name="premiaRegistro" checked={config.premiaRegistro} label="Premiar registro" />
              <Toggle name="premiaMembresia" checked={config.premiaMembresia} label="Premiar membresía" />
              <Toggle name="premiaCompra" checked={config.premiaCompra} label="Premiar compra" />
              <Toggle name="premiaRenovacion" checked={config.premiaRenovacion} label="Premiar renovación" />
            </div>
            <Button type="submit">Guardar configuración</Button>
          </form>
        </CardContent>
      </Card>

      {/* Reglas de recompensa */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Reglas de recompensa</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {rules.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Aún no hay reglas. Crea la primera abajo (ej. «Se registra → 50 puntos»).
            </p>
          ) : (
            <div className="divide-y divide-border/60">
              {rules.map((r) => (
                <div key={r.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                  <div className="min-w-0">
                    <p className="font-medium text-foreground">{r.nombre}</p>
                    <p className="text-xs text-muted-foreground">
                      {TRIGGER_LABEL[r.trigger] ?? r.trigger}
                      {r.trigger === 'N_REFERIDOS' ? ` (${r.valorCondicion})` : ''} →{' '}
                      {r.recompensaTipo === 'BENEFICIO'
                        ? r.recompensaPromocion ?? 'Beneficio'
                        : `${r.recompensaValor} · ${TIPO_LABEL[r.recompensaTipo]}`}{' '}
                      · para {BENEF_LABEL[r.beneficiario]}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={r.activo ? 'default' : 'secondary'}>{r.activo ? 'Activa' : 'Pausada'}</Badge>
                    <form action={toggleGrowthRuleAction}>
                      <input type="hidden" name="id" value={r.id} />
                      <Button type="submit" size="sm" variant="ghost">
                        {r.activo ? 'Pausar' : 'Activar'}
                      </Button>
                    </form>
                    <form action={eliminarGrowthRuleAction}>
                      <input type="hidden" name="id" value={r.id} />
                      <Button type="submit" size="icon" variant="ghost" aria-label="Eliminar">
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </form>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Nueva regla */}
          <form action={crearGrowthRuleAction} className="grid gap-3 rounded-xl border border-border p-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Nombre de la regla</label>
              <input name="nombre" required placeholder="Ej. Bono por registro" className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Cuando el invitado…</label>
              <select name="trigger" className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm">
                {Object.entries(TRIGGER_LABEL).map(([v, l]) => (
                  <option key={v} value={v}>{l}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Umbral (solo N referidos)</label>
              <input name="valorCondicion" type="number" min={1} defaultValue={1} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Recompensa</label>
              <select name="recompensaTipo" className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm">
                {Object.entries(TIPO_LABEL).map(([v, l]) => (
                  <option key={v} value={v}>{l}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Valor (puntos / RD$ / %)</label>
              <input name="recompensaValor" type="number" step="0.01" min={0} defaultValue={0} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Beneficio Digital (si aplica)</label>
              <select name="recompensaPromocionId" className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" defaultValue="">
                <option value="">—</option>
                {promos.map((p) => (
                  <option key={p.id} value={p.id}>{p.titulo}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Solo si compró el plan (opcional)</label>
              <select name="planId" className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" defaultValue="">
                <option value="">Cualquiera</option>
                {plans.map((p) => (
                  <option key={p.id} value={p.id}>{p.nombre}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Recompensar a</label>
              <select name="beneficiario" className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm">
                {Object.entries(BENEF_LABEL).map(([v, l]) => (
                  <option key={v} value={v}>{l}</option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-2">
              <Button type="submit">Crear regla</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
