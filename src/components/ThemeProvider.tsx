'use client'

import { ThemeProvider as NextThemesProvider } from 'next-themes'

/**
 * Proveedor de tema (claro/oscuro) sobre next-themes. Aplica la clase `.dark`
 * en <html> (los tokens de globals.css ya definen ambos temas). Por defecto
 * claro; el usuario cambia con el toggle del header y la elección persiste.
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="light"
      enableSystem={false}
      disableTransitionOnChange
    >
      {children}
    </NextThemesProvider>
  )
}
