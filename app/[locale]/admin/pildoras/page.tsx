import { createClient } from '@/lib/supabase/server'
import type { SeccionPildora } from '@/lib/types'
import PillorasAdminManager from '@/components/admin/PillorasAdminManager'

export default async function PillorasAdminPage() {
  const supabase = await createClient()
  const { data: secciones } = await supabase
    .from('secciones_pildoras')
    .select('*, pildoras(*)')
    .order('orden')

  return (
    <div>
      <h1 className="text-2xl font-black text-gray-900 mb-6">Píldoras de Conocimiento</h1>
      <PillorasAdminManager secciones={(secciones as SeccionPildora[]) ?? []} />
    </div>
  )
}
