import { createClient } from '@/lib/supabase/server'
import type { Proveedor } from '@/lib/types'
import FichasManager from '@/components/admin/FichasManager'

export interface Combinacion {
  id?: string
  nombre: string
  peso: string
  unidad: string
  orden: number
}

export interface ProductoFicha {
  id: string
  proveedor_id: string
  nombre: string
  descripcion: string | null
  imagen_url: string | null
  categoria: string | null
  ficha_tecnica_url: string | null
  precio_base: number | null
  tiene_cargo: boolean
  igic_pct: number | null
  coste_aduana: number | null
  coste_logistica: number | null
  tipo_servicio: 'desayuno' | 'tardeo' | 'ambos'
  disponible: boolean
  publicado_catalogo: boolean
  orden: number
  proveedor?: { nombre: string }
  combinaciones?: Combinacion[]
}

export default async function FichasPage() {
  let productos: ProductoFicha[] = []
  let proveedores: Proveedor[] = []

  try {
    const supabase = await createClient()
    const [{ data: p }, { data: prov }] = await Promise.all([
      supabase.from('productos')
        .select('*, proveedor:proveedores(nombre), combinaciones:producto_combinaciones(*)')
        .order('orden'),
      supabase.from('proveedores').select('*').eq('activo', true).order('nombre'),
    ])
    productos = (p as ProductoFicha[]) ?? []
    proveedores = (prov as Proveedor[]) ?? []
  } catch {}

  return (
    <div>
      <p style={{ fontSize: '0.6rem', letterSpacing: '0.4em', textTransform: 'uppercase', color: 'var(--gris)', marginBottom: '0.4rem', fontFamily: 'DM Sans, sans-serif' }}>
        Catálogo del evento
      </p>
      <h1 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '2rem', fontWeight: 300, color: 'var(--negro)', marginBottom: '0.4rem', lineHeight: 1 }}>
        Fichas de Producto
      </h1>
      <p style={{ fontSize: '0.78rem', color: 'var(--gris)', marginBottom: '2rem' }}>
        Crea fichas con escandallo y costes. Activa <strong>Publicar al catálogo</strong> para que aparezcan en el portal.
      </p>
      <FichasManager productos={productos} proveedores={proveedores} />
    </div>
  )
}
