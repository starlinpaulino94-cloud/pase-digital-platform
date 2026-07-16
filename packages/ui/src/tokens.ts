/**
 * MDS · Membego Design System — tokens como datos.
 *
 * Fuente única de los valores de diseño para consumidores que NO pasan por
 * CSS (app móvil nativa, emails, generación de imágenes OG, PDFs). En la web
 * la fuente de verdad son las variables CSS de `globals.css`; este archivo
 * las refleja en sRGB/hex para plataformas sin soporte OKLCH.
 *
 * Regla: si un valor cambia aquí, debe cambiar también en `globals.css`
 * (y viceversa). Ver docs/MDS.md § Tokens.
 */

/** Escala de marca (esmeralda). 700 es el primary de modo claro; 500 el de oscuro. */
export const primary = {
  50: '#ecfdf3',
  100: '#d4f7e3',
  200: '#a9eec7',
  300: '#6fe0a5',
  400: '#3dd684',
  500: '#22c55e',
  600: '#17a24d',
  700: '#15803d',
  800: '#136433',
  900: '#0f4d28',
} as const

/** Secundario: cyan del degradado del logo. */
export const cyanBrand = {
  300: '#7dd8e8',
  500: '#22b8cf',
  700: '#0e7f96',
} as const

/** Semánticos de estado (modo claro). */
export const state = {
  success: '#16a34a',
  warning: '#f59e0b',
  danger: '#dc2626',
  info: '#2563eb',
} as const

/** Azul eléctrico de la landing pública (identidad azul + blanco). */
export const landingPrimary = '#2563eb'

/** Navy profundo del logo (sidebar / fondos hero). */
export const navy = '#0b1220'

/** Espaciado — escala base 4px. Usar SIEMPRE estos pasos. */
export const spacing = [0, 2, 4, 8, 12, 16, 20, 24, 32, 40, 48, 56, 64, 80, 96] as const

/** Radios (px). */
export const radius = {
  xs: 6,
  sm: 8,
  md: 10,
  lg: 12,
  xl: 14,
  '2xl': 20,
  pill: 999,
  circle: '50%',
} as const

/** Tipografía: familias y escala (px, peso, line-height). */
export const typography = {
  families: {
    display: 'Plus Jakarta Sans', // títulos y números protagonistas
    sans: 'Geist',                // texto de lectura y UI
    mono: 'Geist Mono',           // códigos, referencias, montos tabulares
  },
  scale: {
    displayXl: { size: 72, weight: 800, lineHeight: 1.05, tracking: -0.03 },
    display: { size: 48, weight: 800, lineHeight: 1.05, tracking: -0.03 },
    headingXl: { size: 30, weight: 800, lineHeight: 1.15, tracking: -0.02 },
    headingL: { size: 22, weight: 700, lineHeight: 1.25, tracking: -0.015 },
    headingM: { size: 17, weight: 700, lineHeight: 1.3, tracking: -0.01 },
    headingS: { size: 15, weight: 600, lineHeight: 1.35, tracking: 0 },
    bodyXl: { size: 17, weight: 400, lineHeight: 1.6, tracking: 0 },
    bodyL: { size: 16, weight: 400, lineHeight: 1.6, tracking: 0 },
    bodyM: { size: 15, weight: 400, lineHeight: 1.6, tracking: 0 },
    bodyS: { size: 13, weight: 400, lineHeight: 1.5, tracking: 0 },
    caption: { size: 12, weight: 400, lineHeight: 1.4, tracking: 0 },
    overline: { size: 11, weight: 600, lineHeight: 1.4, tracking: 0.08 },
    button: { size: 14, weight: 500, lineHeight: 1, tracking: 0 },
    label: { size: 13, weight: 500, lineHeight: 1.4, tracking: 0 },
  },
} as const

/** Motion: duraciones (ms) y curvas. */
export const motion = {
  duration: { instant: 100, fast: 150, base: 200, slow: 350, hero: 500 },
  easing: {
    outExpo: [0.16, 1, 0.3, 1],
    spring: [0.34, 1.56, 0.64, 1],
    standard: [0.4, 0, 0.2, 1],
  },
} as const

/** Área táctil mínima (px) — accesibilidad. */
export const minTouchTarget = 44

export const tokens = {
  primary,
  cyanBrand,
  state,
  landingPrimary,
  navy,
  spacing,
  radius,
  typography,
  motion,
  minTouchTarget,
} as const

export type MdsTokens = typeof tokens
