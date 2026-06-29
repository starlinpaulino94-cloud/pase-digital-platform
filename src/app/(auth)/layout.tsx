export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background flex">
      {/* Left panel — decorative (desktop only) */}
      <div className="hidden lg:flex lg:w-[420px] xl:w-[480px] flex-col bg-[oklch(0.155_0.028_264)] p-10 shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-[oklch(0.60_0.18_250)] flex items-center justify-center">
            <span className="text-xs font-bold text-white">P</span>
          </div>
          <span className="text-white font-semibold text-sm tracking-tight">PASE Digital</span>
        </div>
        <div className="flex-1 flex flex-col justify-center">
          <blockquote className="space-y-4">
            <p className="text-[oklch(0.80_0.010_264)] text-lg leading-relaxed font-light">
              &ldquo;Accede a tus promociones digitales exclusivas con un solo código QR. Rápido, seguro y sin papel.&rdquo;
            </p>
            <footer className="text-[oklch(0.55_0.012_264)] text-sm">PASE Digital · Promociones digitales</footer>
          </blockquote>
        </div>
        <div className="flex items-center gap-2">
          {['Seguro', 'Rápido', 'Digital'].map((tag) => (
            <span
              key={tag}
              className="text-xs px-2.5 py-1 rounded-full border border-[oklch(0.28_0.025_264)] text-[oklch(0.55_0.012_264)]"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-sm">{children}</div>
      </div>
    </div>
  )
}
