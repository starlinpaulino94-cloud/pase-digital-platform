import { PublicNav } from '@/components/public/PublicNav'
import { PublicFooter } from '@/components/public/PublicFooter'
import type { ReactNode } from 'react'

export const metadata = {
  title: 'MembeGo - Descubre Beneficios Exclusivos',
  description: 'Accede a promociones y beneficios exclusivos de las mejores empresas',
}

export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-col min-h-screen">
      <PublicNav />
      <main className="flex-1">
        {children}
      </main>
      <PublicFooter />
    </div>
  )
}
