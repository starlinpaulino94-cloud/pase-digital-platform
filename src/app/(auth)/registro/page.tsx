import Link from 'next/link'
import { RegisterForm } from '@/components/auth/RegisterForm'

export default function RegistroPage() {
  return (
    <div className="space-y-7">
      <div className="space-y-1.5">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Crea tu cuenta</h1>
        <p className="text-sm text-muted-foreground">Accede a promociones exclusivas con tu pase digital</p>
      </div>

      <RegisterForm />

      <p className="text-sm text-muted-foreground">
        ¿Ya tienes cuenta?{' '}
        <Link href="/login" className="font-medium text-foreground underline underline-offset-4 hover:no-underline">
          Inicia sesión
        </Link>
      </p>
    </div>
  )
}
