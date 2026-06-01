import { createClient } from '@/lib/supabase/server'
import type { Proveedor } from '@/lib/types'
import ProveedoresManager from '@/components/admin/ProveedoresManager'

export default async function ProveedoresPage() {
  const supabase = await createClient()
  const { data: proveedores } = await supabase
    .from('proveedores')
    .select('*')
    .order('orden')

  return (
    <div>
      <h1 className="text-2xl font-black text-gray-900 mb-6">Proveedores</h1>
      <ProveedoresManager proveedores={(proveedores as Proveedor[]) ?? []} />
    </div>
  )
}
