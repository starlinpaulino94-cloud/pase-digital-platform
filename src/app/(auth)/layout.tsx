import Link from 'next/link'
import { Sparkles } from 'lucide-react'

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#0f172a] px-4 py-12 text-white">
      <Link href="/" className="mb-8 flex items-center gap-2 text-2xl font-bold">
        <Sparkles className="h-7 w-7 text-sky-400" />
        MembreGo
      </Link>
      <div className="w-full max-w-md">{children}</div>
    </div>
  )
}
