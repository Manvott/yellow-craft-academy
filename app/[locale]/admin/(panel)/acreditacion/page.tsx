import { createClient } from '@/lib/supabase/server'
import AcreditacionClient from '@/components/admin/AcreditacionClient'

export interface RegistroAcred {
  id: string
  nombre: string
  empresa: string | null
  telefono: string | null
  email: string
  isla: string | null
  cargo: string | null
  bloques: string[] | null
  asistio: boolean
  created_at: string
  origen: string | null
  lista_espera: boolean
}

export default async function AcreditacionPage() {
  let registros: RegistroAcred[] = []
  try {
    const supabase = await createClient()
    const { data } = await supabase
      .from('registros')
      .select('id, nombre, empresa, telefono, email, isla, cargo, bloques, asistio, created_at, origen, lista_espera')
      .order('created_at', { ascending: false })
    registros = (data as RegistroAcred[]) ?? []
  } catch {}

  const total     = registros.length
  const asistidos = registros.filter(r => r.asistio).length

  return (
    <div>
      <p style={{ fontSize: '0.6rem', letterSpacing: '0.4em', textTransform: 'uppercase', color: 'var(--gris)', marginBottom: '0.4rem', fontFamily: 'DM Sans, sans-serif' }}>
        Control de acceso
      </p>
      <h1 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '2rem', fontWeight: 300, color: 'var(--negro)', lineHeight: 1, marginBottom: '0.5rem' }}>
        Acreditación
      </h1>

      {/* Contador */}
      <div style={{ display: 'flex', gap: '2rem', marginBottom: '2rem' }}>
        <span style={{ fontSize: '0.82rem', fontFamily: 'DM Sans, sans-serif' }}>
          <strong style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.8rem', fontWeight: 300 }}>{total}</strong>
          <span style={{ color: 'var(--gris)', marginLeft: '0.4rem' }}>inscritos</span>
        </span>
        <span style={{ fontSize: '0.82rem', fontFamily: 'DM Sans, sans-serif' }}>
          <strong style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.8rem', fontWeight: 300, color: '#16a34a' }}>{asistidos}</strong>
          <span style={{ color: 'var(--gris)', marginLeft: '0.4rem' }}>asistieron</span>
        </span>
        <span style={{ fontSize: '0.82rem', fontFamily: 'DM Sans, sans-serif' }}>
          <strong style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.8rem', fontWeight: 300, color: 'var(--gris-l)' }}>{total - asistidos}</strong>
          <span style={{ color: 'var(--gris)', marginLeft: '0.4rem' }}>pendientes</span>
        </span>
      </div>

      <AcreditacionClient registros={registros} />
    </div>
  )
}
