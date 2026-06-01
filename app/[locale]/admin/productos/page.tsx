import { createClient } from '@/lib/supabase/server'
import type { Producto, Proveedor } from '@/lib/types'
import ProductosManager from '@/components/admin/ProductosManager'

export default async function ProductosPage() {
  const supabase = await createClient()
  const [{ data: productos }, { data: proveedores }] = await Promise.all([
    supabase.from('productos').select('*, proveedor:proveedores(nombre)').order('orden'),
    supabase.from('proveedores').select('id, nombre').eq('activo', true).order('nombre'),
  ])

  return (
    <div>
      <h1 className="text-2xl font-black text-gray-900 mb-6">Productos</h1>
      <ProductosManager
        productos={(productos as Producto[]) ?? []}
        proveedores={(proveedores as Proveedor[]) ?? []}
      />
    </div>
  )
}
