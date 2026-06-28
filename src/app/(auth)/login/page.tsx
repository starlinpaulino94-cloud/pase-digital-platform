import Link from 'next/link'
import { LoginForm } from '@/components/auth/LoginForm'

export default function LoginPage() {
  return (
    <div className="space-y-7">
      <div className="space-y-1.5">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Bienvenido de vuelta</h1>
        <p className="text-sm text-muted-foreground">Ingresa a tu cuenta de PASE Digital</p>
      </div>

      <LoginForm />

      <p className="text-sm text-muted-foreground">
        ¿No tienes cuenta?{' '}
        <Link href="/registro" className="font-medium text-foreground underline underline-offset-4 hover:no-underline">
          Regístrate gratis
        </Link>
      </p>
    </div>
  )
}
