import { createClient } from '@/lib/supabase/server'
import CategoriasManager from '@/components/admin/CategoriasManager'

export interface Categoria {
  id: string
  nombre: string
  orden: number
  activa: boolean
}

export default async function CategoriasPage() {
  let categorias: Categoria[] = []
  try {
    const supabase = await createClient()
    const { data } = await supabase.from('categorias').select('*').order('orden')
    categorias = (data as Categoria[]) ?? []
  } catch {}

  return (
    <div>
      <p style={{ fontSize: '0.6rem', letterSpacing: '0.4em', textTransform: 'uppercase', color: 'var(--gris)', marginBottom: '0.4rem', fontFamily: 'DM Sans, sans-serif' }}>
        Catálogo
      </p>
      <h1 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '2rem', fontWeight: 300, color: 'var(--negro)', marginBottom: '0.4rem', lineHeight: 1 }}>
        Categorías
      </h1>
      <p style={{ fontSize: '0.78rem', color: 'var(--gris)', marginBottom: '2rem', fontFamily: 'DM Sans, sans-serif' }}>
        Gestiona las categorías disponibles en Fichas de Producto y el catálogo público.
      </p>
      <CategoriasManager categorias={categorias} />
    </div>
  )
}
