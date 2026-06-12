import { createClient } from '@/lib/supabase/server'
import RegistrosAdmin from '@/components/admin/RegistrosAdmin'
import DescargarExcelBtn from '@/components/admin/DescargarExcelBtn'

export interface Registro {
  id: string
  nombre: string
  empresa: string | null
  cargo: string | null
  perfil: string | null
  email: string
  telefono: string | null
  isla: string | null
  instagram: string | null
  primera_vez: boolean
  cliente_ava: boolean
  bloques: string[] | null
  acepta_whatsapp: boolean
  wa_confirmado: boolean
  wa_mensaje_enviado: boolean
  asistio: boolean
  origen: string | null
  lista_espera: boolean
  created_at: string
}

export default async function RegistrosPage() {
  let registros: Registro[] = []
  try {
    const supabase = await createClient()
    const { data } = await supabase
      .from('registros')
      .select('*')
      .order('created_at', { ascending: false })
    registros = (data as Registro[]) ?? []
  } catch {}

  const total = registros.length
  const waConfirmados = registros.filter(r => r.wa_confirmado).length

  const bloquesCount: Record<string, number> = {}
  registros.forEach(r => {
    (r.bloques ?? []).forEach(b => {
      bloquesCount[b] = (bloquesCount[b] ?? 0) + 1
    })
  })

  const islasCount: Record<string, number> = {}
  registros.forEach(r => {
    const isla = r.isla ?? 'Sin especificar'
    islasCount[isla] = (islasCount[isla] ?? 0) + 1
  })

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '2rem' }}>
        <div>
          <p style={{ fontSize: '0.6rem', letterSpacing: '0.4em', textTransform: 'uppercase', color: 'var(--gris)', marginBottom: '0.4rem', fontFamily: 'DM Sans, sans-serif' }}>
            Inscritos al evento
          </p>
          <h1 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '2rem', fontWeight: 300, color: 'var(--negro)', lineHeight: 1 }}>
            Asistentes registrados
          </h1>
          <div style={{ display: 'flex', gap: '1.5rem', marginTop: '0.6rem' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--gris)', fontFamily: 'DM Sans, sans-serif' }}>
              <strong style={{ color: 'var(--negro)' }}>{total}</strong> inscritos
            </span>
            <span style={{ fontSize: '0.8rem', fontFamily: 'DM Sans, sans-serif' }}>
              <strong style={{ color: '#25D366' }}>{waConfirmados}</strong>
              <span style={{ color: 'var(--gris)' }}> en lista WA</span>
            </span>
            <span style={{ fontSize: '0.8rem', fontFamily: 'DM Sans, sans-serif' }}>
              <strong style={{ color: 'var(--negro)' }}>{total - waConfirmados}</strong>
              <span style={{ color: 'var(--gris)' }}> pendientes WA</span>
            </span>
          </div>
        </div>
        <DescargarExcelBtn />
      </div>

      {/* Resúmenes: bloques + islas en paralelo */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '2rem' }}>

        {/* Por bloque */}
        <div style={{ background: 'var(--blanco)', border: '1px solid var(--crema3)', padding: '1.25rem 1.5rem' }}>
          <p style={{ fontSize: '0.6rem', letterSpacing: '0.3em', textTransform: 'uppercase', color: 'var(--gris)', marginBottom: '1rem', fontFamily: 'DM Sans, sans-serif' }}>
            Asistencia prevista por bloque
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6rem' }}>
            {Object.keys(bloquesCount).length === 0 ? (
              <span style={{ fontSize: '0.78rem', color: 'var(--gris-l)', fontFamily: 'DM Sans, sans-serif' }}>Sin datos</span>
            ) : Object.entries(bloquesCount).sort((a, b) => b[1] - a[1]).map(([bloque, count]) => (
              <div key={bloque} style={{ background: 'var(--crema2)', padding: '0.5rem 0.9rem', display: 'flex', gap: '0.6rem', alignItems: 'center', border: '1px solid var(--crema3)' }}>
                <span style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.4rem', fontWeight: 600, color: 'var(--negro)' }}>{count}</span>
                <span style={{ fontSize: '0.68rem', color: 'var(--gris)', fontFamily: 'DM Sans, sans-serif' }}>{bloque.split('·')[0].trim()}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Por isla */}
        <div style={{ background: 'var(--blanco)', border: '1px solid var(--crema3)', padding: '1.25rem 1.5rem' }}>
          <p style={{ fontSize: '0.6rem', letterSpacing: '0.3em', textTransform: 'uppercase', color: 'var(--gris)', marginBottom: '1rem', fontFamily: 'DM Sans, sans-serif' }}>
            Inscritos por isla
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6rem' }}>
            {Object.keys(islasCount).length === 0 ? (
              <span style={{ fontSize: '0.78rem', color: 'var(--gris-l)', fontFamily: 'DM Sans, sans-serif' }}>Sin datos</span>
            ) : Object.entries(islasCount).sort((a, b) => b[1] - a[1]).map(([isla, count]) => (
              <div key={isla} style={{ background: count === Math.max(...Object.values(islasCount)) ? 'var(--amarillo)' : 'var(--crema2)', padding: '0.5rem 0.9rem', display: 'flex', gap: '0.6rem', alignItems: 'center', border: '1px solid var(--crema3)' }}>
                <span style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.4rem', fontWeight: 600, color: 'var(--negro)' }}>{count}</span>
                <span style={{ fontSize: '0.68rem', color: 'var(--negro)', fontFamily: 'DM Sans, sans-serif', fontWeight: 500 }}>{isla}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <RegistrosAdmin registros={registros} />
    </div>
  )
}
