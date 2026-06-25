"use client";
import { useEffect, useState } from "react";
import { useStore, fmtMonto, fmtFecha, fmtFechaHora, type AppSection } from "../store";
import { api, type Cliente, type Transaccion, type Estrategia } from "../api-client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { QrDisplay } from "../QrComponents";
import { SectionHeader, EstadoBadge, TipoEstrategiaBadge, EmptyState } from "../shared";
import {
  QrCode,
  Building2,
  Calendar,
  Coins,
  Gift,
  History,
  Plus,
  Sparkles,
  Clock,
  TrendingUp,
  Check,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { ClienteEstrategia } from "../api-client";

export function ClientePanel({ section }: { section: AppSection }) {
  const { user, showToast, setView } = useStore();
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  function load() {
    setLoading(true);
    api
      .get<{ clientes: Cliente[] }>("/api/clientes")
      .then((r) => {
        setClientes(r.clientes);
        if (!selectedId && r.clientes.length) setSelectedId(r.clientes[0].id);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(load, []);

  if (section === "historial") return <ClienteHistorial />;
  if (section === "mis-empresas")
    return (
      <MisEmpresas
        clientes={clientes}
        loading={loading}
        onSelect={(id) => {
          setSelectedId(id);
          useStore.getState().setSection("mi-qr");
        }}
        onRegister={() => setView("register")}
      />
    );

  /* ── Mi QR ── */
  const selected = clientes.find((c) => c.id === selectedId) || clientes[0];

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <div className="h-8 w-8 rounded-full border-2 border-border border-t-foreground animate-spin" />
        <p className="text-sm text-muted-foreground">Cargando tu Pase...</p>
      </div>
    );
  }

  if (!selected) {
    return (
      <div>
        <SectionHeader
          title="Mi Pase QR"
          description="Aún no estás registrado en ningún establecimiento"
        />
        <EmptyState
          title="No tienes Pases activos"
          description="Regístrate en un establecimiento para obtener tu Pase QR y acceder a beneficios exclusivos."
          icon={<QrCode className="h-8 w-8" />}
          action={
            <Button
              onClick={() => setView("register")}
              className="gap-2"
              style={{ background: "oklch(0.13 0.02 265)", color: "oklch(0.992 0.004 80)" }}
            >
              <Plus className="h-4 w-4" /> Activar un Pase
            </Button>
          }
        />
      </div>
    );
  }

  const qr = selected.qrTokens?.[0];
  const estrategiasActivas = selected.estrategias?.filter((e) => e.estado === "ACTIVA") || [];
  const estrategiaPrincipal = estrategiasActivas[0];

  return (
    <div>
      <SectionHeader
        title="Mi Pase QR"
        description="Presenta este código en el establecimiento para acceder a tus beneficios"
      />

      {/* Empresa tabs (si tiene más de 1) */}
      {clientes.length > 1 && (
        <div className="mb-6 flex gap-2 overflow-x-auto pb-1">
          {clientes.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelectedId(c.id)}
              className={cn(
                "flex shrink-0 items-center gap-2 rounded-xl border px-3.5 py-2 text-sm font-medium transition-all duration-150",
                selectedId === c.id
                  ? "border-foreground bg-foreground text-background"
                  : "border-border bg-card hover:border-foreground/30"
              )}
            >
              {selectedId === c.id && <Check className="h-3.5 w-3.5" />}
              {c.empresa?.nombre}
            </button>
          ))}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* QR card */}
        <Card className="overflow-hidden rounded-2xl p-0 gap-0">
          <div className="border-b border-border px-5 py-4 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div
                className="flex h-8 w-8 items-center justify-center rounded-lg"
                style={{ background: "oklch(0.93 0.04 80)", color: "oklch(0.48 0.11 78)" }}
              >
                <Building2 className="h-4 w-4" />
              </div>
              <p className="text-sm font-semibold text-foreground">{selected.empresa?.nombre}</p>
            </div>
            <EstadoBadge estado={selected.estado || "ACTIVA"} />
          </div>
          <div className="p-6 flex flex-col items-center">
            {qr ? (
              <QrDisplay
                token={qr.token}
                label="Pase Digital"
                empresaNombre={selected.empresa?.nombre}
                titularNombre={selected.nombre}
              />
            ) : (
              <p className="text-sm text-muted-foreground py-8">Sin QR asignado</p>
            )}

            {/* Dynamic fields */}
            {selected.camposDinamicos && selected.camposDinamicos.length > 0 && (
              <div className="mt-4 w-full rounded-xl border border-border bg-muted/30 p-3 space-y-1.5 text-sm">
                {selected.camposDinamicos.map((c) => (
                  <div key={c.id} className="flex items-center justify-between gap-2">
                    <span className="text-muted-foreground capitalize text-xs">{c.clave}</span>
                    <span className="font-medium text-foreground">{c.valor}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>

        {/* Beneficios */}
        <div className="space-y-4">
          {estrategiaPrincipal ? (
            <EstrategiaCard estrategia={estrategiaPrincipal} />
          ) : (
            <EmptyState
              icon={<Sparkles className="h-7 w-7" />}
              title="Sin beneficios activos"
              description="No tienes estrategias activas en este establecimiento."
            />
          )}

          {estrategiasActivas.length > 1 && (
            <Card className="overflow-hidden rounded-2xl p-0 gap-0">
              <div className="border-b border-border px-5 py-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Otros beneficios
                </p>
              </div>
              <div className="divide-y divide-border">
                {estrategiasActivas.slice(1).map((e) => (
                  <div key={e.id} className="flex items-center justify-between px-5 py-3 text-sm">
                    <span className="font-medium text-foreground">{e.estrategia.nombre}</span>
                    <TipoEstrategiaBadge tipo={e.estrategia.tipoEstrategia} />
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Estrategia card ─────────────────────────────────────── */
function EstrategiaCard({ estrategia: e }: { estrategia: ClienteEstrategia }) {
  return (
    <Card className="overflow-hidden rounded-2xl p-0 gap-0">
      {/* Top accent */}
      <div className="h-1 w-full" style={{ background: "oklch(0.74 0.115 78)" }} />

      <div className="border-b border-border px-5 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50">
            <Sparkles className="h-4 w-4 text-amber-600" />
          </div>
          <p className="text-sm font-semibold text-foreground">Beneficio activo</p>
        </div>
        <TipoEstrategiaBadge tipo={e.estrategia.tipoEstrategia} />
      </div>

      <div className="p-5 space-y-4">
        <div>
          <p className="font-bold text-foreground">{e.estrategia.nombre}</p>
          {e.estrategia.descripcion && (
            <p className="mt-1 text-sm text-muted-foreground">{e.estrategia.descripcion}</p>
          )}
        </div>

        {/* Tipo-specific metrics */}
        {e.estrategia.tipoEstrategia === "MEMBRESIA" && (
          <div className="grid grid-cols-2 gap-3">
            <MetricBox
              label="Usos disponibles"
              value={e.usosDisponibles}
              highlight="emerald"
            />
            <MetricBox label="Usos consumidos" value={e.usosConsumidos} />
          </div>
        )}

        {e.estrategia.tipoEstrategia === "CONTEO_VISITAS" && (
          <div className="rounded-xl border border-border bg-muted/30 p-4">
            <div className="flex items-center justify-between mb-2 text-sm">
              <span className="text-muted-foreground">Progreso hacia recompensa</span>
              <span className="font-bold text-foreground">
                {e.visitasAcumuladas}/{e.estrategia.metaVisitas}
              </span>
            </div>
            <div className="h-2.5 rounded-full bg-border overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${Math.min(100, (e.visitasAcumuladas / e.estrategia.metaVisitas) * 100)}%`,
                  background: "oklch(0.74 0.115 78)",
                }}
              />
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              {Math.max(0, e.estrategia.metaVisitas - e.visitasAcumuladas)} visitas más para tu
              recompensa
            </p>
          </div>
        )}

        {e.estrategia.tipoEstrategia === "PUNTOS" && (
          <div className="flex items-center justify-between rounded-xl border border-border bg-amber-50 p-4">
            <span className="text-sm font-medium text-amber-700">Puntos acumulados</span>
            <span className="flex items-center gap-1.5 text-2xl font-extrabold text-amber-700">
              <Coins className="h-5 w-5" />
              {e.puntosAcumulados.toFixed(0)}
            </span>
          </div>
        )}

        {e.estrategia.tipoEstrategia === "CUPON" && (
          <div className="flex items-center justify-between rounded-xl border border-border bg-pink-50 p-4">
            <span className="text-sm font-medium text-pink-700">Descuento disponible</span>
            <span className="text-2xl font-extrabold text-pink-700">
              {e.estrategia.descuentoPct}%
            </span>
          </div>
        )}

        {e.estrategia.tipoEstrategia === "PROMOCION_TIEMPO" && (
          <div className="flex items-center justify-between rounded-xl border border-border bg-emerald-50 p-4">
            <span className="text-sm font-medium text-emerald-700">Descuento vigente</span>
            <span className="text-2xl font-extrabold text-emerald-700">
              {e.estrategia.descuentoPct}%
            </span>
          </div>
        )}

        <div className="flex items-center justify-between border-t border-border pt-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5" />
            Vence {fmtFecha(e.fechaVencimiento)}
          </span>
          <EstadoBadge estado={e.estado} />
        </div>
      </div>
    </Card>
  );
}

function MetricBox({
  label,
  value,
  highlight,
}: {
  label: string;
  value: number;
  highlight?: "emerald" | "amber";
}) {
  return (
    <div className="rounded-xl border border-border bg-muted/30 p-3 text-center">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p
        className={cn(
          "mt-1 text-2xl font-extrabold tabular-nums",
          highlight === "emerald" && "text-emerald-600",
          highlight === "amber" && "text-amber-600",
          !highlight && "text-foreground"
        )}
      >
        {value}
      </p>
    </div>
  );
}

/* ─── Historial ───────────────────────────────────────────── */
function ClienteHistorial() {
  const { showToast } = useStore();
  const [transacciones, setTransacciones] = useState<Transaccion[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get<{ transacciones: Transaccion[] }>("/api/transacciones")
      .then((r) => setTransacciones(r.transacciones))
      .catch(() => showToast("Error al cargar historial", "error"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 gap-3">
        <div className="h-6 w-6 rounded-full border-2 border-border border-t-foreground animate-spin" />
        <p className="text-sm text-muted-foreground">Cargando historial...</p>
      </div>
    );
  }

  return (
    <div>
      <SectionHeader
        title="Mi historial"
        description="Registros de tus visitas y beneficios aplicados"
      />
      {transacciones.length === 0 ? (
        <EmptyState
          title="Sin consumos registrados"
          description="Tus próximas visitas aparecerán aquí."
          icon={<History className="h-8 w-8" />}
        />
      ) : (
        <Card className="overflow-hidden rounded-2xl p-0 gap-0">
          <div className="divide-y divide-border">
            {transacciones.map((t) => (
              <div key={t.id} className="flex items-start justify-between gap-3 px-5 py-4">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{t.tipoConsumo}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {t.empresa?.nombre || ""} · {fmtFechaHora(t.fechaTransaccion)}
                    </p>
                    {t.beneficioAplicado && (
                      <p className="mt-1 flex items-center gap-1 text-xs font-medium text-emerald-600">
                        <TrendingUp className="h-3 w-3" /> {t.beneficioAplicado}
                      </p>
                    )}
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  {t.montoConsumo > 0 && (
                    <p className="text-sm font-bold text-foreground tabular-nums">
                      {fmtMonto(t.montoConsumo)}
                    </p>
                  )}
                  {t.puntosGenerados > 0 && (
                    <p className="text-xs font-medium text-amber-600">
                      +{t.puntosGenerados} pts
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

/* ─── Mis empresas ────────────────────────────────────────── */
function MisEmpresas({
  clientes,
  loading,
  onSelect,
  onRegister,
}: {
  clientes: Cliente[];
  loading: boolean;
  onSelect: (id: string) => void;
  onRegister: () => void;
}) {
  return (
    <div>
      <SectionHeader
        title="Mis establecimientos"
        description="Establecimientos donde tienes un Pase Digital activo"
        action={
          <Button
            onClick={onRegister}
            size="sm"
            className="gap-1.5"
            style={{ background: "oklch(0.13 0.02 265)", color: "oklch(0.992 0.004 80)" }}
          >
            <Plus className="h-4 w-4" /> Activar nuevo Pase
          </Button>
        }
      />

      {loading ? (
        <div className="flex items-center justify-center py-16 gap-3">
          <div className="h-6 w-6 rounded-full border-2 border-border border-t-foreground animate-spin" />
          <p className="text-sm text-muted-foreground">Cargando...</p>
        </div>
      ) : clientes.length === 0 ? (
        <EmptyState
          title="No tienes Pases activos"
          description="Regístrate en un establecimiento para acceder a beneficios exclusivos."
          icon={<Building2 className="h-8 w-8" />}
          action={
            <Button
              onClick={onRegister}
              size="sm"
              className="gap-1.5"
              style={{ background: "oklch(0.13 0.02 265)", color: "oklch(0.992 0.004 80)" }}
            >
              <Plus className="h-4 w-4" /> Activar mi primer Pase
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {clientes.map((c) => {
            const color = c.empresa?.colorPrincipal || "#b45309";
            const activas = c.estrategias?.filter((e) => e.estado === "ACTIVA") || [];
            return (
              <button
                key={c.id}
                onClick={() => onSelect(c.id)}
                className="group text-left rounded-2xl border border-border bg-card shadow-sm transition-all duration-150 hover:-translate-y-0.5 hover:shadow-midnight overflow-hidden"
              >
                {/* Top stripe */}
                <div className="h-1 w-full" style={{ backgroundColor: color }} />

                <div className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-bold text-foreground">{c.empresa?.nombre}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {c.tipoNegocio?.nombre}
                        {c.empresa?.ciudad ? ` · ${c.empresa.ciudad}` : ""}
                      </p>
                    </div>
                    <EstadoBadge estado={c.estado || "ACTIVA"} />
                  </div>

                  {activas.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {activas.map((e) => (
                        <span
                          key={e.id}
                          className="inline-flex items-center rounded-full border border-border bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground"
                        >
                          {e.estrategia.nombre}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
                    <span>{activas.length} beneficio{activas.length !== 1 ? "s" : ""} activo{activas.length !== 1 ? "s" : ""}</span>
                    <span className="flex items-center gap-1 font-medium text-foreground group-hover:gap-1.5 transition-all">
                      Ver Pase <ChevronRight className="h-3.5 w-3.5" />
                    </span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
