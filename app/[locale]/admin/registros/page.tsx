import { createClient } from '@/lib/supabase/server'

interface Registro {
  id: string
  nombre: string
  empresa: string | null
  perfil: string | null
  email: string
  telefono: string | null
  bloques: string[] | null
  ip_origen: string | null
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
  const bloquesCount: Record<string, number> = {}
  registros.forEach(r => {
    (r.bloques ?? []).forEach(b => {
      bloquesCount[b] = (bloquesCount[b] ?? 0) + 1
    })
  })

  return (
    <div>
      <p style={{ fontSize: '0.6rem', letterSpacing: '0.4em', textTransform: 'uppercase', color: 'var(--gris)', marginBottom: '0.5rem', fontFamily: 'DM Sans, sans-serif' }}>
        Inscritos al evento
      </p>
      <h1 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '2rem', fontWeight: 300, color: 'var(--negro)', marginBottom: '0.5rem' }}>
        Asistentes registrados
      </h1>
      <p style={{ fontSize: '0.8rem', color: 'var(--gris)', marginBottom: '2rem', fontFamily: 'DM Sans, sans-serif' }}>{total} inscripciones</p>

      {Object.keys(bloquesCount).length > 0 && (
        <div style={{ background: 'var(--blanco)', border: '1px solid var(--crema3)', padding: '1.25rem 1.5rem', marginBottom: '2rem' }}>
          <p style={{ fontSize: '0.6rem', letterSpacing: '0.3em', textTransform: 'uppercase', color: 'var(--gris)', marginBottom: '1rem', fontFamily: 'DM Sans, sans-serif' }}>
            Asistencia prevista por bloque
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
            {Object.entries(bloquesCount)
              .sort((a, b) => b[1] - a[1])
              .map(([bloque, count]) => (
                <div key={bloque} style={{ background: 'var(--crema2)', padding: '0.5rem 1rem', display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                  <span style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.2rem', fontWeight: 600, color: 'var(--negro)' }}>{count}</span>
                  <span style={{ fontSize: '0.72rem', color: 'var(--gris)', fontFamily: 'DM Sans, sans-serif' }}>{bloque}</span>
                </div>
              ))}
          </div>
        </div>
      )}

      <div style={{ background: 'var(--blanco)', border: '1px solid var(--crema3)', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
            <thead>
              <tr style={{ background: 'var(--crema2)', borderBottom: '1px solid var(--crema3)' }}>
                {['Fecha', 'Nombre', 'Email', 'Empresa', 'Perfil', 'Tel/WhatsApp', 'Bloques'].map(h => (
                  <th key={h} style={{ textAlign: 'left', padding: '0.75rem 1rem', fontSize: '0.6rem', letterSpacing: '0.3em', textTransform: 'uppercase', color: 'var(--gris)', fontWeight: 500, whiteSpace: 'nowrap' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {registros.map((r, i) => (
                <tr key={r.id} style={{ borderBottom: '1px solid var(--crema3)', background: i % 2 === 0 ? 'var(--blanco)' : 'var(--crema)' }}>
                  <td style={{ padding: '0.75rem 1rem', color: 'var(--gris-l)', whiteSpace: 'nowrap', fontSize: '0.75rem' }}>
                    {new Date(r.created_at).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}
                  </td>
                  <td style={{ padding: '0.75rem 1rem', fontWeight: 500, color: 'var(--negro)', whiteSpace: 'nowrap' }}>{r.nombre}</td>
                  <td style={{ padding: '0.75rem 1rem', color: 'var(--gris)' }}>{r.email}</td>
                  <td style={{ padding: '0.75rem 1rem', color: 'var(--gris)' }}>{r.empresa ?? '—'}</td>
                  <td style={{ padding: '0.75rem 1rem', color: 'var(--gris)', fontSize: '0.75rem' }}>{r.perfil ?? '—'}</td>
                  <td style={{ padding: '0.75rem 1rem', color: 'var(--gris)' }}>{r.telefono ?? '—'}</td>
                  <td style={{ padding: '0.75rem 1rem', maxWidth: 280 }}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem' }}>
                      {(r.bloques ?? []).map(b => (
                        <span key={b} style={{ fontSize: '0.58rem', letterSpacing: '0.1em', background: 'var(--amarillo)', color: 'var(--negro)', padding: '0.15rem 0.5rem', whiteSpace: 'nowrap', fontFamily: 'DM Sans, sans-serif' }}>
                          {b}
                        </span>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {registros.length === 0 && (
            <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--gris-l)', fontSize: '0.8rem', fontFamily: 'DM Sans, sans-serif' }}>
              Sin registros aún
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
