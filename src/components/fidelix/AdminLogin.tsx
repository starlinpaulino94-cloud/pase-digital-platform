"use client";
import { useState } from "react";
import { useStore } from "./store";
import { api } from "./api-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { QrCode, Lock, ShieldAlert, ArrowLeft, Mail } from "lucide-react";

export function AdminLogin() {
  const { setUser, navigate, logout, showToast } = useStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !password) { setError("Ingresa email y contraseña"); return; }
    setLoading(true);
    setError(null);
    try {
      const res = await api.post<{ user: any }>("/api/auth", { email, password });
      if (!res.user) { setError("No se pudo iniciar sesión"); setLoading(false); return; }
      if (res.user.rol === "CLIENTE") {
        logout();
        setError("Esta cuenta no tiene acceso administrativo");
        setLoading(false);
        return;
      }
      setUser(res.user);
      showToast("Bienvenido, " + res.user.nombre, "success");
      navigate("admin-app");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Credenciales inválidas");
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Background gradient */}
      <div
        className="pointer-events-none fixed inset-0"
        style={{
          background:
            "radial-gradient(ellipse 60% 35% at 50% 0%, oklch(0.93 0.04 80 / 0.35), transparent)",
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
              <QrCode className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight text-foreground">
                Panel administrativo
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">Solo personal autorizado</p>
            </div>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/50 px-3 py-1 text-[11px] font-semibold text-muted-foreground">
              <ShieldAlert className="h-3 w-3" /> Acceso restringido
            </span>
          </div>

          {/* Form card */}
          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <form onSubmit={submit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="admin-email" className="text-sm font-medium text-foreground">
                  Correo electrónico
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/60" />
                  <Input
                    id="admin-email"
                    type="email"
                    autoComplete="username"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@empresa.com"
                    required
                    className="pl-9 h-10 rounded-xl"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="admin-password" className="text-sm font-medium text-foreground">
                  Contraseña
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/60" />
                  <Input
                    id="admin-password"
                    type="password"
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="pl-9 h-10 rounded-xl"
                  />
                </div>
              </div>

              {error && (
                <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">
                  <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-red-500" />
                  {error}
                </div>
              )}

              <Button
                type="submit"
                className="w-full h-10 rounded-xl font-semibold gap-2"
                disabled={loading}
                style={{
                  background: loading ? undefined : "oklch(0.13 0.02 265)",
                  color: "oklch(0.992 0.004 80)",
                }}
              >
                {loading ? (
                  <>
                    <div className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                    Ingresando...
                  </>
                ) : "Ingresar al panel"}
              </Button>
            </form>

            <p className="mt-4 text-center text-[11px] text-muted-foreground/70">
              El acceso no autorizado queda registrado. Use solo credenciales provistas por el administrador.
            </p>
          </div>

          <div className="mt-5 text-center">
            <button
              type="button"
              onClick={() => navigate("landing")}
              className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors link-underline"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Volver al sitio público
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
