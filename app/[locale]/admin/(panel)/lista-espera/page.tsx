import { createClient } from '@/lib/supabase/server'
import ListaEsperaClient from '@/components/admin/ListaEsperaClient'

export interface RegistroEspera {
  id: string
  nombre: string
  empresa: string | null
  cargo: string | null
  email: string
  telefono: string | null
  isla: string | null
  instagram: string | null
  primera_vez: boolean
  cliente_ava: boolean
  bloques: string[] | null
  acepta_whatsapp: boolean
  lista_espera: boolean
  lista_espera_orden: number | null
  created_at: string
}

export default async function ListaEsperaPage() {
  let registros: RegistroEspera[] = []
  try {
    const supabase = await createClient()
    const { data } = await supabase
      .from('registros')
      .select('id, nombre, empresa, cargo, email, telefono, isla, instagram, primera_vez, cliente_ava, bloques, acepta_whatsapp, lista_espera, lista_espera_orden, created_at')
      .eq('lista_espera', true)
      .order('lista_espera_orden', { ascending: true, nullsFirst: false })
    registros = (data as RegistroEspera[]) ?? []
  } catch {}

  return (
    <div>
      <p style={{ fontSize: '0.6rem', letterSpacing: '0.4em', textTransform: 'uppercase', color: 'var(--gris)', marginBottom: '0.4rem', fontFamily: 'DM Sans, sans-serif' }}>
        Gestión de acceso
      </p>
      <h1 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '2rem', fontWeight: 300, color: 'var(--negro)', marginBottom: '0.4rem', lineHeight: 1 }}>
        Lista de espera
      </h1>
      <p style={{ fontSize: '0.78rem', color: 'var(--gris)', marginBottom: '2rem', fontFamily: 'DM Sans, sans-serif' }}>
        Asistentes en espera de confirmación. Puedes añadirlos manualmente y promoverlos a inscritos confirmados.
      </p>
      <ListaEsperaClient registros={registros} />
    </div>
  )
}
