import { createClient } from '@/lib/supabase/server'
import MenuClient from '@/components/admin/MenuClient'

export interface ProductoEscandallo {
  id: string
  nombre: string
  descripcion: string | null
  categoria: string | null
  tipo_servicio: string | null
  publicado_catalogo: boolean
  proveedor?: { nombre: string }
  combinaciones?: {
    id?: string
    nombre: string
    peso: number | null
    unidad: string
    orden: number
  }[]
}

export default async function EscandalloPage() {
  let productos: ProductoEscandallo[] = []

  try {
    const supabase = await createClient()
    const { data } = await supabase
      .from('productos')
      .select('id, nombre, descripcion, categoria, tipo_servicio, publicado_catalogo, proveedor:proveedores(nombre), combinaciones:producto_combinaciones(*)')
      .order('nombre')
    productos = (data as unknown as ProductoEscandallo[]) ?? []
  } catch {}

  return (
    <div>
      <p style={{ fontSize: '0.6rem', letterSpacing: '0.4em', textTransform: 'uppercase', color: 'var(--gris)', marginBottom: '0.4rem', fontFamily: 'DM Sans, sans-serif' }}>
        Informes · Gestión de menú
      </p>
      <h1 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '2rem', fontWeight: 300, color: 'var(--negro)', marginBottom: '0.4rem', lineHeight: 1 }}>
        Menú
      </h1>
      <p style={{ fontSize: '0.78rem', color: 'var(--gris)', marginBottom: '2rem', fontFamily: 'DM Sans, sans-serif' }}>
        Gestiona los ingredientes y cantidades de cada producto del catálogo.
      </p>
      <MenuClient productos={productos} />
    </div>
  )
}
