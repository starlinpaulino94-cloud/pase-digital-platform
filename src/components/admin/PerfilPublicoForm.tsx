'use client'

import { useActionState, useEffect, useRef } from 'react'
import { useFormStatus } from 'react-dom'
import { Loader2, Save } from 'lucide-react'
import { toast } from 'sonner'
import {
  actualizarPerfilPublico,
  type PerfilState,
} from '@/modules/empresas/perfilActions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { LogoUpload } from '@/components/superadmin/LogoUpload'
import {
  CategoryMultiSelect,
  type CategoryOption,
} from '@/components/superadmin/CategoryMultiSelect'
import { MediaUpload } from './MediaUpload'
import { GalleryManager } from './GalleryManager'
import { MapaUbicacion } from './MapaUbicacion'
import { MONEDAS, IDIOMAS } from '@/lib/format'

export interface PerfilCompanyData {
  id: string
  name: string
  description: string | null
  horario: string | null
  logoUrl: string | null
  bannerUrl: string | null
  galleryImages: string[]
  direccion: string | null
  ciudad: string | null
  provincia: string | null
  pais: string | null
  codigoPostal: string | null
  razonSocial: string | null
  zonaCobertura: string | null
  latitud: number | null
  longitud: number | null
  telefono: string | null
  whatsapp: string | null
  email: string | null
  website: string | null
  instagram: string | null
  facebook: string | null
  tiktok: string | null
  googleMapsUrl: string | null
  moneda: string
  zonaHoraria: string
  idioma: string
  colorPrimario: string | null
  politicaCancelacion: string | null
  politicaPrivacidad: string | null
  terminosEmpresa: string | null
}

const init: PerfilState = {}

function SubmitBtn() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" disabled={pending} size="lg">
      {pending ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <Save className="mr-2 h-4 w-4" />
      )}
      Guardar perfil público
    </Button>
  )
}

export function PerfilPublicoForm({
  company,
  categories,
  selectedCategoryIds,
}: {
  company: PerfilCompanyData
  categories: CategoryOption[]
  selectedCategoryIds: string[]
}) {
  const [state, action] = useActionState(actualizarPerfilPublico, init)
  const logoRef = useRef<HTMLInputElement>(null)
  const bannerRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (state.success) toast.success('Perfil público actualizado.')
    if (state.error) toast.error(state.error)
  }, [state.success, state.error])

  return (
    <form action={action} className="space-y-6">
      {/* Empresa a editar: el admin de empresa se valida por sesión; el
          superadmin usa este campo (verificado en la action). */}
      <input type="hidden" name="companyId" value={company.id} />
      {/* Identidad visual */}
      <Card>
        <CardHeader>
          <CardTitle>Identidad visual</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-1.5">
            <Label>Logo</Label>
            <LogoUpload
              companyId={company.id}
              currentUrl={company.logoUrl}
              companyName={company.name}
              onUploaded={(url) => {
                if (logoRef.current) logoRef.current.value = url
              }}
            />
            <input
              ref={logoRef}
              type="hidden"
              name="logoUrl"
              defaultValue={company.logoUrl ?? ''}
            />
          </div>

          <div className="space-y-1.5">
            <Label>Banner (portada del perfil)</Label>
            <MediaUpload
              storagePath={`banners/${company.id}`}
              currentUrl={company.bannerUrl}
              label="Banner"
              aspect="wide"
              onUploaded={(url) => {
                if (bannerRef.current) bannerRef.current.value = url
              }}
            />
            <input
              ref={bannerRef}
              type="hidden"
              name="bannerUrl"
              defaultValue={company.bannerUrl ?? ''}
            />
          </div>

          <div className="space-y-1.5">
            <Label>Galería</Label>
            <GalleryManager
              companyId={company.id}
              initialImages={company.galleryImages}
            />
          </div>
        </CardContent>
      </Card>

      {/* Información */}
      <Card>
        <CardHeader>
          <CardTitle>Información del negocio</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-5 sm:grid-cols-2">
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="description">Descripción</Label>
            <Textarea
              id="description"
              name="description"
              rows={3}
              defaultValue={company.description ?? ''}
              placeholder="Qué ofrece tu negocio y por qué elegirlo…"
            />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="horario">Horario de atención</Label>
            <Input
              id="horario"
              name="horario"
              defaultValue={company.horario ?? ''}
              placeholder="Lun-Vie 8:00-18:00 · Sáb 9:00-14:00"
            />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label>Categorías del marketplace</Label>
            <p className="text-xs text-muted-foreground">
              Determinan en qué filtros del directorio apareces.
            </p>
            <CategoryMultiSelect
              categories={categories}
              defaultSelected={selectedCategoryIds}
            />
          </div>
        </CardContent>
      </Card>

      {/* Ubicación */}
      <Card>
        <CardHeader>
          <CardTitle>Ubicación</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-5 sm:grid-cols-2">
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="direccion">Dirección</Label>
            <Input
              id="direccion"
              name="direccion"
              defaultValue={company.direccion ?? ''}
              placeholder="Calle, número, sector…"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ciudad">Ciudad</Label>
            <Input id="ciudad" name="ciudad" defaultValue={company.ciudad ?? ''} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="provincia">Provincia</Label>
            <Input
              id="provincia"
              name="provincia"
              defaultValue={company.provincia ?? ''}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="pais">País</Label>
            <Input id="pais" name="pais" defaultValue={company.pais ?? ''} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="codigoPostal">Código postal</Label>
            <Input
              id="codigoPostal"
              name="codigoPostal"
              defaultValue={company.codigoPostal ?? ''}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="googleMapsUrl">Enlace de Google Maps</Label>
            <Input
              id="googleMapsUrl"
              name="googleMapsUrl"
              type="url"
              defaultValue={company.googleMapsUrl ?? ''}
              placeholder="https://maps.app.goo.gl/…"
            />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="razonSocial">Razón social (opcional)</Label>
            <Input
              id="razonSocial"
              name="razonSocial"
              defaultValue={company.razonSocial ?? ''}
              placeholder="Nombre legal de la empresa"
            />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="zonaCobertura">Zona de cobertura (opcional)</Label>
            <Input
              id="zonaCobertura"
              name="zonaCobertura"
              defaultValue={company.zonaCobertura ?? ''}
              placeholder="Ej.: toda la ciudad, radio de 10 km, sectores X e Y…"
            />
          </div>
          {/* Selector de coordenadas con mapa (Leaflet+OSM) */}
          <div className="sm:col-span-2">
            <MapaUbicacion lat={company.latitud} lng={company.longitud} />
          </div>
        </CardContent>
      </Card>

      {/* Contacto y redes */}
      <Card>
        <CardHeader>
          <CardTitle>Contacto y redes sociales</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-5 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="telefono">Teléfono</Label>
            <Input
              id="telefono"
              name="telefono"
              defaultValue={company.telefono ?? ''}
              placeholder="+1 809 000 0000"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="whatsapp">WhatsApp</Label>
            <Input
              id="whatsapp"
              name="whatsapp"
              defaultValue={company.whatsapp ?? ''}
              placeholder="+1 809 000 0000"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="email">Correo público</Label>
            <Input
              id="email"
              name="email"
              type="email"
              defaultValue={company.email ?? ''}
              placeholder="contacto@empresa.com"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="website">Sitio web</Label>
            <Input
              id="website"
              name="website"
              type="url"
              defaultValue={company.website ?? ''}
              placeholder="https://…"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="instagram">Instagram (URL)</Label>
            <Input
              id="instagram"
              name="instagram"
              type="url"
              defaultValue={company.instagram ?? ''}
              placeholder="https://instagram.com/…"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="facebook">Facebook (URL)</Label>
            <Input
              id="facebook"
              name="facebook"
              type="url"
              defaultValue={company.facebook ?? ''}
              placeholder="https://facebook.com/…"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="tiktok">TikTok (URL)</Label>
            <Input
              id="tiktok"
              name="tiktok"
              type="url"
              defaultValue={company.tiktok ?? ''}
              placeholder="https://tiktok.com/@…"
            />
          </div>
        </CardContent>
      </Card>

      {/* Paso 4: configuración regional, marca y políticas */}
      <Card>
        <CardHeader>
          <CardTitle>Configuración</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-5 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="moneda">Moneda</Label>
            <select
              id="moneda"
              name="moneda"
              defaultValue={company.moneda}
              className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-sm"
            >
              {MONEDAS.map((m) => (
                <option key={m.code} value={m.code}>{m.label}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="idioma">Idioma / formato</Label>
            <select
              id="idioma"
              name="idioma"
              defaultValue={company.idioma}
              className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-sm"
            >
              {IDIOMAS.map((i) => (
                <option key={i.code} value={i.code}>{i.label}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="zonaHoraria">Zona horaria</Label>
            <Input
              id="zonaHoraria"
              name="zonaHoraria"
              defaultValue={company.zonaHoraria}
              placeholder="America/Santo_Domingo"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="colorPrimario">Color de marca</Label>
            <Input
              id="colorPrimario"
              name="colorPrimario"
              defaultValue={company.colorPrimario ?? ''}
              placeholder="#0ea5e9"
            />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="politicaCancelacion">Política de cancelación</Label>
            <Textarea
              id="politicaCancelacion"
              name="politicaCancelacion"
              defaultValue={company.politicaCancelacion ?? ''}
              rows={3}
            />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="politicaPrivacidad">Política de privacidad</Label>
            <Textarea
              id="politicaPrivacidad"
              name="politicaPrivacidad"
              defaultValue={company.politicaPrivacidad ?? ''}
              rows={3}
            />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="terminosEmpresa">Términos de la empresa</Label>
            <Textarea
              id="terminosEmpresa"
              name="terminosEmpresa"
              defaultValue={company.terminosEmpresa ?? ''}
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      <SubmitBtn />
    </form>
  )
}
