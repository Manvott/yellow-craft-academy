'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import type { Registro } from '@/app/[locale]/admin/(panel)/registros/page'

// añadir isla al tipo local si no viene del page


interface Props { registros: Registro[] }

export default function RegistrosAdmin({ registros }: Props) {
  const router = useRouter()
  const [updating, setUpdating] = useState<string | null>(null)
  const [filtro, setFiltro] = useState<'todos' | 'pendientes' | 'confirmados'>('todos')

  async function toggleWA(id: string, current: boolean) {
    setUpdating(id)
    const supabase = createClient()
    await supabase.from('registros').update({ wa_confirmado: !current }).eq('id', id)
    setUpdating(null)
    router.refresh()
  }

  async function eliminar(id: string, nombre: string) {
    if (!confirm(`¿Eliminar el registro de "${nombre}"? Esta acción no se puede deshacer.`)) return
    setUpdating(id)
    const supabase = createClient()
    await supabase.from('registros').delete().eq('id', id)
    setUpdating(null)
    router.refresh()
  }

  const filtered = registros.filter(r => {
    if (filtro === 'pendientes') return !r.wa_confirmado
    if (filtro === 'confirmados') return r.wa_confirmado
    return true
  })

  const waIcono = (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
    </svg>
  )

  return (
    <div>
      {/* Filtros */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem' }}>
        {(['todos', 'pendientes', 'confirmados'] as const).map(f => (
          <button key={f} onClick={() => setFiltro(f)}
            style={{ padding: '0.4rem 1rem', fontSize: '0.7rem', letterSpacing: '0.15em', textTransform: 'uppercase', fontFamily: 'DM Sans, sans-serif', border: '1px solid var(--crema3)', cursor: 'pointer', background: filtro === f ? 'var(--negro)' : 'var(--blanco)', color: filtro === f ? 'var(--crema)' : 'var(--gris)' }}>
            {f === 'todos' ? `Todos (${registros.length})` : f === 'pendientes' ? `Pendientes WA (${registros.filter(r => !r.wa_confirmado).length})` : `En lista WA (${registros.filter(r => r.wa_confirmado).length})`}
          </button>
        ))}
      </div>

      <div style={{ background: 'var(--blanco)', border: '1px solid var(--crema3)', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
            <thead>
              <tr style={{ background: 'var(--crema2)', borderBottom: '1px solid var(--crema3)' }}>
                {['Fecha', 'Nombre', 'Isla', 'Email', 'Teléfono', 'Bloques', 'WA Lista', 'Acciones'].map(h => (
                  <th key={h} style={{ textAlign: 'left', padding: '0.75rem 1rem', fontSize: '0.6rem', letterSpacing: '0.3em', textTransform: 'uppercase', color: 'var(--gris)', fontWeight: 500, whiteSpace: 'nowrap' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((r, i) => {
                const etiqueta = r.isla ? `${r.nombre} - ${r.isla}` : r.nombre
                const waText = encodeURIComponent(`Hola ${r.nombre}, gracias por inscribirte en Yellow Craft Academy. Te confirmo tu plaza para el 15 de junio. Sala Ocean, Puerto del Carmen, Lanzarote. ¡Nos vemos allí!`)
                const waLink = r.telefono
                  ? `https://wa.me/${r.telefono.replace(/\D/g, '')}?text=${waText}`
                  : null

                return (
                  <tr key={r.id} style={{ borderBottom: '1px solid var(--crema3)', background: i % 2 === 0 ? 'var(--blanco)' : 'var(--crema)' }}>
                    <td style={{ padding: '0.75rem 1rem', color: 'var(--gris-l)', whiteSpace: 'nowrap', fontSize: '0.75rem' }}>
                      {new Date(r.created_at).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}
                    </td>
                    <td style={{ padding: '0.75rem 1rem', fontWeight: 500, color: 'var(--negro)', whiteSpace: 'nowrap' }}>{r.nombre}</td>
                    <td style={{ padding: '0.75rem 1rem', fontSize: '0.75rem', whiteSpace: 'nowrap' }}>
                      {r.isla ? (
                        <span style={{ background: 'var(--amarillo)', color: 'var(--negro)', padding: '0.15rem 0.5rem', fontSize: '0.65rem', letterSpacing: '0.08em', fontFamily: 'DM Sans, sans-serif' }}>
                          {r.isla}
                        </span>
                      ) : <span style={{ color: 'var(--gris-l)' }}>—</span>}
                    </td>
                    <td style={{ padding: '0.75rem 1rem', color: 'var(--gris)', fontSize: '0.78rem' }}>{r.email}</td>
                    <td style={{ padding: '0.75rem 1rem', color: 'var(--gris)', fontSize: '0.78rem' }}>{r.empresa ?? '—'}</td>
                    <td style={{ padding: '0.75rem 1rem', color: 'var(--gris)', whiteSpace: 'nowrap', fontSize: '0.78rem' }}>{r.telefono ?? '—'}</td>
                    <td style={{ padding: '0.75rem 1rem', maxWidth: 240 }}>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
                        {(r.bloques ?? []).map(b => (
                          <span key={b} style={{ fontSize: '0.55rem', letterSpacing: '0.08em', background: 'var(--amarillo)', color: 'var(--negro)', padding: '0.1rem 0.4rem', whiteSpace: 'nowrap', fontFamily: 'DM Sans, sans-serif' }}>
                            {b.split('·')[0].trim()}
                          </span>
                        ))}
                      </div>
                    </td>
                    {/* Toggle WA confirmado */}
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <button
                        onClick={() => toggleWA(r.id, r.wa_confirmado)}
                        disabled={updating === r.id}
                        title={r.wa_confirmado ? 'Quitar de lista WA' : 'Marcar como añadido a lista WA'}
                        style={{
                          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                          width: 28, height: 28,
                          background: r.wa_confirmado ? '#25D366' : 'var(--crema2)',
                          color: r.wa_confirmado ? '#fff' : 'var(--gris-l)',
                          border: `1px solid ${r.wa_confirmado ? '#25D366' : 'var(--crema3)'}`,
                          cursor: 'pointer', opacity: updating === r.id ? 0.5 : 1,
                        }}
                      >
                        {waIcono}
                      </button>
                    </td>
                    {/* Acciones rápidas */}
                    <td style={{ padding: '0.75rem 1rem', whiteSpace: 'nowrap' }}>
                      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        {waLink && (
                          <a
                            href={waLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            title="Abrir chat WhatsApp"
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.65rem', color: '#25D366', textDecoration: 'none', letterSpacing: '0.1em', border: '1px solid #25D366', padding: '0.25rem 0.6rem', fontFamily: 'DM Sans, sans-serif' }}
                          >
                            {waIcono} Chat
                          </a>
                        )}
                        <a
                          href={`mailto:${r.email}`}
                          title="Enviar email"
                          style={{ display: 'inline-flex', alignItems: 'center', fontSize: '0.65rem', color: 'var(--gris)', textDecoration: 'none', border: '1px solid var(--crema3)', padding: '0.25rem 0.6rem', fontFamily: 'DM Sans, sans-serif' }}
                        >
                          Email
                        </a>
                        <button
                          onClick={() => eliminar(r.id, r.nombre)}
                          disabled={updating === r.id}
                          title="Eliminar registro"
                          style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 28, height: 28, background: 'none', border: '1px solid #fca5a5', color: '#dc2626', cursor: 'pointer', opacity: updating === r.id ? 0.5 : 1, flexShrink: 0 }}
                        >
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/>
                            <path d="M10 11v6M14 11v6M9 6V4h6v2"/>
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--gris-l)' }}>
              <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.4rem', fontWeight: 300 }}>Sin registros</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
