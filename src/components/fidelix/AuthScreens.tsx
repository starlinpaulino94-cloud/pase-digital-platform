"use client";
import { useEffect, useState } from "react";
import { useStore } from "./store";
import {
  api,
  type TipoNegocio,
  type Empresa,
  type Estrategia,
  type SessionUser,
  type Config,
} from "./api-client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  ArrowRight,
  ArrowLeft,
  QrCode,
  Car,
  UtensilsCrossed,
  Building2,
  ShieldCheck,
  Sparkles,
  Gift,
  MapPin,
  Clock,
  Users,
  Store,
  Ticket,
  Star,
  Flame,
  Check,
  Crown,
  TrendingUp,
  CalendarDays,
  Lock,
  Mail,
  Phone,
  User as UserIcon,
  ChevronDown,
  ChevronRight,
  KeyRound,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { TIPOS_BENEFICIO, ESCASEZ_TIPOS } from "@/lib/constants";

const ICONS: Record<string, React.ReactNode> = {
  Car: <Car className="h-5 w-5" />,
  UtensilsCrossed: <UtensilsCrossed className="h-5 w-5" />,
};

function tipoLabel(tipo: string): string {
  return TIPOS_BENEFICIO.find((t) => t.value === tipo)?.label || tipo;
}

function parseJsonArray<T = string>(value: string | null | undefined, fallback: T[] = []): T[] {
  if (!value) return fallback;
  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) return parsed as T[];
    return fallback;
  } catch {
    return fallback;
  }
}

function escasezMensaje(tipo: string | null): string | null {
  if (!tipo) return null;
  return ESCASEZ_TIPOS.find((e) => e.value === tipo)?.mensaje || null;
}

function useCountUp(target: number, durationMs = 1400): number {
  const [val, setVal] = useState(0);
  useEffect(() => {
    let raf = 0;
    const t0 = performance.now();
    const tick = (now: number) => {
      const p = Math.min(1, (now - t0) / durationMs);
      const eased = 1 - Math.pow(1 - p, 3);
      setVal(Math.round(target * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, durationMs]);
  return val;
}

/* ─── Stat card ───────────────────────────────────────────── */
function StatCard({
  value,
  label,
  icon,
  suffix = "+",
  delay = 0,
}: {
  value: number;
  label: string;
  icon: React.ReactNode;
  suffix?: string;
  delay?: number;
}) {
  const n = useCountUp(value);
  return (
    <div
      className="flex items-center gap-3 rounded-2xl border border-border bg-card px-4 py-3.5 shadow-sm transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 animate-fade-up"
      style={{ animationDelay: `${delay}ms` }}
    >
      <span
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
        style={{ background: "oklch(0.93 0.04 80)", color: "oklch(0.48 0.11 78)" }}
      >
        {icon}
      </span>
      <div className="min-w-0">
        <p className="text-lg font-extrabold tracking-tight text-foreground leading-none">
          {n.toLocaleString("es-DO")}
          {suffix}
        </p>
        <p className="mt-0.5 text-xs text-muted-foreground leading-tight">{label}</p>
      </div>
    </div>
  );
}

function scrollToPromociones() {
  if (typeof document !== "undefined") {
    const el = document.getElementById("promociones");
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}

/* ─── Landing ─────────────────────────────────────────────── */
export function Landing() {
  const { navigate } = useStore();
  const [tipos, setTipos] = useState<TipoNegocio[]>([]);
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [usosPorEstr, setUsosPorEstr] = useState<Record<string, number>>({});
  const [config, setConfig] = useState<Config | null>(null);

  useEffect(() => {
    api
      .get<{
        tipos: TipoNegocio[];
        empresas: Empresa[];
        usosPorEstr: Record<string, number>;
        config: Config;
        clientesReales: number;
      }>("/api/datos-publicos")
      .then((r) => {
        setTipos(r.tipos || []);
        setEmpresas(r.empresas || []);
        setUsosPorEstr(r.usosPorEstr || {});
        setConfig(r.config);
      })
      .catch(() => {});
  }, []);

  const promociones: { empresa: Empresa; estrategia: Estrategia }[] = [];
  for (const emp of empresas) {
    for (const est of emp.estrategias || []) {
      promociones.push({ empresa: emp, estrategia: est });
    }
  }

  const hasCarwash = empresas.some(
    (e) => e.tipoNegocio?.slug === "carwash" || e.tipoNegocio?.icono === "Car"
  );

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* ── Header ── */}
      <header className="sticky top-0 z-30 border-b border-border bg-background/90 glass">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 sm:px-6 h-16">
          <div className="flex items-center gap-3">
            <div
              className="flex h-8 w-8 items-center justify-center rounded-lg"
              style={{ background: "oklch(0.13 0.02 265)" }}
            >
              <KeyRound className="h-4 w-4 text-white" />
            </div>
            <div>
              <p className="font-extrabold text-sm tracking-wide text-foreground leading-none">
                PASE DIGITAL
              </p>
              <p className="text-[10px] leading-none mt-0.5" style={{ color: "oklch(0.50 0.11 78)" }}>
                Acceso Exclusivo
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate("cliente-login")}
            className="gap-2 border-border text-foreground hover:bg-muted text-sm"
          >
            <QrCode className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Acceder a mi Pase</span>
            <span className="sm:hidden">Acceder</span>
          </Button>
        </div>
      </header>

      <main className="flex-1">
        {/* ── Hero ── */}
        <section className="relative overflow-hidden">
          {/* Background */}
          <div
            className="absolute inset-0"
            style={{
              background:
                "radial-gradient(ellipse 80% 50% at 50% -10%, oklch(0.93 0.04 80 / 0.5), transparent)",
            }}
          />
          <div
            className="absolute inset-0 opacity-[0.025]"
            style={{
              backgroundImage:
                "radial-gradient(circle at 1px 1px, oklch(0.13 0.02 265) 1px, transparent 0)",
              backgroundSize: "28px 28px",
            }}
          />

          <div className="relative mx-auto max-w-5xl px-4 sm:px-6 py-20 sm:py-28 lg:py-36 text-center">
            {/* Pill */}
            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-1.5 text-xs font-semibold text-muted-foreground shadow-sm animate-fade-in mb-6">
              <span
                className="flex h-1.5 w-1.5 rounded-full"
                style={{ background: "oklch(0.74 0.115 78)" }}
              />
              <Crown className="h-3 w-3" style={{ color: "oklch(0.74 0.115 78)" }} />
              Acceso exclusivo para clientes registrados
            </div>

            {/* Headline */}
            <h1
              className="text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl lg:text-6xl leading-[1.1] animate-fade-up"
              style={{ animationDelay: "80ms" }}
            >
              {config?.heroTitulo ? (
                config.heroTitulo
              ) : (
                <>
                  Tu{" "}
                  <span className="text-gradient-gold">Pase Digital</span>{" "}
                  <br className="hidden sm:block" />
                  abre puertas privadas
                </>
              )}
            </h1>

            <p
              className="mx-auto mt-5 max-w-xl text-base sm:text-lg text-muted-foreground leading-relaxed animate-fade-up"
              style={{ animationDelay: "160ms" }}
            >
              {config?.heroSubtitulo ||
                "Regístrate, activa tu Pase Digital y disfruta promociones exclusivas en nuestros establecimientos participantes."}
            </p>

            {/* CTAs */}
            <div
              className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center animate-fade-up"
              style={{ animationDelay: "240ms" }}
            >
              <Button
                size="lg"
                onClick={() => navigate("registro")}
                className="gap-2 text-base font-semibold shadow-brand hover:shadow-brand-lg transition-shadow"
                style={{
                  background: "oklch(0.13 0.02 265)",
                  color: "oklch(0.992 0.004 80)",
                }}
              >
                <Zap className="h-4 w-4" />
                Quiero mi Pase Digital
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={scrollToPromociones}
                className="gap-2 text-base border-border text-foreground hover:bg-muted"
              >
                Ver promociones
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>

            <p
              className="mt-4 text-xs text-muted-foreground animate-fade-up"
              style={{ animationDelay: "320ms" }}
            >
              Activación gratuita · Sin compromisos
            </p>
          </div>
        </section>

        {/* ── Stats bar ── */}
        {config && (
          <section className="border-y border-border bg-muted/30">
            <div className="mx-auto max-w-5xl px-4 sm:px-6 py-8">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard
                  value={config.socialClientes}
                  label="Clientes con Pase activo"
                  icon={<Users className="h-4 w-4" />}
                  delay={0}
                />
                <StatCard
                  value={config.socialVisitas}
                  label="Promociones utilizadas"
                  icon={<Ticket className="h-4 w-4" />}
                  delay={80}
                />
                <StatCard
                  value={config.socialNegocios}
                  label="Negocios participantes"
                  icon={<Store className="h-4 w-4" />}
                  suffix=""
                  delay={160}
                />
                {hasCarwash && (
                  <StatCard
                    value={config.socialVehiculos}
                    label="Vehículos atendidos"
                    icon={<Car className="h-4 w-4" />}
                    delay={240}
                  />
                )}
              </div>
            </div>
          </section>
        )}

        {/* ── Cómo funciona ── */}
        <section className="bg-background">
          <div className="mx-auto max-w-5xl px-4 sm:px-6 py-16 sm:py-20">
            <div className="mx-auto mb-12 max-w-xl text-center">
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">
                Proceso
              </p>
              <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                Activa tu Pase en minutos
              </h2>
            </div>

            <div className="relative">
              {/* Connecting line */}
              <div className="absolute top-8 left-8 right-8 hidden h-px lg:block"
                style={{ background: "linear-gradient(90deg, transparent, oklch(0.91 0.006 80) 20%, oklch(0.91 0.006 80) 80%, transparent)" }}
              />

              <ol className="relative grid gap-6 sm:grid-cols-3 lg:grid-cols-5">
                {[
                  { icon: <KeyRound className="h-5 w-5" />, t: "Activa tu Pase",        d: "Registro gratuito" },
                  { icon: <Store className="h-5 w-5" />,    t: "Elige tu local",         d: "Establecimientos participantes" },
                  { icon: <Gift className="h-5 w-5" />,     t: "Descubre promociones",   d: "Exclusivas para titulares" },
                  { icon: <QrCode className="h-5 w-5" />,   t: "Presenta tu Pase QR",    d: "En tu próxima visita" },
                  { icon: <Crown className="h-5 w-5" />,    t: "Disfruta",               d: "Ventajas exclusivas" },
                ].map((s, i) => (
                  <li key={i} className="flex flex-col items-center text-center">
                    <div
                      className="relative mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-border bg-card shadow-sm"
                    >
                      <span className="text-muted-foreground">{s.icon}</span>
                      <span
                        className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold text-white"
                        style={{ background: "oklch(0.13 0.02 265)" }}
                      >
                        {i + 1}
                      </span>
                    </div>
                    <p className="text-sm font-semibold text-foreground">{s.t}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{s.d}</p>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </section>

        {/* ── Establecimientos ── */}
        <section id="establecimientos" className="bg-muted/30 border-y border-border">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 py-16 sm:py-20">
            <div className="mx-auto mb-10 max-w-xl text-center">
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">
                Establecimientos
              </p>
              <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                Dónde usar tu Pase
              </h2>
              <p className="mt-2 text-muted-foreground text-sm">
                Negocios seleccionados para ofrecerte las mejores experiencias.
              </p>
            </div>

            {empresas.length === 0 ? (
              <EmptySection
                icon={<Store className="h-8 w-8" />}
                title="Próximamente establecimientos"
                description="Estamos incorporando nuevos locales. Vuelve pronto."
              />
            ) : (
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {empresas.map((emp) => (
                  <EmpresaCard key={emp.id} empresa={emp} onVerPromociones={scrollToPromociones} />
                ))}
              </div>
            )}
          </div>
        </section>

        {/* ── Promociones ── */}
        <section id="promociones" className="bg-background">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 py-16 sm:py-20">
            <div className="mx-auto mb-10 max-w-xl text-center">
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">
                Oportunidades exclusivas
              </p>
              <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                Promociones disponibles
              </h2>
              <p className="mt-2 text-muted-foreground text-sm">
                Solo para titulares del Pase Digital
              </p>
            </div>

            {promociones.length === 0 ? (
              <EmptySection
                icon={<Gift className="h-8 w-8" />}
                title="Próximamente nuevas promociones"
                description="Estamos preparando oportunidades especiales. Vuelve pronto."
              />
            ) : (
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {promociones.map(({ empresa, estrategia }) => (
                  <PromocionCard
                    key={estrategia.id}
                    empresa={empresa}
                    estrategia={estrategia}
                    usos={usosPorEstr[estrategia.id] || 0}
                    onObtener={() => navigate("registro")}
                  />
                ))}
              </div>
            )}
          </div>
        </section>

        {/* ── FAQ ── */}
        <section className="bg-muted/30 border-t border-border">
          <div className="mx-auto max-w-2xl px-4 sm:px-6 py-16 sm:py-20">
            <div className="mb-10 text-center">
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">
                FAQ
              </p>
              <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                Preguntas frecuentes
              </h2>
            </div>
            <Accordion type="single" collapsible className="space-y-2">
              {[
                {
                  q: "¿Cómo obtengo mi Pase Digital?",
                  a: "Regístrate, elige tu establecimiento y la promoción que prefieras. Tu Pase Digital se activa al instante.",
                },
                {
                  q: "¿El registro tiene costo?",
                  a: "Activar tu Pase Digital es gratuito. Algunas promociones premium tienen costo y se activan al confirmar el pago.",
                },
                {
                  q: "¿Dónde puedo usar mi Pase?",
                  a: "En cualquiera de nuestros establecimientos participantes. Tu Pase Digital funciona en todos ellos.",
                },
                {
                  q: "¿Puedo acceder a varios establecimientos?",
                  a: "Sí. Cuantos más establecimientos elijas, más oportunidades exclusivas acumulas.",
                },
                {
                  q: "¿Mis datos están seguros?",
                  a: "Tu Pase Digital contiene solo un identificador seguro y anónimo. Nunca incluye tus datos personales.",
                },
              ].map((item, i) => (
                <AccordionItem
                  key={i}
                  value={`item-${i}`}
                  className="rounded-xl border border-border bg-card px-5 data-[state=open]:shadow-sm"
                >
                  <AccordionTrigger className="text-left text-sm font-semibold text-foreground py-4 hover:no-underline">
                    {item.q}
                  </AccordionTrigger>
                  <AccordionContent className="text-sm text-muted-foreground pb-4 leading-relaxed">
                    {item.a}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </section>

        {/* ── CTA final ── */}
        <section
          className="relative overflow-hidden"
          style={{ background: "oklch(0.13 0.02 265)" }}
        >
          <div
            className="absolute inset-0 opacity-[0.06]"
            style={{
              backgroundImage:
                "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
              backgroundSize: "24px 24px",
            }}
          />
          <div className="relative mx-auto max-w-3xl px-4 sm:px-6 py-16 sm:py-20 text-center">
            <Crown className="mx-auto h-10 w-10 mb-5" style={{ color: "oklch(0.74 0.115 78)" }} />
            <h2 className="text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
              ¿Listo para tu acceso exclusivo?
            </h2>
            <p className="mt-3 text-white/60 text-sm sm:text-base max-w-md mx-auto">
              Únete a miles de clientes que ya disfrutan promociones privadas con su Pase Digital.
            </p>
            <Button
              size="lg"
              onClick={() => navigate("registro")}
              className="mt-8 gap-2 text-base font-semibold shadow-brand-lg"
              style={{
                background: "oklch(0.74 0.115 78)",
                color: "oklch(0.13 0.02 265)",
              }}
            >
              <Zap className="h-4 w-4" />
              Activar mi Pase Digital gratis
            </Button>
          </div>
        </section>
      </main>

      {/* ── Footer ── */}
      <footer className="border-t border-border bg-background">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <div
              className="flex h-5 w-5 items-center justify-center rounded"
              style={{ background: "oklch(0.13 0.02 265)" }}
            >
              <KeyRound className="h-3 w-3 text-white" />
            </div>
            <span className="font-medium text-foreground">Pase Digital</span>
          </div>
          <p>Acceso exclusivo · {new Date().getFullYear()}</p>
        </div>
      </footer>
    </div>
  );
}

/* ─── Empresa card ────────────────────────────────────────── */
function EmpresaCard({
  empresa,
  onVerPromociones,
}: {
  empresa: Empresa;
  onVerPromociones: () => void;
}) {
  const color = empresa.colorPrincipal || "#b45309";
  const color2 = empresa.colorSecundario || empresa.colorPrincipal || "#92400e";
  const servicios = parseJsonArray<string>(empresa.servicios).slice(0, 4);
  const rating = empresa.calificacion || 0;
  const clientesCount = empresa._count?.clientes;

  return (
    <Card className="group overflow-hidden rounded-2xl border border-border shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-midnight">
      {/* Cover */}
      <div
        className="relative h-28 w-full"
        style={{
          background: empresa.imagenPortada
            ? `url(${empresa.imagenPortada}) center/cover`
            : `linear-gradient(135deg, ${color} 0%, ${color2} 100%)`,
        }}
      >
        <div className="absolute inset-0 bg-black/15" />
        {empresa.destacada && (
          <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-white/95 px-2.5 py-1 text-[11px] font-bold text-foreground shadow-sm">
            <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" /> Destacado
          </span>
        )}
      </div>

      <CardContent className="p-5 pt-0">
        {/* Logo */}
        <div className="-mt-7 mb-4 flex items-end justify-between">
          {empresa.logo ? (
            <img
              src={empresa.logo}
              alt={empresa.nombre}
              className="h-14 w-14 rounded-xl border-4 border-background bg-background object-cover shadow-md"
            />
          ) : (
            <div
              className="flex h-14 w-14 items-center justify-center rounded-xl border-4 border-background text-xl font-extrabold text-white shadow-md"
              style={{ backgroundColor: color }}
            >
              {empresa.nombre.charAt(0).toUpperCase()}
            </div>
          )}
          {rating > 0 && (
            <span className="mb-1 inline-flex items-center gap-1 rounded-lg border border-border bg-muted px-2 py-1 text-xs font-bold text-foreground">
              <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
              {rating.toFixed(1)}
            </span>
          )}
        </div>

        <p className="font-bold text-foreground leading-tight">{empresa.nombre}</p>

        {(empresa.ciudad || empresa.direccion) && (
          <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
            <MapPin className="h-3 w-3 shrink-0" />
            {empresa.ciudad || empresa.direccion?.split(",")[0]}
          </p>
        )}

        {empresa.descripcionPublica && (
          <p className="mt-2.5 line-clamp-2 text-sm text-muted-foreground leading-relaxed">
            {empresa.descripcionPublica}
          </p>
        )}

        {servicios.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {servicios.map((s) => (
              <span
                key={s}
                className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium border"
                style={{
                  backgroundColor: color + "12",
                  borderColor: color + "30",
                  color,
                }}
              >
                {s}
              </span>
            ))}
          </div>
        )}

        <div className="mt-3 space-y-1 text-xs text-muted-foreground">
          {empresa.horario && (
            <p className="flex items-center gap-1.5">
              <Clock className="h-3 w-3 shrink-0" /> {empresa.horario}
            </p>
          )}
          {clientesCount !== undefined && clientesCount > 0 && (
            <p className="flex items-center gap-1.5">
              <Users className="h-3 w-3 shrink-0" />
              {clientesCount.toLocaleString("es-DO")} clientes satisfechos
            </p>
          )}
        </div>

        <Button
          onClick={onVerPromociones}
          variant="outline"
          size="sm"
          className="mt-4 w-full gap-1.5 border-border text-foreground hover:bg-muted text-xs font-medium"
        >
          Ver promociones <ChevronRight className="h-3.5 w-3.5" />
        </Button>
      </CardContent>
    </Card>
  );
}

/* ─── Promocion card ──────────────────────────────────────── */
function PromocionCard({
  empresa,
  estrategia,
  usos,
  onObtener,
}: {
  empresa: Empresa;
  estrategia: Estrategia;
  usos: number;
  onObtener: () => void;
}) {
  const color = empresa.colorPrincipal || "#b45309";
  const gratis = !estrategia.requierePago || estrategia.precio <= 0;
  const incluye = parseJsonArray<string>(estrategia.incluye).slice(0, 5);
  const escasez = escasezMensaje(estrategia.escasezTipo);
  const [showTerminos, setShowTerminos] = useState(false);

  let escasezTexto: string | null = escasez;
  if (estrategia.escasezTipo === "ultimos_cupos" && estrategia.cuposDisponibles > 0) {
    escasezTexto = `¡Solo ${estrategia.cuposDisponibles} cupos!`;
  }

  return (
    <Card
      className={cn(
        "group flex flex-col overflow-hidden rounded-2xl border shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-midnight",
        estrategia.destacada ? "ring-1 ring-offset-1" : "border-border"
      )}
      style={
        estrategia.destacada
          ? { borderColor: color + "50", outlineColor: color + "30" }
          : {}
      }
    >
      {/* Top accent */}
      <div className="h-1 w-full" style={{ backgroundColor: color }} />

      <CardContent className="flex flex-1 flex-col p-5">
        {/* Badges */}
        {(estrategia.destacada || escasezTexto) && (
          <div className="mb-3 flex flex-wrap gap-1.5">
            {estrategia.destacada && (
              <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-[11px] font-semibold text-foreground border border-border">
                <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" /> La favorita
              </span>
            )}
            {escasezTexto && (
              <span
                className={cn(
                  "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold",
                  estrategia.escasezTipo === "ultimos_cupos"
                    ? "bg-red-50 text-red-700 border border-red-100"
                    : "bg-orange-50 text-orange-700 border border-orange-100"
                )}
              >
                <Flame className="h-3 w-3" /> {escasezTexto}
              </span>
            )}
          </div>
        )}

        {/* Header */}
        <p className="text-[11px] font-semibold uppercase tracking-wider" style={{ color }}>
          {empresa.nombre}
        </p>
        <p className="mt-1 text-lg font-extrabold leading-tight text-foreground">
          {estrategia.nombre}
        </p>

        <div className="mt-2">
          <Badge
            variant="outline"
            className="border-border text-[11px] text-muted-foreground"
          >
            {tipoLabel(estrategia.tipoEstrategia)}
          </Badge>
        </div>

        {estrategia.descripcion && (
          <p className="mt-3 line-clamp-3 text-sm text-muted-foreground leading-relaxed">
            {estrategia.descripcion}
          </p>
        )}

        {/* Incluye */}
        {incluye.length > 0 && (
          <ul className="mt-3 space-y-1.5">
            {incluye.map((item, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-foreground">
                <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-emerald-50 border border-emerald-100">
                  <Check className="h-2.5 w-2.5 text-emerald-600" />
                </span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        )}

        {usos > 0 && (
          <p className="mt-3 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
            <TrendingUp className="h-3.5 w-3.5" /> Ya utilizado por {usos.toLocaleString("es-DO")}+ clientes
          </p>
        )}

        {/* Price + CTA */}
        <div className="mt-auto pt-5">
          <div className="mb-3 flex items-baseline gap-1">
            {gratis ? (
              <span className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-100 bg-emerald-50 px-3 py-1.5 text-sm font-bold text-emerald-700">
                <Gift className="h-4 w-4" /> Gratis
              </span>
            ) : (
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-extrabold text-foreground">
                  RD$ {estrategia.precio.toLocaleString("es-DO")}
                </span>
                <span className="text-xs text-muted-foreground">
                  {estrategia.tipoEstrategia === "MEMBRESIA" ? "/mes" : "único"}
                </span>
              </div>
            )}
          </div>

          <Button
            onClick={onObtener}
            className="w-full gap-2 font-semibold"
            style={{
              background: "oklch(0.13 0.02 265)",
              color: "oklch(0.992 0.004 80)",
            }}
          >
            {estrategia.destacada ? "Quiero este plan" : "Obtener acceso"}
            <ArrowRight className="h-4 w-4" />
          </Button>

          {estrategia.terminos && (
            <>
              <button
                type="button"
                onClick={() => setShowTerminos((s) => !s)}
                className="mt-2 flex w-full items-center justify-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors"
              >
                {showTerminos ? "Ocultar términos" : "Ver términos"}
                <ChevronDown
                  className={cn("h-3 w-3 transition-transform", showTerminos && "rotate-180")}
                />
              </button>
              {showTerminos && (
                <p className="mt-1.5 rounded-lg border border-border bg-muted px-3 py-2 text-[11px] text-muted-foreground leading-relaxed">
                  {estrategia.terminos}
                </p>
              )}
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

/* ─── Empty section ───────────────────────────────────────── */
function EmptySection({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-muted/30 py-16 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-border bg-card text-muted-foreground">
        {icon}
      </div>
      <p className="font-semibold text-foreground">{title}</p>
      <p className="mt-1 max-w-xs text-sm text-muted-foreground">{description}</p>
    </div>
  );
}

/* ─── Client Login ────────────────────────────────────────── */
export function ClientLogin() {
  const { navigate, showToast } = useStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post<{ user: SessionUser }>("/api/auth", { email, password });
      if (res.user.rol !== "CLIENTE") {
        await fetch("/api/auth/logout", { method: "POST" }).catch(() => {});
        showToast("Esta cuenta no es de cliente", "error");
        setEmail("");
        setPassword("");
        return;
      }
      useStore.getState().setUser(res.user);
      showToast(`¡Bienvenido, ${res.user.nombre}!`, "success");
      navigate("cliente-app");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Error al iniciar sesión", "error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Background */}
      <div
        className="pointer-events-none fixed inset-0"
        style={{
          background:
            "radial-gradient(ellipse 70% 40% at 50% 0%, oklch(0.93 0.04 80 / 0.4), transparent)",
        }}
      />

      <div className="relative flex flex-1 items-center justify-center px-4 py-16">
        <div className="w-full max-w-sm animate-scale-in">
          {/* Logo */}
          <div className="mb-8 flex flex-col items-center gap-3 text-center">
            <div
              className="flex h-12 w-12 items-center justify-center rounded-2xl shadow-midnight"
              style={{ background: "oklch(0.13 0.02 265)" }}
            >
              <KeyRound className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight text-foreground">
                Accede a tu Pase
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Ingresa para ver tus promociones
              </p>
            </div>
          </div>

          {/* Form card */}
          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <form onSubmit={submit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-sm font-medium text-foreground">
                  Correo electrónico
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/60" />
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="tu@correo.com"
                    autoComplete="email"
                    className="pl-9 h-10 rounded-xl border-border bg-background focus:ring-2 focus:ring-ring focus:border-transparent"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-sm font-medium text-foreground">
                  Contraseña
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/60" />
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="••••••••"
                    autoComplete="current-password"
                    className="pl-9 h-10 rounded-xl border-border bg-background focus:ring-2 focus:ring-ring focus:border-transparent"
                  />
                </div>
              </div>

              <Button
                type="submit"
                className="w-full h-10 rounded-xl font-semibold gap-2"
                disabled={loading}
                style={{
                  background: loading ? undefined : "oklch(0.13 0.02 265)",
                  color: "oklch(0.992 0.004 80)",
                }}
              >
                {loading ? "Accediendo..." : <>Acceder <ArrowRight className="h-4 w-4" /></>}
              </Button>
            </form>

            {/* Demo hint */}
            <div className="mt-4 rounded-xl border border-border bg-muted/50 p-3">
              <p className="mb-1 text-[11px] font-semibold text-foreground flex items-center gap-1.5">
                <Sparkles className="h-3 w-3" style={{ color: "oklch(0.74 0.115 78)" }} />
                Cuenta de demostración
              </p>
              <p className="text-[11px] text-muted-foreground font-mono">
                cliente@fidelix.com / cliente123
              </p>
            </div>
          </div>

          {/* Links */}
          <div className="mt-5 flex items-center justify-between text-sm">
            <button
              type="button"
              onClick={() => navigate("landing")}
              className="inline-flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors link-underline"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Volver
            </button>
            <button
              type="button"
              onClick={() => navigate("registro")}
              className="font-medium text-foreground hover:opacity-70 transition-opacity link-underline"
              style={{ color: "oklch(0.48 0.11 78)" }}
            >
              Activar mi Pase →
            </button>
          </div>
        </div>
      </div>

      <footer className="relative border-t border-border bg-background">
        <div className="mx-auto max-w-6xl px-4 py-5 text-center text-xs text-muted-foreground">
          Pase Digital · Acceso Exclusivo
        </div>
      </footer>
    </div>
  );
}

/* ─── Register screen ─────────────────────────────────────── */
export function RegisterScreen() {
  const { navigate, showToast } = useStore();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [tipos, setTipos] = useState<TipoNegocio[]>([]);
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [estrategias, setEstrategias] = useState<Estrategia[]>([]);
  const [tipoId, setTipoId] = useState<string>("");
  const [empresaId, setEmpresaId] = useState<string>("");
  const [estrategiaId, setEstrategiaId] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [telefono, setTelefono] = useState("");
  const [password, setPassword] = useState("");
  const [fechaNacimiento, setFechaNacimiento] = useState("");
  const [campos, setCampos] = useState<Record<string, string>>({});

  useEffect(() => {
    api
      .get<{ tipos: TipoNegocio[] }>("/api/tipos-negocio")
      .then((r) => setTipos(r.tipos || []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!tipoId) return;
    api
      .get<{ empresas: Empresa[] }>(`/api/empresas?public=1&tipoNegocioId=${tipoId}`)
      .then((r) => setEmpresas(r.empresas || []))
      .catch(() => {});
    setEmpresaId("");
    setEstrategias([]);
  }, [tipoId]);

  useEffect(() => {
    if (!empresaId) return;
    api
      .get<{ estrategias: Estrategia[] }>(`/api/estrategias?public=1&empresaId=${empresaId}`)
      .then((r) => setEstrategias(r.estrategias || []))
      .catch(() => {});
  }, [empresaId]);

  const tipoSel = tipos.find((t) => t.id === tipoId);
  const empresaSel = empresas.find((e) => e.id === empresaId);
  const estrSel = estrategias.find((e) => e.id === estrategiaId);

  async function submit() {
    setLoading(true);
    try {
      const res = await api.post<{ user: SessionUser }>("/api/auth/register", {
        nombre,
        email,
        password,
        telefono,
        fechaNacimiento: fechaNacimiento || undefined,
        tipoNegocioId: tipoId,
        empresaId,
        estrategiaId: estrategiaId || undefined,
        campos,
      });
      useStore.getState().setUser(res.user);
      showToast("¡Tu Pase Digital está listo!", "success");
      navigate("cliente-app");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Error al registrar", "error");
    } finally {
      setLoading(false);
    }
  }

  const camposReqOk =
    !tipoSel?.camposDef ||
    tipoSel.camposDef.every(
      (c) => !c.requerido || (campos[c.clave] && campos[c.clave].trim() !== "")
    );
  const canSubmit =
    !!nombre && !!email && !!password && !!telefono && !!tipoId && !!empresaId && camposReqOk;

  const stepLabels = ["Establecimiento", "Promoción", "Tus datos"];

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Header */}
      <header className="border-b border-border bg-background/95 glass sticky top-0 z-10">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-4 sm:px-6 h-14">
          <button
            onClick={() => navigate("landing")}
            className="flex items-center gap-2.5 group"
          >
            <div
              className="flex h-7 w-7 items-center justify-center rounded-lg"
              style={{ background: "oklch(0.13 0.02 265)" }}
            >
              <KeyRound className="h-3.5 w-3.5 text-white" />
            </div>
            <span className="font-bold text-sm tracking-wide text-foreground">PASE DIGITAL</span>
          </button>
          <button
            onClick={() => navigate("landing")}
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" /> Volver
          </button>
        </div>
      </header>

      <div className="mx-auto w-full max-w-2xl flex-1 px-4 sm:px-6 py-8">
        {/* Step indicator */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-3">
            {stepLabels.map((label, i) => {
              const n = i + 1;
              const done = step > n;
              const current = step === n;
              return (
                <div key={n} className={cn("flex items-center gap-2", i < stepLabels.length - 1 && "flex-1")}>
                  <div className="flex items-center gap-2 shrink-0">
                    <div
                      className={cn(
                        "flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition-all",
                        done
                          ? "bg-emerald-500 text-white"
                          : current
                          ? "text-white"
                          : "bg-muted text-muted-foreground"
                      )}
                      style={current ? { background: "oklch(0.13 0.02 265)" } : {}}
                    >
                      {done ? <Check className="h-3.5 w-3.5" /> : n}
                    </div>
                    <span
                      className={cn(
                        "hidden sm:block text-xs font-medium",
                        current ? "text-foreground" : "text-muted-foreground"
                      )}
                    >
                      {label}
                    </span>
                  </div>
                  {i < stepLabels.length - 1 && (
                    <div
                      className={cn(
                        "flex-1 h-px transition-colors",
                        step > n ? "bg-emerald-200" : "bg-border"
                      )}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Step 1 */}
        {step === 1 && (
          <div className="animate-fade-up">
            <h1 className="text-2xl font-extrabold tracking-tight text-foreground">
              Elige tu establecimiento
            </h1>
            <p className="mt-1.5 text-muted-foreground text-sm">
              ¿Dónde quieres activar tu Pase Digital?
            </p>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {tipos.map((t) => {
                const color = t.color || "#b45309";
                const selected = tipoId === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => setTipoId(t.id)}
                    className={cn(
                      "group rounded-2xl border-2 p-5 text-left transition-all duration-150",
                      selected
                        ? "bg-foreground"
                        : "border-border bg-card hover:border-foreground/30 hover:shadow-sm"
                    )}
                    style={selected ? { borderColor: "oklch(0.13 0.02 265)" } : {}}
                  >
                    <div className="flex items-center gap-3.5">
                      <div
                        className="flex h-11 w-11 items-center justify-center rounded-xl transition-all"
                        style={
                          selected
                            ? { background: "rgba(255,255,255,0.12)", color: "white" }
                            : { backgroundColor: color + "18", color }
                        }
                      >
                        {ICONS[t.icono || ""] || <Store className="h-5 w-5" />}
                      </div>
                      <div>
                        <p className={cn("font-bold text-sm", selected ? "text-white" : "text-foreground")}>
                          {t.nombre}
                        </p>
                        {t.descripcion && (
                          <p className={cn("text-xs mt-0.5", selected ? "text-white/60" : "text-muted-foreground")}>
                            {t.descripcion}
                          </p>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {tipos.length === 0 && (
              <p className="mt-6 text-sm text-muted-foreground text-center">
                No hay establecimientos disponibles por ahora.
              </p>
            )}

            {tipoId && (
              <Button
                className="mt-6 w-full h-11 gap-2 rounded-xl font-semibold"
                onClick={() => setStep(2)}
                style={{ background: "oklch(0.13 0.02 265)", color: "oklch(0.992 0.004 80)" }}
              >
                Continuar <ArrowRight className="h-4 w-4" />
              </Button>
            )}
          </div>
        )}

        {/* Step 2 */}
        {step === 2 && (
          <div className="animate-fade-up">
            <h1 className="text-2xl font-extrabold tracking-tight text-foreground">
              Elige tu local
            </h1>
            <p className="mt-1.5 text-muted-foreground text-sm">
              Selecciona el establecimiento y la promoción que prefieras
            </p>

            <div className="mt-6 space-y-3">
              {empresas.length === 0 && (
                <p className="text-sm text-muted-foreground py-4 text-center">
                  No hay establecimientos activos para este tipo.
                </p>
              )}
              {empresas.map((e) => {
                const color = e.colorPrincipal || "#b45309";
                const selected = empresaId === e.id;
                return (
                  <button
                    key={e.id}
                    onClick={() => setEmpresaId(e.id)}
                    className={cn(
                      "w-full rounded-2xl border-2 p-4 text-left transition-all duration-150",
                      selected
                        ? "border-foreground bg-muted/50"
                        : "border-border bg-card hover:border-foreground/30"
                    )}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        {e.logo ? (
                          <img
                            src={e.logo}
                            alt={e.nombre}
                            className="h-10 w-10 rounded-xl object-cover border border-border"
                          />
                        ) : (
                          <div
                            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl font-bold text-white text-sm"
                            style={{ backgroundColor: color }}
                          >
                            {e.nombre.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <p className="font-semibold text-sm text-foreground">{e.nombre}</p>
                          {e.calificacion && e.calificacion > 0 && (
                            <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                              <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
                              {e.calificacion.toFixed(1)}/5
                            </p>
                          )}
                          {e.direccion && (
                            <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                              <MapPin className="h-3 w-3" />
                              {e.direccion}{e.ciudad ? ` · ${e.ciudad}` : ""}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1 shrink-0">
                        {e.estrategias && e.estrategias.length > 0 && (
                          <span className="rounded-full border border-border bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                            {e.estrategias.length} promos
                          </span>
                        )}
                        {selected && (
                          <div
                            className="flex h-5 w-5 items-center justify-center rounded-full"
                            style={{ background: "oklch(0.13 0.02 265)" }}
                          >
                            <Check className="h-3 w-3 text-white" />
                          </div>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {empresaId && estrategias.length > 0 && (
              <div className="mt-6">
                <p className="mb-1 text-sm font-semibold text-foreground">
                  Elige una promoción <span className="font-normal text-muted-foreground">(opcional)</span>
                </p>
                <p className="mb-3 text-xs text-muted-foreground">
                  Puedes activarla después desde tu Pase Digital.
                </p>
                <div className="space-y-2">
                  {estrategias.map((es) => {
                    const gratis = !es.requierePago || es.precio <= 0;
                    const incluye = parseJsonArray<string>(es.incluye).slice(0, 2);
                    const escasez = escasezMensaje(es.escasezTipo);
                    let escasezTexto = escasez;
                    if (es.escasezTipo === "ultimos_cupos" && es.cuposDisponibles > 0) {
                      escasezTexto = `¡Solo ${es.cuposDisponibles} cupos!`;
                    }
                    const selected = estrategiaId === es.id;
                    return (
                      <button
                        key={es.id}
                        onClick={() => setEstrategiaId(selected ? "" : es.id)}
                        className={cn(
                          "w-full rounded-xl border p-3.5 text-left transition-all duration-150",
                          selected
                            ? "border-foreground bg-muted/50"
                            : "border-border bg-card hover:border-foreground/30"
                        )}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="text-sm font-semibold text-foreground">{es.nombre}</p>
                              {escasezTexto && (
                                <span className="inline-flex items-center gap-1 rounded-full bg-orange-50 border border-orange-100 px-1.5 py-0.5 text-[10px] font-bold text-orange-700">
                                  <Flame className="h-2.5 w-2.5" /> {escasezTexto}
                                </span>
                              )}
                            </div>
                            {incluye.length > 0 && (
                              <ul className="mt-1 space-y-0.5">
                                {incluye.map((it, i) => (
                                  <li key={i} className="flex items-center gap-1 text-[11px] text-muted-foreground">
                                    <Check className="h-3 w-3 text-emerald-500 shrink-0" /> {it}
                                  </li>
                                ))}
                              </ul>
                            )}
                            {es.requierePago && (
                              <p className="mt-1 text-[11px] text-muted-foreground">
                                Se activa al confirmar el pago
                              </p>
                            )}
                          </div>
                          <div className="shrink-0 text-right">
                            {gratis ? (
                              <p className="text-sm font-bold text-emerald-600">Gratis</p>
                            ) : (
                              <p className="text-sm font-bold text-foreground">
                                RD$ {es.precio.toLocaleString("es-DO")}
                              </p>
                            )}
                            {selected && (
                              <div
                                className="ml-auto mt-1 flex h-5 w-5 items-center justify-center rounded-full"
                                style={{ background: "oklch(0.13 0.02 265)" }}
                              >
                                <Check className="h-3 w-3 text-white" />
                              </div>
                            )}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="mt-6 flex gap-3">
              <Button
                variant="outline"
                onClick={() => setStep(1)}
                className="gap-2 border-border"
              >
                <ArrowLeft className="h-4 w-4" /> Atrás
              </Button>
              <Button
                className="flex-1 h-11 gap-2 rounded-xl font-semibold"
                onClick={() => setStep(3)}
                disabled={!empresaId}
                style={{ background: "oklch(0.13 0.02 265)", color: "oklch(0.992 0.004 80)" }}
              >
                Continuar <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 3 */}
        {step === 3 && (
          <div className="animate-fade-up">
            <h1 className="text-2xl font-extrabold tracking-tight text-foreground">
              Crea tu cuenta
            </h1>
            <p className="mt-1.5 text-sm text-muted-foreground">
              {empresaSel?.nombre}
              {estrSel ? ` · ${estrSel.nombre}` : ""}
            </p>

            <div className="mt-6 space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium text-foreground flex items-center gap-1.5">
                    <UserIcon className="h-3.5 w-3.5 text-muted-foreground" />
                    Nombre completo *
                  </Label>
                  <Input
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    required
                    placeholder="Tu nombre completo"
                    className="h-10 rounded-xl border-border"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium text-foreground flex items-center gap-1.5">
                    <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                    Teléfono *
                  </Label>
                  <Input
                    value={telefono}
                    onChange={(e) => setTelefono(e.target.value)}
                    required
                    placeholder="809-000-0000"
                    className="h-10 rounded-xl border-border"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium text-foreground flex items-center gap-1.5">
                    <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                    Correo electrónico *
                  </Label>
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="tu@correo.com"
                    className="h-10 rounded-xl border-border"
                  />
                  <p className="text-[11px] text-muted-foreground">
                    Lo usarás para acceder a tu Pase
                  </p>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium text-foreground flex items-center gap-1.5">
                    <Lock className="h-3.5 w-3.5 text-muted-foreground" />
                    Contraseña *
                  </Label>
                  <Input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="••••••••"
                    className="h-10 rounded-xl border-border"
                  />
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <Label className="text-sm font-medium text-foreground flex items-center gap-1.5">
                    <CalendarDays className="h-3.5 w-3.5 text-muted-foreground" />
                    Fecha de nacimiento{" "}
                    <span className="font-normal text-muted-foreground">(opcional)</span>
                  </Label>
                  <Input
                    type="date"
                    value={fechaNacimiento}
                    onChange={(e) => setFechaNacimiento(e.target.value)}
                    className="h-10 rounded-xl border-border w-full sm:w-auto"
                  />
                </div>
              </div>

              {tipoSel?.camposDef && tipoSel.camposDef.length > 0 && (
                <div className="rounded-xl border border-border bg-muted/30 p-4">
                  <p className="mb-3 text-sm font-semibold text-foreground">
                    Datos de {tipoSel.nombre}
                  </p>
                  <div className="grid gap-4 sm:grid-cols-2">
                    {tipoSel.camposDef
                      .slice()
                      .sort((a, b) => a.orden - b.orden)
                      .map((c) => (
                        <div key={c.clave} className="space-y-1.5">
                          <Label className="text-sm font-medium text-foreground">
                            {c.etiqueta}
                            {c.requerido ? " *" : ""}
                          </Label>
                          {c.tipo === "textarea" ? (
                            <textarea
                              className="flex min-h-[80px] w-full rounded-xl border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-ring"
                              value={campos[c.clave] || ""}
                              onChange={(e) =>
                                setCampos({ ...campos, [c.clave]: e.target.value })
                              }
                            />
                          ) : c.tipo === "select" ? (
                            <select
                              className="flex h-10 w-full rounded-xl border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                              value={campos[c.clave] || ""}
                              onChange={(e) =>
                                setCampos({ ...campos, [c.clave]: e.target.value })
                              }
                            >
                              <option value="">Seleccionar...</option>
                              {(c.opciones ? JSON.parse(c.opciones) : []).map((o: string) => (
                                <option key={o} value={o}>{o}</option>
                              ))}
                            </select>
                          ) : (
                            <Input
                              type={c.tipo === "number" ? "number" : "text"}
                              value={campos[c.clave] || ""}
                              onChange={(e) =>
                                setCampos({ ...campos, [c.clave]: e.target.value })
                              }
                              className="h-10 rounded-xl border-border"
                            />
                          )}
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>

            <div className="mt-6 flex gap-3">
              <Button
                variant="outline"
                onClick={() => setStep(2)}
                className="gap-2 border-border"
              >
                <ArrowLeft className="h-4 w-4" /> Atrás
              </Button>
              <Button
                className="flex-1 h-11 gap-2 rounded-xl font-semibold"
                onClick={submit}
                disabled={loading || !canSubmit}
                style={{ background: "oklch(0.13 0.02 265)", color: "oklch(0.992 0.004 80)" }}
              >
                {loading ? "Activando..." : <>Activar mi Pase Digital <Zap className="h-4 w-4" /></>}
              </Button>
            </div>
          </div>
        )}
      </div>

      <footer className="mt-auto border-t border-border bg-background">
        <div className="mx-auto max-w-6xl px-4 py-5 text-center text-xs text-muted-foreground">
          Pase Digital · Acceso Exclusivo
        </div>
      </footer>
    </div>
  );
}
