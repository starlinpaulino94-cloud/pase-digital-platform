"use client";
import { useState } from "react";
import { useStore, fmtMonto, fmtFechaHora } from "../store";
import { api, type ScanResult } from "../api-client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { QrScanner, ManualTokenInput } from "../QrComponents";
import { SectionHeader, EstadoBadge, TipoEstrategiaBadge, EmptyState } from "../shared";
import { SERVICIOS_NEGOCIO } from "@/lib/constants";
import {
  ScanLine,
  CheckCircle2,
  AlertCircle,
  User,
  Sparkles,
  History,
  RotateCcw,
  Phone,
  Mail,
  Car,
  Hash,
  Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";

export function ScannerFlow() {
  const { showToast } = useStore();
  const [result, setResult] = useState<ScanResult | null>(null);
  const [scannedToken, setScannedToken] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedCE, setSelectedCE] = useState<string | null>(null);
  const [tipoConsumo, setTipoConsumo] = useState<string>("");
  const [monto, setMonto] = useState<string>("");
  const [confirming, setConfirming] = useState(false);
  const [confirmed, setConfirmed] = useState<{ beneficio: string | null } | null>(null);

  const servicios = result ? SERVICIOS_NEGOCIO[result.cliente.tipoNegocio.slug] || ["Otro"] : [];

  async function handleToken(token: string) {
    setLoading(true);
    setError(null);
    setResult(null);
    setScannedToken(token);
    setConfirmed(null);
    setSelectedCE(null);
    setTipoConsumo("");
    setMonto("");
    try {
      const r = await api.post<{
        cliente: ScanResult["cliente"];
        estrategias: any[];
        historial: any[];
      }>("/api/qr/scan", { token });
      setResult({ cliente: r.cliente, estrategias: r.estrategias, historial: r.historial });
      const activa = r.estrategias.find((e) => e.estado === "ACTIVA");
      if (activa) setSelectedCE(activa.id);
      showToast("QR validado correctamente", "success");
    } catch (e) {
      setError(e instanceof Error ? e.message : "QR inválido");
    } finally {
      setLoading(false);
    }
  }

  async function confirm() {
    if (!result || !tipoConsumo) {
      showToast("Selecciona el tipo de consumo", "error");
      return;
    }
    setConfirming(true);
    try {
      const r = await api.post<{ beneficioAplicado: string | null }>("/api/qr/confirm", {
        token: scannedToken,
        clienteEstrategiaId: selectedCE,
        tipoConsumo,
        montoConsumo: monto ? Number(monto) : 0,
      });
      setConfirmed({ beneficio: r.beneficioAplicado });
      showToast("Uso registrado", "success");
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Error al confirmar", "error");
    } finally {
      setConfirming(false);
    }
  }

  function reset() {
    setResult(null);
    setError(null);
    setConfirmed(null);
    setSelectedCE(null);
    setTipoConsumo("");
    setMonto("");
    setScannedToken("");
  }

  /* ── Confirmed screen ── */
  if (confirmed) {
    return (
      <div>
        <SectionHeader title="Uso confirmado" />
        <div className="flex flex-col items-center justify-center py-16 text-center animate-scale-in">
          <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full border-4 border-emerald-100 bg-emerald-50">
            <CheckCircle2 className="h-10 w-10 text-emerald-600" />
          </div>
          <h3 className="text-xl font-extrabold text-foreground">Transacción registrada</h3>
          {confirmed.beneficio && (
            <div className="mt-3 inline-flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-700">
              <Sparkles className="h-4 w-4" />
              {confirmed.beneficio}
            </div>
          )}
          <Button
            className="mt-8 gap-2"
            onClick={reset}
            style={{ background: "oklch(0.13 0.02 265)", color: "oklch(0.992 0.004 80)" }}
          >
            <RotateCcw className="h-4 w-4" /> Escanear otro QR
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <SectionHeader
        title="Escanear QR"
        description="Valida el QR del cliente y confirma el uso. El escaneo por sí solo no consume beneficios."
      />

      <div className="grid gap-6 lg:grid-cols-2">
        {/* ── Scanner card ── */}
        <Card className="overflow-hidden rounded-2xl p-0 gap-0">
          <div className="flex items-center gap-2.5 border-b border-border px-5 py-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted">
              <ScanLine className="h-4 w-4 text-muted-foreground" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">Cámara</p>
              <p className="text-xs text-muted-foreground">Apunta al QR del cliente</p>
            </div>
          </div>
          <div className="p-5">
            <QrScanner onScan={handleToken} onError={(m) => setError(m)} />
            <div className="mt-5 border-t border-border pt-4">
              <p className="mb-2 text-xs font-medium text-muted-foreground">
                ¿Sin cámara? Introduce el token manualmente:
              </p>
              <ManualTokenInput onSubmit={handleToken} />
            </div>
          </div>
        </Card>

        {/* ── Result panel ── */}
        <div className="space-y-4">
          {loading && (
            <Card className="rounded-2xl">
              <CardContent className="flex flex-col items-center justify-center py-14 text-center gap-3">
                <div className="h-8 w-8 rounded-full border-2 border-border border-t-foreground animate-spin" />
                <p className="text-sm text-muted-foreground font-medium">Validando QR...</p>
              </CardContent>
            </Card>
          )}

          {error && (
            <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-red-100">
                <AlertCircle className="h-4 w-4 text-red-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-red-700">QR inválido</p>
                <p className="mt-0.5 text-sm text-red-600">{error}</p>
              </div>
            </div>
          )}

          {result && (
            <>
              {/* Cliente info */}
              <Card className="overflow-hidden rounded-2xl p-0 gap-0">
                <div className="border-b border-border px-5 py-4">
                  <div className="flex items-center gap-2.5">
                    <div
                      className="flex h-8 w-8 items-center justify-center rounded-lg"
                      style={{ background: "oklch(0.93 0.04 80)", color: "oklch(0.48 0.11 78)" }}
                    >
                      <User className="h-4 w-4" />
                    </div>
                    <p className="text-sm font-semibold text-foreground">Titular</p>
                  </div>
                </div>
                <div className="p-5">
                  <div className="flex items-start gap-4">
                    <div
                      className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-lg font-extrabold text-white"
                      style={{ background: "oklch(0.13 0.02 265)" }}
                    >
                      {result.cliente.nombre.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-foreground">{result.cliente.nombre}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {result.cliente.empresa.nombre} · {result.cliente.tipoNegocio.nombre}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 space-y-1.5">
                    {result.cliente.telefono && (
                      <p className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Phone className="h-3.5 w-3.5 shrink-0" /> {result.cliente.telefono}
                      </p>
                    )}
                    {result.cliente.email && (
                      <p className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Mail className="h-3.5 w-3.5 shrink-0" /> {result.cliente.email}
                      </p>
                    )}
                    {result.cliente.camposDinamicos.length > 0 && (
                      <div className="mt-2 rounded-xl border border-border bg-muted/30 p-3 space-y-1">
                        {result.cliente.camposDinamicos.map((c) => (
                          <p key={c.id} className="flex items-center gap-2 text-sm">
                            <Hash className="h-3 w-3 shrink-0 text-muted-foreground" />
                            <span className="text-muted-foreground capitalize">{c.clave}:</span>
                            <span className="font-medium text-foreground">{c.valor}</span>
                          </p>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </Card>

              {/* Beneficios */}
              <Card className="overflow-hidden rounded-2xl p-0 gap-0">
                <div className="border-b border-border px-5 py-4 flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50">
                    <Sparkles className="h-4 w-4 text-amber-600" />
                  </div>
                  <p className="text-sm font-semibold text-foreground">Beneficios</p>
                </div>
                <div className="p-4 space-y-2">
                  {result.estrategias.length === 0 && (
                    <p className="py-4 text-center text-sm text-muted-foreground">
                      Sin beneficios asignados.
                    </p>
                  )}
                  {result.estrategias.map((e) => {
                    const active = e.estado === "ACTIVA";
                    const selected = selectedCE === e.id;
                    return (
                      <button
                        key={e.id}
                        onClick={() => active && setSelectedCE(e.id)}
                        disabled={!active}
                        className={cn(
                          "w-full text-left rounded-xl border p-3.5 transition-all duration-150",
                          selected
                            ? "border-foreground bg-foreground/5"
                            : active
                            ? "border-border bg-card hover:border-foreground/30"
                            : "border-border bg-muted/30 opacity-50 cursor-not-allowed"
                        )}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-foreground">{e.estrategia.nombre}</p>
                            <div className="mt-1.5 flex flex-wrap items-center gap-2">
                              <TipoEstrategiaBadge tipo={e.estrategia.tipoEstrategia} />
                              <EstadoBadge estado={e.estado} />
                            </div>
                          </div>
                          <div className="shrink-0 text-right text-xs text-muted-foreground">
                            {e.estrategia.tipoEstrategia === "MEMBRESIA" && (
                              <p className="font-bold text-emerald-600 text-sm">{e.usosDisponibles} usos</p>
                            )}
                            {e.estrategia.tipoEstrategia === "CONTEO_VISITAS" && (
                              <p className="font-bold text-violet-600 text-sm">
                                {e.visitasAcumuladas}/{e.estrategia.metaVisitas}
                              </p>
                            )}
                            {e.estrategia.tipoEstrategia === "PUNTOS" && (
                              <p className="font-bold text-amber-600 text-sm">
                                {e.puntosAcumulados.toFixed(0)} pts
                              </p>
                            )}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </Card>

              {/* Confirmar uso */}
              <Card className="overflow-hidden rounded-2xl p-0 gap-0">
                <div className="border-b border-border px-5 py-4 flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  </div>
                  <p className="text-sm font-semibold text-foreground">Confirmar uso</p>
                </div>
                <div className="p-5 space-y-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Tipo de consumo *</Label>
                    <div className="flex flex-wrap gap-2">
                      {servicios.map((s) => (
                        <button
                          key={s}
                          onClick={() => setTipoConsumo(s)}
                          className={cn(
                            "rounded-full border px-3.5 py-1.5 text-sm font-medium transition-all",
                            tipoConsumo === s
                              ? "border-foreground bg-foreground text-background"
                              : "border-border bg-card hover:border-foreground/40"
                          )}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium">
                      Monto consumido{" "}
                      <span className="font-normal text-muted-foreground">(RD$, opcional)</span>
                    </Label>
                    <Input
                      type="number"
                      value={monto}
                      onChange={(e) => setMonto(e.target.value)}
                      placeholder="0.00"
                      className="h-10 rounded-xl"
                    />
                  </div>

                  <Button
                    className="w-full h-11 gap-2 rounded-xl font-semibold"
                    onClick={confirm}
                    disabled={confirming || !tipoConsumo}
                    style={{ background: "oklch(0.13 0.02 265)", color: "oklch(0.992 0.004 80)" }}
                  >
                    {confirming ? (
                      <>
                        <div className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                        Confirmando...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="h-4 w-4" /> Confirmar uso
                      </>
                    )}
                  </Button>
                  <p className="text-center text-xs text-muted-foreground">
                    Solo al confirmar se descuenta el uso del beneficio.
                  </p>
                </div>
              </Card>

              {/* Historial */}
              {result.historial.length > 0 && (
                <Card className="overflow-hidden rounded-2xl p-0 gap-0">
                  <div className="border-b border-border px-5 py-4 flex items-center gap-2.5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted">
                      <History className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <p className="text-sm font-semibold text-foreground">Últimas visitas</p>
                  </div>
                  <div className="divide-y divide-border max-h-52 overflow-y-auto">
                    {result.historial.map((t) => (
                      <div key={t.id} className="flex items-center justify-between px-5 py-3 text-sm">
                        <div>
                          <p className="font-medium text-foreground">{t.tipoConsumo}</p>
                          <p className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                            <Clock className="h-3 w-3" />
                            {fmtFechaHora(t.fechaTransaccion)}
                          </p>
                        </div>
                        {t.montoConsumo > 0 && (
                          <span className="font-semibold text-foreground tabular-nums">
                            {fmtMonto(t.montoConsumo)}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </Card>
              )}
            </>
          )}

          {!loading && !error && !result && (
            <EmptyState
              icon={<ScanLine className="h-8 w-8" />}
              title="Esperando escaneo"
              description="Escanea el QR del cliente con la cámara o introduce el token manualmente."
            />
          )}
        </div>
      </div>
    </div>
  );
}
