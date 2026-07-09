import Link from 'next/link'
import Image from 'next/image'

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#0f172a] px-4 py-12 text-white">
      <div className="mb-8 flex flex-col items-center gap-2">
        <Link href="/" className="flex items-center gap-2 text-2xl font-bold">
          <Image src="/logo.svg" alt="MembeGo" width={36} height={36} priority />
          <span>
            Membe<span className="text-emerald-400">Go</span>
          </span>
        </Link>
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">
          Conecta · Disfruta · Ahorra
        </p>
      </div>
      <div className="w-full max-w-md">{children}</div>
    </div>
  )
}
