import { NextResponse, type NextRequest } from 'next/server'
import { ejecutarAutomatizacionesGlobal } from '@/modules/admin/automatizaciones'
import { mantenimientoRegalos } from '@/modules/regalos/mantenimiento'
import { recordatoriosSeguimientoAuto } from '@/modules/seguimiento/mantenimiento'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

/**
 * F4.7: endpoint de cron para ejecutar las automatizaciones de todas las
 * empresas (cumpleaños, por vencer, inactivos). Idempotente.
 * Regalos P2P · R4: además expira los regalos vencidos y recuerda al
 * destinatario los que expiran en menos de 24h.
 *
 * Protegido con CRON_SECRET: configura la variable en el entorno y llama
 * con `Authorization: Bearer <CRON_SECRET>` (Vercel Cron, GitHub Actions,
 * cron-job.org, etc.), idealmente una vez al día.
 */
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET
  if (!secret) {
    return NextResponse.json(
      { error: 'CRON_SECRET no configurado en el servidor.' },
      { status: 503 }
    )
  }

  const auth = request.headers.get('authorization')
  if (auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'No autorizado.' }, { status: 401 })
  }

  try {
    const resultados = await ejecutarAutomatizacionesGlobal()
    const totales = resultados.reduce(
      (acc, r) => ({
        cumpleanos: acc.cumpleanos + r.resultado.cumpleanos,
        porVencer: acc.porVencer + r.resultado.porVencer,
        inactivos: acc.inactivos + r.resultado.inactivos,
      }),
      { cumpleanos: 0, porVencer: 0, inactivos: 0 }
    )
    const regalos = await mantenimientoRegalos().catch((e) => {
      console.error('[cron-automatizaciones] regalos', e)
      return { expirados: 0, recordatorios: 0 }
    })
    // Seguimiento S3: recuerda a los clientes sus recompensas gratis por vencer.
    const seguimiento = await recordatoriosSeguimientoAuto().catch((e) => {
      console.error('[cron-automatizaciones] seguimiento', e)
      return { recordatorios: 0 }
    })
    return NextResponse.json({
      ok: true,
      empresas: resultados.length,
      totales,
      regalos,
      seguimiento,
    })
  } catch (e) {
    console.error('[cron-automatizaciones]', e)
    return NextResponse.json({ error: 'Error interno.' }, { status: 500 })
  }
}
