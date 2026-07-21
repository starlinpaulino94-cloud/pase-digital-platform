# Configuración de autenticación en producción

> Checklist para dejar andando: recuperación de contraseña, login con Google
> y correos de auth con marca propia. El CÓDIGO ya está listo (login con
> ojito, `/recuperar`, `/actualizar-password`, botón Google + `/auth/callback`);
> esto es lo que se configura en Vercel, Supabase y Google Cloud.

## 1 · Activar el botón de Google (Vercel)

En el proyecto de Vercel → Settings → Environment Variables:

```
NEXT_PUBLIC_GOOGLE_AUTH_ENABLED=true
```

y **redespliega** (las variables `NEXT_PUBLIC_*` se hornean en el build).
Sin esta variable el botón "Continuar con Google" no se muestra.

Recomendado junto con esto (ver nota de seguridad en `.env.example`):
`EMAIL_VERIFICATION_ENABLED=true` y "Confirm email" activo en Supabase.

## 2 · URLs de redirección (Supabase)

Supabase → **Authentication → URL Configuration**:

- **Site URL**: `https://TU-DOMINIO`
- **Redirect URLs** (una por línea):

```
https://TU-DOMINIO/auth/callback
https://TU-DOMINIO/actualizar-password
http://localhost:3000/auth/callback
http://localhost:3000/actualizar-password
```

Sin esto: Google no puede volver a la app y el enlace de recuperación no
aterriza en la pantalla de nueva contraseña.

## 3 · Google Cloud (ya casi lo tienes)

En el OAuth Client (APIs & Services → Credentials):

- **Authorized redirect URI**: la *Callback URL* que muestra Supabase en el
  proveedor Google (`https://<proyecto>.supabase.co/auth/v1/callback`).
- **Authorized JavaScript origins**: `https://TU-DOMINIO`.

## 4 · SMTP propio para los correos de auth (Supabase + Resend)

Los correos de recuperación/confirmación los envía **Supabase**. Su SMTP por
defecto está limitado (~2–4 correos/hora) y sale de un remitente genérico:
inservible en producción.

Como la app ya usa **Resend** (`RESEND_API_KEY`), reutilízalo:

1. En Resend: verifica tu dominio (si no lo está) y crea un API key.
2. Supabase → **Project Settings → Authentication → SMTP Settings** → Enable
   custom SMTP:

   | Campo    | Valor                                   |
   |----------|-----------------------------------------|
   | Host     | `smtp.resend.com`                       |
   | Port     | `465`                                   |
   | Username | `resend`                                |
   | Password | *(tu API key de Resend, `re_...`)*      |
   | Sender email | `no-reply@TU-DOMINIO` (dominio verificado en Resend) |
   | Sender name  | `MembeGo`                           |

3. Sube el rate limit de emails en Authentication → Rate Limits si hace falta.

## 5 · Plantillas en español (Supabase → Authentication → Email Templates)

Solo debe conservarse el enlace `{{ .ConfirmationURL }}`. Pega cada bloque en
su plantilla correspondiente.

### Reset Password — asunto: `Restablece tu contraseña de MembeGo`

```html
<div style="margin:0 auto;max-width:480px;font-family:Arial,Helvetica,sans-serif;color:#1a1a1a;padding:24px">
  <h2 style="color:#10b981;margin:0 0 4px">MembeGo</h2>
  <h1 style="font-size:20px;margin:16px 0 8px">¿Olvidaste tu contraseña?</h1>
  <p style="font-size:14px;line-height:1.6;color:#444">
    Recibimos una solicitud para restablecer la contraseña de tu cuenta.
    Toca el botón para elegir una nueva. El enlace vence en 1 hora.
  </p>
  <p style="text-align:center;margin:28px 0">
    <a href="{{ .ConfirmationURL }}"
       style="background:#10b981;color:#ffffff;text-decoration:none;padding:12px 28px;border-radius:10px;font-weight:bold;display:inline-block">
      Restablecer contraseña
    </a>
  </p>
  <p style="font-size:12px;line-height:1.6;color:#888">
    Si no fuiste tú, ignora este correo: tu contraseña seguirá siendo la misma.
  </p>
</div>
```

### Confirm signup — asunto: `Confirma tu cuenta de MembeGo`

```html
<div style="margin:0 auto;max-width:480px;font-family:Arial,Helvetica,sans-serif;color:#1a1a1a;padding:24px">
  <h2 style="color:#10b981;margin:0 0 4px">MembeGo</h2>
  <h1 style="font-size:20px;margin:16px 0 8px">¡Ya casi está lista tu cuenta!</h1>
  <p style="font-size:14px;line-height:1.6;color:#444">
    Confirma tu correo para activar tu cuenta y reclamar tu regalo de
    bienvenida.
  </p>
  <p style="text-align:center;margin:28px 0">
    <a href="{{ .ConfirmationURL }}"
       style="background:#10b981;color:#ffffff;text-decoration:none;padding:12px 28px;border-radius:10px;font-weight:bold;display:inline-block">
      Confirmar mi cuenta
    </a>
  </p>
  <p style="font-size:12px;line-height:1.6;color:#888">
    Si no creaste esta cuenta, puedes ignorar este correo.
  </p>
</div>
```

### Magic Link — asunto: `Tu enlace de acceso a MembeGo`

```html
<div style="margin:0 auto;max-width:480px;font-family:Arial,Helvetica,sans-serif;color:#1a1a1a;padding:24px">
  <h2 style="color:#10b981;margin:0 0 4px">MembeGo</h2>
  <h1 style="font-size:20px;margin:16px 0 8px">Entra a tu cuenta</h1>
  <p style="font-size:14px;line-height:1.6;color:#444">
    Toca el botón para iniciar sesión. El enlace es de un solo uso.
  </p>
  <p style="text-align:center;margin:28px 0">
    <a href="{{ .ConfirmationURL }}"
       style="background:#10b981;color:#ffffff;text-decoration:none;padding:12px 28px;border-radius:10px;font-weight:bold;display:inline-block">
      Iniciar sesión
    </a>
  </p>
  <p style="font-size:12px;line-height:1.6;color:#888">
    Si no solicitaste este acceso, ignora este correo.
  </p>
</div>
```

## 6 · Prueba de punta a punta

1. **Recuperación**: /login → "¿Olvidaste tu contraseña?" → pon tu correo →
   llega el email con tu marca → abre el enlace → nueva contraseña (con
   ojito) → te lleva a /login → entra con la nueva.
2. **Google**: /login → "Continuar con Google" → primera vez crea/afilia la
   cuenta y aterriza en la celebración con su regalo de bienvenida; las
   siguientes veces entra directo.
3. **Registro clásico**: crear cuenta → ojito visible → aterriza en la
   celebración.
