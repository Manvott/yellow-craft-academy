import { createClient } from '@/lib/supabase/server'
import RegistrosAdmin from '@/components/admin/RegistrosAdmin'

export interface Registro {
  id: string
  nombre: string
  empresa: string | null
  perfil: string | null
  email: string
  telefono: string | null
  isla: string | null
  bloques: string[] | null
  acepta_whatsapp: boolean
  wa_confirmado: boolean
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
        <a
          href="/api/export/registros"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'var(--negro)', color: 'var(--crema)', padding: '0.7rem 1.4rem', fontSize: '0.68rem', letterSpacing: '0.2em', textTransform: 'uppercase', fontWeight: 500, textDecoration: 'none', fontFamily: 'DM Sans, sans-serif' }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
          Descargar Excel
        </a>
      </div>

      {/* Resumen por bloques */}
      {Object.keys(bloquesCount).length > 0 && (
        <div style={{ background: 'var(--blanco)', border: '1px solid var(--crema3)', padding: '1.25rem 1.5rem', marginBottom: '2rem' }}>
          <p style={{ fontSize: '0.6rem', letterSpacing: '0.3em', textTransform: 'uppercase', color: 'var(--gris)', marginBottom: '1rem', fontFamily: 'DM Sans, sans-serif' }}>
            Asistencia prevista por bloque
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
            {Object.entries(bloquesCount).sort((a, b) => b[1] - a[1]).map(([bloque, count]) => (
              <div key={bloque} style={{ background: 'var(--crema2)', padding: '0.5rem 1rem', display: 'flex', gap: '0.75rem', alignItems: 'center', border: '1px solid var(--crema3)' }}>
                <span style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.4rem', fontWeight: 600, color: 'var(--negro)' }}>{count}</span>
                <span style={{ fontSize: '0.72rem', color: 'var(--gris)', fontFamily: 'DM Sans, sans-serif' }}>{bloque.split('·')[0].trim()}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <RegistrosAdmin registros={registros} />
    </div>
  )
}
