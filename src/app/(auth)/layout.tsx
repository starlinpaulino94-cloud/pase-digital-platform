import Link from 'next/link'
import Image from 'next/image'

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    // Sección single-theme intencional: navy de marca (mismo tono que el
    // sidebar), no participa del toggle claro/oscuro. Acento del logo = marca
    // (text-gradient azul→cyan), no emerald.
    <div className="flex min-h-screen flex-col items-center justify-center bg-[oklch(0.14_0.035_260)] px-4 py-12 text-white">
      <div className="mb-8 flex flex-col items-center gap-2">
        <Link href="/" className="flex items-center gap-2 text-2xl font-bold">
          <Image src="/logo.svg" alt="MembeGo" width={36} height={36} priority />
          <span>
            Membe<span className="text-gradient">Go</span>
          </span>
        </Link>
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/50">
          Conecta · Disfruta · Ahorra
        </p>
      </div>
      <div className="w-full max-w-md">{children}</div>
    </div>
  )
}
