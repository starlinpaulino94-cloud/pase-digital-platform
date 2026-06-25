"use client";
import { useEffect, useState } from "react";
import { useStore, fmtMonto, fmtFecha, fmtFechaHora, type ClienteSection } from "./store";
import { api, type Cliente, type Transaccion } from "./api-client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { QrDisplay } from "./QrComponents";
import { SectionHeader, EstadoBadge, EmptyState } from "./shared";
import {
  Building2,
  Calendar,
  Coins,
  Gift,
  History,
  Plus,
  Sparkles,
  CheckCircle2,
  LogOut,
  Menu,
  X,
  Wallet,
  UserCircle,
  MapPin,
  Clock,
  Tag,
  Star,
  Crown,
  KeyRound,
  ChevronRight,
  TrendingUp,
  QrCode,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { TIPOS_BENEFICIO } from "@/lib/constants";

type NavItem = { section: ClienteSection; label: string; icon: React.ReactNode; color: string };

const NAV: NavItem[] = [
  { section: "mi-qr",          label: "Mi Pase",             icon: <KeyRound className="h-4 w-4" />, color: "#c9a84c" },
  { section: "mis-empresas",   label: "Mis establecimientos", icon: <Wallet className="h-4 w-4" />,  color: "#10b981" },
  { section: "historial",      label: "Mi actividad",         icon: <History className="h-4 w-4" />, color: "#6366f1" },
];

type TransaccionConEmpresa = Transaccion & {
  empresa?: { id: string; nombre: string; colorPrincipal: string | null; ciudad: string | null } | null;
};

function tipoBeneficioLabel(tipo: string): string {
  return TIPOS_BENEFICIO.find((t) => t.value === tipo)?.label || tipo;
}

export function ClienteShell() {
  const { user, clienteSection, setClienteSection, logout, showToast, navigate } = useStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (!user) return null;

  const sidebarContent = (
    <>
      {/* Logo */}
      <div className="flex h-16 shrink-0 items-center gap-3 border-b border-white/6 px-4">
        <div
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
          style={{ background: "oklch(0.74 0.115 78)" }}
        >
          <KeyRound className="h-4 w-4 text-[#111118]" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-bold tracking-wide text-white leading-none">PASE DIGITAL</p>
          <p className="mt-0.5 text-[9px] tracking-[0.15em] uppercase text-white/30 leading-none">
            Acceso Exclusivo
          </p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto p-2 space-y-0.5">
        {NAV.map((item) => {
          const active = clienteSection === item.section;
          return (
            <button
              key={item.section}
              onClick={() => {
                setClienteSection(item.section);
                setSidebarOpen(false);
              }}
              className={cn(
                "group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150",
                active ? "text-white" : "text-white/45 hover:text-white/80 hover:bg-white/5"
              )}
              style={
                active
                  ? {
                      background:
                        "linear-gradient(135deg, rgba(201,168,76,0.18) 0%, rgba(201,168,76,0.08) 100%)",
                      borderLeft: "2px solid oklch(0.74 0.115 78)",
                      paddingLeft: "calc(0.75rem - 2px)",
                    }
                  : {}
              }
            >
              <span
                className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md transition-all"
                style={
                  active
                    ? { backgroundColor: item.color + "28", color: item.color }
                    : { color: "rgba(255,255,255,0.35)" }
                }
              >
                {item.icon}
              </span>
              <span className="flex-1 text-left leading-none">{item.label}</span>
              {active && (
                <ChevronRight className="h-3 w-3 opacity-50 shrink-0" style={{ color: "oklch(0.74 0.115 78)" }} />
              )}
            </button>
          );
        })}
      </nav>

      {/* User + logout */}
      <div className="shrink-0 border-t border-white/6 p-3">
        <div className="flex items-center gap-2.5 rounded-lg p-2 hover:bg-white/5 transition-colors cursor-default">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/10 text-white/70 text-[10px] font-bold uppercase">
            {user.nombre.charAt(0)}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-medium text-white/80 leading-none">{user.nombre}</p>
            <p className="truncate text-[10px] text-white/35 mt-0.5 leading-none">{user.email}</p>
          </div>
          <button
            onClick={() => { logout(); showToast("Sesión cerrada", "info"); }}
            className="shrink-0 rounded p-1 text-white/30 hover:text-white/70 hover:bg-white/10 transition-colors"
            aria-label="Cerrar sesión"
          >
            <LogOut className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </>
  );

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* ── Header ── */}
      <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center border-b border-border bg-background/95 glass">
        <div className="flex w-full items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <button
              className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors lg:hidden"
              onClick={() => setSidebarOpen(true)}
              aria-label="Abrir menú"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="hidden sm:flex items-center gap-1.5 text-sm font-semibold text-foreground">
              <span>{NAV.find((n) => n.section === clienteSection)?.label || "Mi Pase"}</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2.5">
              <div className="text-right">
                <p className="text-sm font-medium leading-none text-foreground">{user.nombre}</p>
                <p className="mt-0.5 text-[11px] leading-none text-muted-foreground">{user.email}</p>
              </div>
            </div>
            <span className="inline-flex items-center gap-1 rounded-full border border-border bg-muted/50 px-2.5 py-1 text-[11px] font-semibold text-muted-foreground">
              <Crown className="h-3 w-3" style={{ color: "oklch(0.74 0.115 78)" }} />
              Titular
            </span>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => { logout(); showToast("Sesión cerrada", "info"); }}
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
              aria-label="Cerrar sesión"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* ── Sidebar desktop ── */}
        <aside
          className="hidden w-60 shrink-0 flex-col lg:flex"
          style={{ background: "oklch(0.115 0.022 265)" }}
        >
          {sidebarContent}
        </aside>

        {/* ── Sidebar mobile ── */}
        {sidebarOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div
              className="absolute inset-0 bg-black/60 glass"
              onClick={() => setSidebarOpen(false)}
            />
            <aside
              className="absolute left-0 top-0 flex h-full w-64 flex-col"
              style={{ background: "oklch(0.115 0.022 265)" }}
            >
              <div className="flex items-center justify-between border-b border-white/6 px-4 h-16">
                <div className="flex items-center gap-2.5">
                  <div
                    className="flex h-7 w-7 items-center justify-center rounded-lg"
                    style={{ background: "oklch(0.74 0.115 78)" }}
                  >
                    <KeyRound className="h-3.5 w-3.5 text-[#111118]" />
                  </div>
                  <span className="text-sm font-bold text-white tracking-wide">PASE DIGITAL</span>
                </div>
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="rounded-lg p-1.5 text-white/40 hover:text-white/80 hover:bg-white/5 transition-colors"
                  aria-label="Cerrar menú"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              {sidebarContent}
            </aside>
          </div>
        )}

        {/* ── Main ── */}
        <main className="flex-1 overflow-auto min-w-0">
          <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-8">
            {clienteSection === "mi-qr" && <MiPaseView onRegister={() => navigate("registro")} />}
            {clienteSection === "mis-empresas" && (
              <MisEstablecimientosView
                onRegister={() => navigate("registro")}
                onSelect={() => setClienteSection("mi-qr")}
              />
            )}
            {clienteSection === "historial" && <MiActividadView />}
          </div>
        </main>
      </div>
    </div>
  );
}

/* ─── Mi Pase View ────────────────────────────────────────── */
function MiPaseView({ onRegister }: { onRegister: () => void }) {
  const { showToast, selectedClienteId } = useStore();
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get<{ clientes: Cliente[] }>("/api/clientes")
      .then((r) => {
        setClientes(r.clientes || []);
        const initId = selectedClienteId || (r.clientes && r.clientes.length > 0 ? r.clientes[0].id : null);
        if (initId) setSelectedId(initId);
      })
      .catch(() => showToast("Error al cargar tu Pase", "error"))
      .finally(() => setLoading(false));
  }, [showToast, selectedClienteId]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <div className="h-8 w-8 rounded-full border-2 border-border border-t-foreground animate-spin" />
        <p className="text-sm text-muted-foreground">Cargando tu Pase...</p>
      </div>
    );
  }

  if (clientes.length === 0) {
    return (
      <div>
        <SectionHeader title="Tu Pase Digital" description="Aún no tienes un Pase activo" />
        <EmptyState
          title="Activa tu primer Pase Digital"
          description="Regístrate en un establecimiento para obtener tu Pase y acceder a promociones exclusivas."
          icon={<QrCode className="h-8 w-8" />}
          action={
            <Button
              onClick={onRegister}
              className="gap-2"
              style={{ background: "oklch(0.13 0.02 265)", color: "oklch(0.992 0.004 80)" }}
            >
              <Plus className="h-4 w-4" /> Activar mi Pase
            </Button>
          }
        />
      </div>
    );
  }

  const selected = clientes.find((c) => c.id === selectedId) || clientes[0];
  const qr = selected.qrTokens?.[0];
  const estrategiasActivas = selected.estrategias?.filter((e) => e.estado === "ACTIVA") || [];
  const promocionPrincipal = estrategiasActivas[0];
  const colorEmpresa = selected.empresa?.colorPrincipal || "#b45309";

  return (
    <div>
      <SectionHeader
        title="Tu Pase Digital"
        description="Presenta este Pase en el establecimiento para acceder a tus promociones"
      />

      {/* Empresa selector */}
      {clientes.length > 1 && (
        <div className="mb-6 flex gap-2 overflow-x-auto pb-1">
          {clientes.map((c) => {
            const color = c.empresa?.colorPrincipal || "#b45309";
            const selected2 = selectedId === c.id;
            return (
              <button
                key={c.id}
                onClick={() => setSelectedId(c.id)}
                className={cn(
                  "flex shrink-0 items-center gap-2 rounded-xl border px-3.5 py-2 text-sm font-medium transition-all duration-150",
                  selected2
                    ? "border-foreground bg-foreground text-background"
                    : "border-border bg-card hover:border-foreground/30"
                )}
              >
                {c.empresa?.nombre}
              </button>
            );
          })}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* QR Card */}
        <Card className="overflow-hidden rounded-2xl p-0 gap-0">
          <div className="border-b border-border px-5 py-4 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div
                className="flex h-8 w-8 items-center justify-center rounded-lg"
                style={{ backgroundColor: colorEmpresa + "20", color: colorEmpresa }}
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
                label={`Pase Digital · ${selected.empresa?.nombre || ""}`}
                empresaNombre={selected.empresa?.nombre}
                titularNombre={selected.nombre}
              />
            ) : (
              <p className="py-8 text-sm text-muted-foreground">
                Tu Pase Digital aún no está asignado
              </p>
            )}
            {selected.camposDinamicos && selected.camposDinamicos.length > 0 && (
              <div className="mt-4 w-full rounded-xl border border-border bg-muted/30 p-3 space-y-1.5">
                {selected.camposDinamicos.map((c) => (
                  <div key={c.id} className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground text-xs capitalize">{c.clave}</span>
                    <span className="font-medium text-foreground">{c.valor}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>

        {/* Beneficios */}
        <div className="space-y-4">
          {promocionPrincipal ? (
            <Card className="overflow-hidden rounded-2xl p-0 gap-0">
              <div className="h-1 w-full" style={{ backgroundColor: colorEmpresa }} />
              <div className="border-b border-border px-5 py-4 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50">
                    <Sparkles className="h-4 w-4 text-amber-600" />
                  </div>
                  <p className="text-sm font-semibold text-foreground">Promoción activa</p>
                </div>
                <Badge variant="outline" className="text-[11px]">
                  {tipoBeneficioLabel(promocionPrincipal.estrategia.tipoEstrategia)}
                </Badge>
              </div>
              <div className="p-5 space-y-4">
                <div>
                  <p className="font-bold text-foreground">{promocionPrincipal.estrategia.nombre}</p>
                  {promocionPrincipal.estrategia.descripcion && (
                    <p className="mt-1 text-sm text-muted-foreground">
                      {promocionPrincipal.estrategia.descripcion}
                    </p>
                  )}
                </div>

                {/* Tipo-specific metrics */}
                {promocionPrincipal.estrategia.tipoEstrategia === "MEMBRESIA" && (
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-xl border border-border bg-muted/30 p-3 text-center">
                      <p className="text-xs text-muted-foreground">Usos disponibles</p>
                      <p className="mt-1 text-2xl font-extrabold text-emerald-600 tabular-nums">
                        {promocionPrincipal.usosDisponibles}
                      </p>
                      <p className="mt-0.5 text-[11px] text-muted-foreground">disponibles</p>
                    </div>
                    <div className="rounded-xl border border-border bg-muted/30 p-3 text-center">
                      <p className="text-xs text-muted-foreground">Usos disfrutados</p>
                      <p className="mt-1 text-2xl font-extrabold text-foreground tabular-nums">
                        {promocionPrincipal.usosConsumidos}
                      </p>
                    </div>
                  </div>
                )}

                {promocionPrincipal.estrategia.tipoEstrategia === "CONTEO_VISITAS" && (
                  <div className="rounded-xl border border-border bg-muted/30 p-4">
                    <div className="mb-2 flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Progreso hacia recompensa</span>
                      <span className="font-bold text-foreground tabular-nums">
                        {promocionPrincipal.visitasAcumuladas}/{promocionPrincipal.estrategia.metaVisitas}
                      </span>
                    </div>
                    <div className="h-2.5 overflow-hidden rounded-full bg-border">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{
                          backgroundColor: colorEmpresa,
                          width: `${Math.min(100, (promocionPrincipal.visitasAcumuladas / (promocionPrincipal.estrategia.metaVisitas || 1)) * 100)}%`,
                        }}
                      />
                    </div>
                    <p className="mt-2 text-xs text-muted-foreground">
                      {Math.max(0, promocionPrincipal.estrategia.metaVisitas - promocionPrincipal.visitasAcumuladas)} visitas más para tu recompensa
                    </p>
                  </div>
                )}

                {promocionPrincipal.estrategia.tipoEstrategia === "CUPON" && (
                  <div className="flex items-center justify-between rounded-xl border border-border bg-pink-50 p-4">
                    <span className="text-sm font-medium text-pink-700">Descuento disponible</span>
                    <span className="text-2xl font-extrabold text-pink-700">
                      {promocionPrincipal.estrategia.descuentoPct}%
                    </span>
                  </div>
                )}

                {promocionPrincipal.estrategia.tipoEstrategia === "PUNTOS" && (
                  <div className="flex items-center justify-between rounded-xl border border-border bg-amber-50 p-4">
                    <span className="text-sm font-medium text-amber-700">Puntos acumulados</span>
                    <span className="flex items-center gap-1.5 text-2xl font-extrabold text-amber-700">
                      <Coins className="h-5 w-5" />
                      {promocionPrincipal.puntosAcumulados.toFixed(0)}
                    </span>
                  </div>
                )}

                {promocionPrincipal.fechaVencimiento && (
                  <div className="flex items-center justify-between border-t border-border pt-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5" />
                      Vence {fmtFecha(promocionPrincipal.fechaVencimiento)}
                    </span>
                    <EstadoBadge estado={promocionPrincipal.estado} />
                  </div>
                )}
              </div>
            </Card>
          ) : (
            <EmptyState
              icon={<Sparkles className="h-7 w-7" />}
              title="Sin promociones activas"
              description="No tienes promociones activas en este establecimiento."
            />
          )}

          {estrategiasActivas.length > 1 && (
            <Card className="overflow-hidden rounded-2xl p-0 gap-0">
              <div className="border-b border-border px-5 py-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Otras promociones
                </p>
              </div>
              <div className="divide-y divide-border">
                {estrategiasActivas.slice(1).map((e) => (
                  <div key={e.id} className="flex items-center justify-between px-5 py-3 text-sm">
                    <span className="font-medium text-foreground">{e.estrategia.nombre}</span>
                    <Badge variant="outline" className="text-[11px]">
                      {tipoBeneficioLabel(e.estrategia.tipoEstrategia)}
                    </Badge>
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

/* ─── Mis Establecimientos ────────────────────────────────── */
function MisEstablecimientosView({
  onRegister,
  onSelect,
}: {
  onRegister: () => void;
  onSelect: () => void;
}) {
  const { showToast, setSelectedClienteId } = useStore();
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get<{ clientes: Cliente[] }>("/api/clientes")
      .then((r) => setClientes(r.clientes || []))
      .catch(() => showToast("Error al cargar tus establecimientos", "error"))
      .finally(() => setLoading(false));
  }, [showToast]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 gap-3">
        <div className="h-6 w-6 rounded-full border-2 border-border border-t-foreground animate-spin" />
        <p className="text-sm text-muted-foreground">Cargando...</p>
      </div>
    );
  }

  return (
    <div>
      <SectionHeader
        title="Mis establecimientos"
        description="Lugares donde tienes tu Pase Digital activo"
        action={
          <Button
            onClick={onRegister}
            size="sm"
            className="gap-1.5"
            style={{ background: "oklch(0.13 0.02 265)", color: "oklch(0.992 0.004 80)" }}
          >
            <Plus className="h-4 w-4" /> Activar otro Pase
          </Button>
        }
      />

      {clientes.length === 0 ? (
        <EmptyState
          title="Aún no tienes tu Pase Digital"
          description="Regístrate en un establecimiento para activar tu Pase y aprovechar promociones exclusivas."
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
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {clientes.map((c) => {
            const color = c.empresa?.colorPrincipal || "#b45309";
            const promocionesActivas = c.estrategias?.filter((e) => e.estado === "ACTIVA") || [];
            return (
              <button
                key={c.id}
                onClick={() => {
                  setSelectedClienteId(c.id);
                  onSelect();
                }}
                className="group text-left rounded-2xl border border-border bg-card shadow-sm transition-all duration-150 hover:-translate-y-0.5 hover:shadow-midnight overflow-hidden"
              >
                <div className="h-1 w-full" style={{ backgroundColor: color }} />
                <div className="p-5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate font-bold text-foreground">{c.empresa?.nombre}</p>
                      <p className="text-xs text-muted-foreground">{c.tipoNegocio?.nombre}</p>
                      {c.empresa?.calificacion && c.empresa.calificacion > 0 && (
                        <p className="mt-0.5 flex items-center gap-1 text-xs text-amber-600">
                          <Star className="h-3 w-3 fill-amber-500 text-amber-500" />{" "}
                          {c.empresa.calificacion.toFixed(1)}/5
                        </p>
                      )}
                    </div>
                    <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700">
                      Activo
                    </span>
                  </div>

                  {c.empresa?.direccion && (
                    <p className="mt-2 flex items-start gap-1 text-xs text-muted-foreground">
                      <MapPin className="mt-0.5 h-3 w-3 shrink-0" />
                      {c.empresa.direccion}{c.empresa.ciudad ? ` · ${c.empresa.ciudad}` : ""}
                    </p>
                  )}
                  {c.empresa?.horario && (
                    <p className="mt-1 flex items-start gap-1 text-xs text-muted-foreground">
                      <Clock className="mt-0.5 h-3 w-3 shrink-0" /> {c.empresa.horario}
                    </p>
                  )}

                  <div className="mt-3">
                    {promocionesActivas.length === 0 ? (
                      <span className="text-[11px] text-muted-foreground">Sin promociones activas</span>
                    ) : (
                      <div className="flex flex-wrap gap-1.5">
                        {promocionesActivas.map((e) => (
                          <span
                            key={e.id}
                            className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium"
                            style={{ backgroundColor: color + "12", borderColor: color + "30", color }}
                          >
                            <Gift className="h-2.5 w-2.5" /> {e.estrategia.nombre}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="mt-4 flex items-center justify-end text-xs font-medium text-foreground group-hover:gap-1.5 transition-all gap-1">
                    Ver mi Pase <ChevronRight className="h-3.5 w-3.5" />
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

/* ─── Mi Actividad View ───────────────────────────────────── */
function MiActividadView() {
  const { showToast } = useStore();
  const [transacciones, setTransacciones] = useState<TransaccionConEmpresa[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get<{ transacciones: TransaccionConEmpresa[] }>("/api/transacciones")
      .then((r) => setTransacciones(r.transacciones || []))
      .catch(() => showToast("Error al cargar tu actividad", "error"))
      .finally(() => setLoading(false));
  }, [showToast]);

  return (
    <div>
      <SectionHeader
        title="Mi actividad"
        description="Tus visitas y promociones aprovechadas"
      />

      {loading ? (
        <div className="flex items-center justify-center py-16 gap-3">
          <div className="h-6 w-6 rounded-full border-2 border-border border-t-foreground animate-spin" />
          <p className="text-sm text-muted-foreground">Cargando historial...</p>
        </div>
      ) : transacciones.length === 0 ? (
        <EmptyState
          title="Sin actividad aún"
          description="Cuando uses una promoción en un establecimiento, aparecerá aquí."
          icon={<History className="h-8 w-8" />}
        />
      ) : (
        <Card className="overflow-hidden rounded-2xl p-0 gap-0">
          <div className="divide-y divide-border">
            {transacciones.map((t) => {
              const color = t.empresa?.colorPrincipal || "#b45309";
              return (
                <div key={t.id} className="flex items-start justify-between gap-3 px-5 py-4">
                  <div className="flex items-start gap-3">
                    <div
                      className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
                      style={{ backgroundColor: color + "15", color }}
                    >
                      <Clock className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">
                        {t.empresa?.nombre && (
                          <span style={{ color }}>{t.empresa.nombre}</span>
                        )}
                        {t.empresa?.nombre ? " · " : ""}
                        <span className="text-muted-foreground font-normal">{t.tipoConsumo}</span>
                      </p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {fmtFechaHora(t.fechaTransaccion)}
                      </p>
                      {t.beneficioAplicado && (
                        <p className="mt-1 flex items-center gap-1 text-xs font-medium text-emerald-600">
                          <CheckCircle2 className="h-3 w-3" /> {t.beneficioAplicado}
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
                    {(t as any).usosDescontados > 0 && (
                      <p className="flex items-center justify-end gap-1 text-xs text-muted-foreground">
                        <Tag className="h-3 w-3" /> {(t as any).usosDescontados} uso(s)
                      </p>
                    )}
                    {t.puntosGenerados > 0 && (
                      <p className="flex items-center justify-end gap-1 text-xs font-medium text-amber-600">
                        <Coins className="h-3 w-3" /> +{t.puntosGenerados} pts
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}
    </div>
  );
}
