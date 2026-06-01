import { createClient } from '@/lib/supabase/server'
import type { Producto, Proveedor } from '@/lib/types'
import ProductosManager from '@/components/admin/ProductosManager'

export default async function ProductosPage() {
  let productos: Producto[] = []
  let proveedores: Proveedor[] = []
  try {
    const supabase = await createClient()
    const [{ data: p }, { data: prov }] = await Promise.all([
      supabase.from('productos').select('*, proveedor:proveedores(nombre)').order('orden'),
      supabase.from('proveedores').select('id, nombre').eq('activo', true).order('nombre'),
    ])
    productos = (p as Producto[]) ?? []
    proveedores = (prov as Proveedor[]) ?? []
  } catch {}

  return (
    <div>
      <h1 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '2rem', fontWeight: 300, color: 'var(--negro)', marginBottom: '2rem' }}>
        Productos
      </h1>
      <ProductosManager productos={productos} proveedores={proveedores} />
    </div>
  )
}
