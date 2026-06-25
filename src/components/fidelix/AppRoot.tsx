"use client";
import { useEffect } from "react";
import { useStore } from "./store";
import { api } from "./api-client";
import { Landing, RegisterScreen, ClientLogin } from "./AuthScreens";
import { AdminLogin } from "./AdminLogin";
import { AdminShell } from "./AdminShell";
import { ClienteShell } from "./ClienteShell";

export function AppRoot() {
  const { user, loading, route, setUser, setLoading, navigate, setRoute } = useStore();

  useEffect(() => {
    api
      .get<{ user: any }>("/api/auth")
      .then((r) => {
        if (r.user) {
          setUser(r.user);
          // Si hay sesión y estamos en una ruta de login o landing, dirigir al app correspondiente
          const currentHash = window.location.hash.replace(/^#/, "");
          if (r.user.rol === "CLIENTE") {
            if (currentHash === "mi-qr" || currentHash === "" || currentHash === "registro") setRoute("cliente-app");
          } else {
            // admin / superadmin / empleado
            if (currentHash === "admin" || currentHash === "admin-login" || currentHash === "") setRoute("admin-app");
            else if (currentHash === "mi-qr" || currentHash === "registro") setRoute("admin-app");
          }
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [setUser, setLoading, setRoute]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4 animate-fade-in">
          <div
            className="flex h-14 w-14 items-center justify-center rounded-2xl shadow-midnight"
            style={{ background: "oklch(0.13 0.02 265)" }}
          >
            <svg className="h-7 w-7 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="7" height="7" />
              <rect x="14" y="3" width="7" height="7" />
              <rect x="3" y="14" width="7" height="7" />
              <path d="M14 14h7v7h-7z" />
            </svg>
          </div>
          <div className="text-center">
            <p className="text-sm font-bold tracking-wide text-foreground">PASE DIGITAL</p>
            <p className="text-xs text-muted-foreground mt-0.5">Cargando...</p>
          </div>
        </div>
      </div>
    );
  }

  let content: React.ReactNode = null;
  if (route === "admin-app") {
    // Requiere sesión admin
    if (user && user.rol !== "CLIENTE") content = <AdminShell />;
    else content = <AdminLogin />;
  } else if (route === "admin-login") {
    if (user && user.rol !== "CLIENTE") {
      // ya autenticado como admin → ir al panel
      navigate("admin-app");
      content = <AdminShell />;
    } else content = <AdminLogin />;
  } else if (route === "cliente-app") {
    if (user && user.rol === "CLIENTE") content = <ClienteShell />;
    else content = <ClientLogin />;
  } else if (route === "cliente-login") {
    if (user && user.rol === "CLIENTE") {
      navigate("cliente-app");
      content = <ClienteShell />;
    } else content = <ClientLogin />;
  } else if (route === "registro") {
    content = <RegisterScreen />;
  } else {
    content = <Landing />;
  }

  return (
    <>
      {content}
      <Toast />
    </>
  );
}

function Toast() {
  const { toast, clearToast } = useStore();
  if (!toast) return null;

  const styles: Record<string, { bg: string; border: string; text: string; dot: string }> = {
    success: { bg: "bg-emerald-50", border: "border-emerald-200", text: "text-emerald-800", dot: "bg-emerald-500" },
    error:   { bg: "bg-red-50",     border: "border-red-200",     text: "text-red-800",     dot: "bg-red-500" },
    info:    { bg: "bg-card",       border: "border-border",      text: "text-foreground",  dot: "bg-foreground/60" },
  };
  const s = styles[toast.type] || styles.info;

  return (
    <div className="fixed bottom-4 right-4 z-50 animate-fade-up">
      <div
        className={`${s.bg} ${s.border} ${s.text} rounded-2xl border shadow-midnight px-4 py-3 text-sm max-w-sm flex items-start gap-3`}
      >
        <span className={`mt-0.5 h-2 w-2 shrink-0 rounded-full ${s.dot}`} />
        <span className="flex-1 font-medium">{toast.msg}</span>
        <button
          onClick={clearToast}
          className="shrink-0 rounded p-0.5 opacity-50 hover:opacity-100 transition-opacity"
          aria-label="Cerrar"
        >
          ×
        </button>
      </div>
    </div>
  );
}
