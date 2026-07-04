import Link from 'next/link'
import Image from 'next/image'

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#0f172a] px-4 py-12 text-white">
      <Link href="/" className="mb-8 flex items-center gap-2 text-2xl font-bold">
        <Image src="/logo.svg" alt="MembreGo" width={36} height={36} priority />
        MembreGo
      </Link>
      <div className="w-full max-w-md">{children}</div>
    </div>
  )
}
