import { createClient } from '@/lib/supabase/server'
import type { SolicitudInfo } from '@/lib/types'

export default async function SolicitudesPage() {
  let solicitudes: SolicitudInfo[] = []
  try {
    const supabase = await createClient()
    const { data } = await supabase
      .from('solicitudes_info')
      .select('*, producto:productos(nombre), proveedor:proveedores(nombre)')
      .order('created_at', { ascending: false })
    solicitudes = (data as SolicitudInfo[]) ?? []
  } catch {}

  return (
    <div>
      <h1 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '2rem', fontWeight: 300, color: 'var(--negro)', marginBottom: '2rem' }}>
        Solicitudes recibidas
      </h1>
      <div style={{ background: 'var(--blanco)', border: '1px solid var(--crema3)', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
            <thead>
              <tr style={{ background: 'var(--crema2)', borderBottom: '1px solid var(--crema3)' }}>
                {['Fecha', 'Nombre', 'Email', 'Empresa', 'Isla', 'Cargo', 'Producto', 'Proveedor'].map(h => (
                  <th key={h} style={{ textAlign: 'left', padding: '0.75rem 1rem', fontSize: '0.6rem', letterSpacing: '0.3em', textTransform: 'uppercase', color: 'var(--gris)', fontWeight: 500, whiteSpace: 'nowrap' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {solicitudes.map((s, i) => (
                <tr key={s.id} style={{ borderBottom: '1px solid var(--crema3)', background: i % 2 === 0 ? 'var(--blanco)' : 'var(--crema)' }}>
                  <td style={{ padding: '0.75rem 1rem', color: 'var(--gris-l)', whiteSpace: 'nowrap', fontSize: '0.75rem' }}>
                    {new Date(s.created_at).toLocaleDateString('es-ES')}
                  </td>
                  <td style={{ padding: '0.75rem 1rem', fontWeight: 500, color: 'var(--negro)' }}>{s.nombre}</td>
                  <td style={{ padding: '0.75rem 1rem', color: 'var(--gris)' }}>{s.email}</td>
                  <td style={{ padding: '0.75rem 1rem', color: 'var(--gris)' }}>{s.empresa ?? '—'}</td>
                  <td style={{ padding: '0.75rem 1rem', color: 'var(--gris)', textTransform: 'capitalize' }}>{s.isla ?? '—'}</td>
                  <td style={{ padding: '0.75rem 1rem', color: 'var(--gris)' }}>{s.cargo ?? '—'}</td>
                  <td style={{ padding: '0.75rem 1rem', color: 'var(--gris)' }}>{(s as any).producto?.nombre ?? '—'}</td>
                  <td style={{ padding: '0.75rem 1rem', color: 'var(--gris)' }}>{(s as any).proveedor?.nombre ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {solicitudes.length === 0 && (
            <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--gris-l)', fontSize: '0.8rem' }}>
              Sin solicitudes aún
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
