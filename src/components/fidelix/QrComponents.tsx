"use client";
import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import { Button } from "@/components/ui/button";
import { Download, Camera, CameraOff, KeyRound, Shield, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

/* ─── QR Display Premium ──────────────────────────────────── */

export function QrDisplay({
  token,
  label,
  size = 200,
  empresaNombre,
  titularNombre,
}: {
  token: string;
  label?: string;
  size?: number;
  empresaNombre?: string;
  titularNombre?: string;
}) {
  const [url, setUrl] = useState<string>("");

  useEffect(() => {
    QRCode.toDataURL(token, {
      width: size * 2,
      margin: 1,
      color: { dark: "#111118", light: "#ffffff" },
      errorCorrectionLevel: "M",
    })
      .then(setUrl)
      .catch(() => setUrl(""));
  }, [token, size]);

  return (
    <div className="flex flex-col items-center gap-4">
      {/* ── Membership card ── */}
      <div
        className="relative w-full max-w-xs overflow-hidden rounded-3xl select-none"
        style={{
          background: "linear-gradient(135deg, #111118 0%, #1A1A2E 50%, #0F0F1A 100%)",
          boxShadow:
            "0 25px 50px -12px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.06) inset",
        }}
      >
        {/* Gold top stripe */}
        <div
          className="absolute top-0 inset-x-0 h-0.5"
          style={{
            background:
              "linear-gradient(90deg, transparent, oklch(0.74 0.115 78), oklch(0.86 0.10 78), oklch(0.74 0.115 78), transparent)",
          }}
        />

        {/* Background pattern */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
            backgroundSize: "20px 20px",
          }}
        />

        {/* Decorative glow */}
        <div
          className="absolute -top-12 -right-12 h-40 w-40 rounded-full opacity-10"
          style={{ background: "oklch(0.74 0.115 78)" }}
        />

        <div className="relative p-5">
          {/* Header */}
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2.5">
              <div
                className="flex h-8 w-8 items-center justify-center rounded-lg"
                style={{ background: "oklch(0.74 0.115 78)" }}
              >
                <KeyRound className="h-4 w-4 text-[#111118]" />
              </div>
              <div>
                <p className="text-white font-bold text-xs tracking-[0.12em] uppercase leading-none">
                  Pase Digital
                </p>
                <p
                  className="text-[9px] tracking-[0.18em] uppercase mt-0.5 leading-none"
                  style={{ color: "oklch(0.74 0.115 78)" }}
                >
                  Acceso Exclusivo
                </p>
              </div>
            </div>
            {/* Decorative circles */}
            <div className="flex items-center gap-1.5">
              <div
                className="h-6 w-6 rounded-full opacity-20"
                style={{ background: "oklch(0.74 0.115 78)" }}
              />
              <div
                className="h-6 w-6 rounded-full -ml-3 opacity-35"
                style={{ background: "oklch(0.86 0.10 78)" }}
              />
            </div>
          </div>

          {/* QR code */}
          <div className="flex justify-center mb-5">
            <div className="relative">
              {/* Outer glow */}
              <div
                className="absolute inset-0 rounded-2xl blur-lg scale-110 opacity-25"
                style={{ background: "oklch(0.74 0.115 78)" }}
              />
              {/* QR container */}
              <div className="relative rounded-2xl bg-white p-3 shadow-lg">
                {url ? (
                  <img
                    src={url}
                    alt="Código QR del Pase Digital"
                    width={size}
                    height={size}
                    className="rounded-lg block"
                  />
                ) : (
                  <div
                    style={{ width: size, height: size }}
                    className="rounded-lg bg-slate-100 animate-pulse"
                  />
                )}
              </div>
              {/* Corner marks */}
              {[
                "top-0 left-0 border-t-2 border-l-2 rounded-tl-lg",
                "top-0 right-0 border-t-2 border-r-2 rounded-tr-lg",
                "bottom-0 left-0 border-b-2 border-l-2 rounded-bl-lg",
                "bottom-0 right-0 border-b-2 border-r-2 rounded-br-lg",
              ].map((cls, i) => (
                <div
                  key={i}
                  className={cn("absolute h-4 w-4", cls)}
                  style={{ borderColor: "oklch(0.74 0.115 78)" }}
                />
              ))}
            </div>
          </div>

          {/* Footer info */}
          <div className="flex items-end justify-between">
            <div>
              {titularNombre && (
                <>
                  <p className="text-white/35 text-[9px] tracking-[0.15em] uppercase mb-0.5">
                    Titular
                  </p>
                  <p className="text-white font-semibold text-sm leading-tight">
                    {titularNombre}
                  </p>
                </>
              )}
              {empresaNombre && (
                <p className="text-white/50 text-[10px] mt-0.5">{empresaNombre}</p>
              )}
            </div>
            <div className="text-right">
              <p className="text-white/35 text-[9px] tracking-[0.15em] uppercase mb-0.5">
                Estado
              </p>
              <div className="flex items-center gap-1">
                <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <p className="text-emerald-400 font-semibold text-xs">Activo</p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom shine */}
        <div
          className="absolute bottom-0 inset-x-0 h-px opacity-10"
          style={{
            background:
              "linear-gradient(90deg, transparent, white 40%, white 60%, transparent)",
          }}
        />
      </div>

      {/* Actions */}
      {url && (
        <a href={url} download={`pase-digital-${token.slice(0, 8)}.png`}>
          <Button
            variant="outline"
            size="sm"
            className="gap-2 border-border hover:border-brand hover:text-brand-emphasis transition-colors"
          >
            <Download className="h-3.5 w-3.5" />
            Descargar Pase
          </Button>
        </a>
      )}

      {/* Security note */}
      <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
        <Shield className="h-3 w-3 shrink-0" />
        <span>Este código es único e intransferible</span>
      </div>
    </div>
  );
}

/* ─── QR Scanner ──────────────────────────────────────────── */

export function QrScanner({
  onScan,
  onError,
}: {
  onScan: (token: string) => void;
  onError?: (msg: string) => void;
}) {
  const containerId = "pase-digital-qr-reader";
  const scannerRef = useRef<any>(null);
  const [active, setActive] = useState(false);
  const [starting, setStarting] = useState(false);
  const lastScanRef = useRef<{ token: string; t: number }>({ token: "", t: 0 });

  async function start() {
    setStarting(true);
    try {
      const { Html5Qrcode } = await import("html5-qrcode");
      const scanner = new Html5Qrcode(containerId);
      scannerRef.current = scanner;
      await scanner.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 220, height: 220 } },
        (decoded: string) => {
          const now = Date.now();
          if (
            decoded === lastScanRef.current.token &&
            now - lastScanRef.current.t < 3000
          )
            return;
          lastScanRef.current = { token: decoded, t: now };
          onScan(decoded.trim());
        },
        () => {}
      );
      setActive(true);
    } catch (e) {
      onError?.(e instanceof Error ? e.message : "No se pudo acceder a la cámara");
    } finally {
      setStarting(false);
    }
  }

  async function stop() {
    try {
      if (scannerRef.current) {
        await scannerRef.current.stop();
        await scannerRef.current.clear();
        scannerRef.current = null;
      }
    } catch {}
    setActive(false);
  }

  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        scannerRef.current
          .stop()
          .then(() => scannerRef.current?.clear())
          .catch(() => {});
      }
    };
  }, []);

  return (
    <div className="space-y-4">
      {/* Camera viewport */}
      <div className="relative mx-auto max-w-sm overflow-hidden rounded-2xl bg-[#0F0F1A] aspect-square">
        <div id={containerId} className="w-full h-full" />

        {!active && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-white/40 p-6">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/5 border border-white/10">
              <Camera className="h-8 w-8" />
            </div>
            <p className="text-sm text-center">
              {starting ? "Iniciando cámara..." : "Cámara inactiva"}
            </p>
          </div>
        )}

        {/* Scan frame overlay */}
        {active && (
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
            <div className="relative h-[220px] w-[220px]">
              {[
                "top-0 left-0 border-t-2 border-l-2 rounded-tl-lg",
                "top-0 right-0 border-t-2 border-r-2 rounded-tr-lg",
                "bottom-0 left-0 border-b-2 border-l-2 rounded-bl-lg",
                "bottom-0 right-0 border-b-2 border-r-2 rounded-br-lg",
              ].map((cls, i) => (
                <div
                  key={i}
                  className={cn("absolute h-6 w-6", cls)}
                  style={{ borderColor: "oklch(0.74 0.115 78)" }}
                />
              ))}
              {/* Scan line */}
              <div
                className="absolute inset-x-0 h-0.5 top-1/2 -translate-y-1/2 opacity-60"
                style={{
                  background:
                    "linear-gradient(90deg, transparent, oklch(0.74 0.115 78), transparent)",
                }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="flex justify-center">
        {!active ? (
          <Button
            onClick={start}
            disabled={starting}
            className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <Camera className="h-4 w-4" />
            {starting ? "Iniciando..." : "Activar cámara"}
          </Button>
        ) : (
          <Button variant="outline" onClick={stop} className="gap-2">
            <CameraOff className="h-4 w-4" />
            Detener cámara
          </Button>
        )}
      </div>

      <p className="text-center text-xs text-muted-foreground">
        Apunta al código QR del cliente. El escaneo solo valida — no consume beneficios.
      </p>
    </div>
  );
}

/* ─── Manual Token Input ──────────────────────────────────── */

export function ManualTokenInput({ onSubmit }: { onSubmit: (token: string) => void }) {
  const [val, setVal] = useState("");
  return (
    <div className="flex gap-2">
      <input
        className="flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm font-mono placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-shadow"
        placeholder="Pega el token UUID del QR..."
        value={val}
        onChange={(e) => setVal(e.target.value)}
      />
      <Button
        onClick={() => onSubmit(val.trim())}
        disabled={!val.trim()}
        size="sm"
        className="shrink-0"
      >
        Validar
      </Button>
    </div>
  );
}
