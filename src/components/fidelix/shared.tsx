"use client";
import { cn } from "@/lib/utils";
import { ESTADO_LABEL, ESTADO_COLOR, TIPOS_ESTRATEGIA } from "@/lib/constants";
import { Card } from "@/components/ui/card";

export function EstadoBadge({ estado }: { estado: string }) {
  const label = ESTADO_LABEL[estado] || estado;

  const map: Record<string, string> = {
    ACTIVA:    "bg-emerald-50 text-emerald-700 border-emerald-200",
    INACTIVA:  "bg-zinc-100 text-zinc-500 border-zinc-200",
    PENDIENTE: "bg-amber-50 text-amber-700 border-amber-200",
    VENCIDA:   "bg-red-50 text-red-600 border-red-200",
    CANJEADA:  "bg-violet-50 text-violet-700 border-violet-200",
  };

  const color = map[estado] || "bg-zinc-100 text-zinc-600 border-zinc-200";
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold",
        color
      )}
    >
      {label}
    </span>
  );
}

export function TipoEstrategiaBadge({ tipo }: { tipo: string }) {
  const t = TIPOS_ESTRATEGIA.find((x) => x.value === tipo);
  const colores: Record<string, string> = {
    MEMBRESIA:        "bg-sky-50 text-sky-700 border-sky-200",
    CONTEO_VISITAS:   "bg-violet-50 text-violet-700 border-violet-200",
    PUNTOS:           "bg-amber-50 text-amber-700 border-amber-200",
    CUPON:            "bg-pink-50 text-pink-700 border-pink-200",
    PROMOCION_TIEMPO: "bg-emerald-50 text-emerald-700 border-emerald-200",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold",
        colores[tipo] || "bg-zinc-100 text-zinc-700 border-zinc-200"
      )}
    >
      {t?.label || tipo}
    </span>
  );
}

export function RolBadge({ rol }: { rol: string }) {
  const labels: Record<string, string> = {
    SUPERADMIN:    "Superadmin",
    ADMIN_EMPRESA: "Admin Empresa",
    EMPLEADO:      "Empleado",
    CLIENTE:       "Cliente",
  };
  const colores: Record<string, string> = {
    SUPERADMIN:    "bg-foreground text-background border-foreground/80",
    ADMIN_EMPRESA: "bg-sky-50 text-sky-700 border-sky-200",
    EMPLEADO:      "bg-emerald-50 text-emerald-700 border-emerald-200",
    CLIENTE:       "bg-violet-50 text-violet-700 border-violet-200",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold",
        colores[rol] || "bg-zinc-100 text-zinc-600 border-zinc-200"
      )}
    >
      {labels[rol] || rol}
    </span>
  );
}

export function StatCard({
  label,
  value,
  icon,
  accent = "bg-muted text-muted-foreground",
  trend,
}: {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
  accent?: string;
  trend?: { value: number; label?: string };
}) {
  return (
    <Card className="p-0 overflow-hidden rounded-2xl gap-0">
      <div className="flex items-start justify-between gap-3 p-5">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium text-muted-foreground truncate">{label}</p>
          <p className="mt-1.5 text-2xl font-extrabold tracking-tight text-foreground tabular-nums">
            {value}
          </p>
          {trend && (
            <p
              className={cn(
                "mt-1 text-xs font-medium",
                trend.value >= 0 ? "text-emerald-600" : "text-red-500"
              )}
            >
              {trend.value >= 0 ? "+" : ""}
              {trend.value}% {trend.label}
            </p>
          )}
        </div>
        {icon && (
          <div
            className={cn(
              "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
              accent
            )}
          >
            {icon}
          </div>
        )}
      </div>
    </Card>
  );
}

export function SectionHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between mb-6">
      <div>
        <h2 className="text-xl font-extrabold tracking-tight text-foreground leading-tight">
          {title}
        </h2>
        {description && (
          <p className="text-sm text-muted-foreground mt-1 leading-relaxed max-w-lg">
            {description}
          </p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

export function EmptyState({
  title,
  description,
  icon,
  action,
}: {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-muted/20 py-14 text-center px-6">
      {icon && (
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-border bg-card text-muted-foreground">
          {icon}
        </div>
      )}
      <p className="font-semibold text-foreground">{title}</p>
      {description && (
        <p className="mt-1.5 max-w-xs text-sm text-muted-foreground leading-relaxed">
          {description}
        </p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
