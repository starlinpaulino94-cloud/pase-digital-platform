"use client";
import { useEffect, useState } from "react";
import { useStore, type AdminSection } from "./store";
import { api, type Empresa } from "./api-client";
import { Button } from "@/components/ui/button";
import {
  QrCode,
  LayoutDashboard,
  Building2,
  Users,
  Sparkles,
  CreditCard,
  ScanLine,
  History,
  BarChart3,
  Settings,
  LogOut,
  Menu,
  X,
  ShieldCheck,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { RolBadge } from "./shared";
import { SuperadminPanel } from "./panels/SuperadminPanel";
import { EmpresaPanel } from "./panels/EmpresaPanel";
import { EmpleadoPanel } from "./panels/EmpleadoPanel";

type NavItem = { section: AdminSection; label: string; icon: React.ReactNode; color?: string };

const NAV_BY_ROLE: Record<string, NavItem[]> = {
  SUPERADMIN: [
    { section: "dashboard",     label: "Dashboard",        icon: <LayoutDashboard className="h-4 w-4" />, color: "#6366f1" },
    { section: "empresas",      label: "Empresas",         icon: <Building2 className="h-4 w-4" />,       color: "#0ea5e9" },
    { section: "clientes",      label: "Clientes",         icon: <Users className="h-4 w-4" />,           color: "#10b981" },
    { section: "beneficios",    label: "Promociones",      icon: <Sparkles className="h-4 w-4" />,        color: "#f59e0b" },
    { section: "pagos",         label: "Pagos pendientes", icon: <CreditCard className="h-4 w-4" />,      color: "#ec4899" },
    { section: "escanear",      label: "Escanear QR",      icon: <ScanLine className="h-4 w-4" />,        color: "#8b5cf6" },
    { section: "usos",          label: "Usos registrados", icon: <History className="h-4 w-4" />,         color: "#14b8a6" },
    { section: "reportes",      label: "Reportes",         icon: <BarChart3 className="h-4 w-4" />,       color: "#f97316" },
    { section: "configuracion", label: "Configuración",    icon: <Settings className="h-4 w-4" />,        color: "#6b7280" },
  ],
  ADMIN_EMPRESA: [
    { section: "dashboard",     label: "Dashboard",        icon: <LayoutDashboard className="h-4 w-4" />, color: "#6366f1" },
    { section: "clientes",      label: "Clientes",         icon: <Users className="h-4 w-4" />,           color: "#10b981" },
    { section: "beneficios",    label: "Promociones",      icon: <Sparkles className="h-4 w-4" />,        color: "#f59e0b" },
    { section: "pagos",         label: "Pagos pendientes", icon: <CreditCard className="h-4 w-4" />,      color: "#ec4899" },
    { section: "escanear",      label: "Escanear QR",      icon: <ScanLine className="h-4 w-4" />,        color: "#8b5cf6" },
    { section: "usos",          label: "Usos registrados", icon: <History className="h-4 w-4" />,         color: "#14b8a6" },
    { section: "reportes",      label: "Reportes",         icon: <BarChart3 className="h-4 w-4" />,       color: "#f97316" },
    { section: "configuracion", label: "Configuración",    icon: <Settings className="h-4 w-4" />,        color: "#6b7280" },
  ],
  EMPLEADO: [
    { section: "escanear", label: "Escanear QR",      icon: <ScanLine className="h-4 w-4" />, color: "#8b5cf6" },
    { section: "usos",     label: "Usos registrados", icon: <History className="h-4 w-4" />,  color: "#14b8a6" },
  ],
};

/* ─── Nav list ────────────────────────────────────────────── */

type NavListProps = {
  nav: NavItem[];
  currentSection: AdminSection;
  onSelect: (s: AdminSection) => void;
  onNavigate?: () => void;
};

function NavList({ nav, currentSection, onSelect, onNavigate }: NavListProps) {
  return (
    <nav className="flex-1 overflow-y-auto p-2 space-y-0.5">
      {nav.map((item) => {
        const active = currentSection === item.section;
        return (
          <button
            key={item.section}
            onClick={() => {
              onSelect(item.section);
              onNavigate?.();
            }}
            className={cn(
              "group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150",
              active
                ? "text-white"
                : "text-white/45 hover:text-white/80 hover:bg-white/5"
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
            {/* Icon container */}
            <span
              className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md transition-all duration-150"
              style={
                active
                  ? { backgroundColor: (item.color || "#C9A84C") + "28", color: item.color || "oklch(0.74 0.115 78)" }
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
  );
}

/* ─── Admin Shell ─────────────────────────────────────────── */

export function AdminShell() {
  const { user, adminSection, setAdminSection, logout, showToast } = useStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [empresaNombre, setEmpresaNombre] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const empresaId = user?.empresaId;
    if (!empresaId) {
      Promise.resolve().then(() => {
        if (!cancelled) setEmpresaNombre(null);
      });
      return () => { cancelled = true; };
    }
    api
      .get<{ empresa: Empresa }>(`/api/empresas/${empresaId}`)
      .then((r) => { if (!cancelled) setEmpresaNombre(r.empresa.nombre); })
      .catch(() => { if (!cancelled) setEmpresaNombre(null); });
    return () => { cancelled = true; };
  }, [user?.empresaId]);

  if (!user) return null;

  const nav = NAV_BY_ROLE[user.rol] || [];
  const currentSection: AdminSection = nav.some((n) => n.section === adminSection)
    ? adminSection
    : nav[0]?.section || "dashboard";

  function renderPanel() {
    if (user.rol === "SUPERADMIN")   return <SuperadminPanel section={currentSection} />;
    if (user.rol === "ADMIN_EMPRESA") return <EmpresaPanel section={currentSection} />;
    if (user.rol === "EMPLEADO")      return <EmpleadoPanel section={currentSection} />;
    return null;
  }

  const sidebarContent = (
    <>
      {/* Logo */}
      <div className="flex h-16 shrink-0 items-center gap-3 border-b border-white/6 px-4">
        <div
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
          style={{ background: "oklch(0.74 0.115 78)" }}
        >
          <QrCode className="h-4 w-4 text-[#111118]" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-bold tracking-wide text-white leading-none">
            PASE DIGITAL
          </p>
          <p className="mt-0.5 text-[9px] tracking-[0.15em] uppercase text-white/30 leading-none">
            Panel Interno
          </p>
        </div>
      </div>

      {/* Nav */}
      <NavList
        nav={nav}
        currentSection={currentSection}
        onSelect={setAdminSection}
        onNavigate={() => setSidebarOpen(false)}
      />

      {/* User info + logout */}
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
          {/* Left */}
          <div className="flex items-center gap-3">
            <button
              className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors lg:hidden"
              onClick={() => setSidebarOpen(true)}
              aria-label="Abrir menú"
            >
              <Menu className="h-5 w-5" />
            </button>

            {/* Breadcrumb */}
            <div className="hidden sm:flex items-center gap-2 text-sm">
              <span className="font-semibold text-foreground">
                {nav.find((n) => n.section === currentSection)?.label || "Panel"}
              </span>
              {empresaNombre && (
                <>
                  <span className="text-muted-foreground/40">/</span>
                  <span className="text-muted-foreground">{empresaNombre}</span>
                </>
              )}
            </div>
          </div>

          {/* Right */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2.5">
              <span className="inline-flex items-center gap-1 rounded-full border border-border bg-muted/50 px-2.5 py-1 text-[11px] font-medium text-muted-foreground">
                <ShieldCheck className="h-3 w-3" /> Panel interno
              </span>
              <div className="h-5 w-px bg-border" />
              <div className="text-right">
                <p className="text-sm font-medium leading-none text-foreground">{user.nombre}</p>
                <p className="mt-0.5 text-[11px] leading-none text-muted-foreground">{user.email}</p>
              </div>
            </div>
            <RolBadge rol={user.rol} />
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

        {/* ── Sidebar mobile drawer ── */}
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
                    <QrCode className="h-3.5 w-3.5 text-[#111118]" />
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

        {/* ── Main content ── */}
        <main className="flex-1 overflow-auto min-w-0">
          <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
            {renderPanel()}
          </div>
        </main>
      </div>
    </div>
  );
}
