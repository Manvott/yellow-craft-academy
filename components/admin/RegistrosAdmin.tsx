'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import type { Registro } from '@/app/[locale]/admin/(panel)/registros/page'

// añadir isla al tipo local si no viene del page


interface Props { registros: Registro[] }

export default function RegistrosAdmin({ registros }: Props) {
  const router = useRouter()
  const [updating,  setUpdating]  = useState<string | null>(null)
  const [filtro,    setFiltro]    = useState<'todos' | 'pendientes' | 'confirmados'>('todos')
  const [search,    setSearch]    = useState('')
  const [editando,    setEditando]   = useState<string | null>(null)
  const [editNombre,  setEditNombre]  = useState('')
  const [editEmpresa, setEditEmpresa] = useState('')
  const [editBloques, setEditBloques] = useState<string[]>([])

  const BLOQUES_OPCIONES = [
    { value: '10:00 – 12:00h · Silma Ayres · SOSA',           label: '10:00' },
    { value: '12:00 – 13:30h · Brunch con producto',           label: '12:00' },
    { value: '14:00 – 16:00h · Alexis García · 100×100',      label: '14:00' },
    { value: '16:30 – 17:30h · Óscar Lafuente · Ron Arehucas', label: '16:30' },
    { value: '18:00 – 21:00h · Tardeo · cóctel · atardecer',  label: '18:00' },
  ]

  function startEdit(r: Registro) {
    setEditando(r.id)
    setEditNombre(r.nombre)
    setEditEmpresa(r.empresa ?? '')
    setEditBloques(r.bloques ?? [])
  }

  function toggleBloque(val: string) {
    setEditBloques(prev =>
      prev.includes(val) ? prev.filter(b => b !== val) : [...prev, val]
    )
  }

  async function guardarEdit(id: string) {
    if (!editNombre.trim()) return
    setUpdating(id)
    const supabase = createClient()
    await supabase.from('registros').update({
      nombre:  editNombre.trim(),
      empresa: editEmpresa.trim() || null,
      bloques: editBloques,
    }).eq('id', id)
    setUpdating(null)
    setEditando(null)
    router.refresh()
  }

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
    const q = search.toLowerCase()
    const matchSearch = !q ||
      r.nombre.toLowerCase().includes(q) ||
      (r.empresa ?? '').toLowerCase().includes(q)
    const matchFiltro = filtro === 'pendientes' ? !r.wa_confirmado : filtro === 'confirmados' ? r.wa_confirmado : true
    return matchSearch && matchFiltro
  })

  const waIcono = (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
    </svg>
  )

  return (
    <div>
      {/* Buscador */}
      <div style={{ marginBottom: '0.75rem' }}>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Buscar por nombre o empresa..."
          style={{ width: '100%', maxWidth: 420, background: 'var(--blanco)', border: '1px solid var(--crema3)', color: 'var(--grafito)', padding: '0.65rem 1rem', fontFamily: 'DM Sans, sans-serif', fontSize: '0.82rem', outline: 'none' }}
        />
      </div>

      {/* Filtros */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
        {(['todos', 'pendientes', 'confirmados'] as const).map(f => (
          <button key={f} onClick={() => setFiltro(f)}
            style={{ padding: '0.4rem 1rem', fontSize: '0.7rem', letterSpacing: '0.15em', textTransform: 'uppercase', fontFamily: 'DM Sans, sans-serif', border: '1px solid var(--crema3)', cursor: 'pointer', background: filtro === f ? 'var(--negro)' : 'var(--blanco)', color: filtro === f ? 'var(--crema)' : 'var(--gris)' }}>
            {f === 'todos' ? `Todos (${registros.length})` : f === 'pendientes' ? `Pendientes WA (${registros.filter(r => !r.wa_confirmado).length})` : `En lista WA (${registros.filter(r => r.wa_confirmado).length})`}
          </button>
        ))}
      </div>

      <div style={{ background: 'var(--blanco)', border: '1px solid var(--crema3)', overflow: 'hidden' }}>
        <div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem', tableLayout: 'fixed' }}>
            <colgroup>
              <col style={{ width: '28%' }} />
              <col style={{ width: '12%' }} />
              <col style={{ width: '22%' }} />
              <col style={{ width: '24%' }} />
              <col style={{ width: '5%' }} />
              <col style={{ width: '10%' }} />
            </colgroup>
            <thead>
              <tr style={{ background: 'var(--crema2)', borderBottom: '1px solid var(--crema3)' }}>
                {['Nombre / Empresa', 'Isla', 'Contacto', 'Bloques', 'WA', ''].map(h => (
                  <th key={h} style={{ textAlign: 'left', padding: '0.6rem 0.75rem', fontSize: '0.58rem', letterSpacing: '0.25em', textTransform: 'uppercase', color: 'var(--gris)', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((r, i) => {
                return (
                  <tr key={r.id} style={{ borderBottom: '1px solid var(--crema3)', background: i % 2 === 0 ? 'var(--blanco)' : 'var(--crema)' }}>

                    {/* Nombre + empresa + fecha */}
                    <td style={{ padding: '0.6rem 0.75rem', overflow: 'hidden' }}>
                      {editando === r.id ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                          <input
                            value={editNombre}
                            onChange={e => setEditNombre(e.target.value)}
                            onKeyDown={e => { if (e.key === 'Enter') guardarEdit(r.id); if (e.key === 'Escape') setEditando(null) }}
                            autoFocus
                            style={{ background: 'var(--crema)', border: '1px solid var(--negro)', color: 'var(--negro)', padding: '0.3rem 0.5rem', fontSize: '0.8rem', fontFamily: 'DM Sans, sans-serif', outline: 'none', width: '100%' }}
                          />
                          <input
                            value={editEmpresa}
                            onChange={e => setEditEmpresa(e.target.value)}
                            onKeyDown={e => { if (e.key === 'Enter') guardarEdit(r.id); if (e.key === 'Escape') setEditando(null) }}
                            placeholder="Empresa (opcional)"
                            style={{ background: 'var(--crema)', border: '1px solid var(--crema3)', color: 'var(--gris)', padding: '0.3rem 0.5rem', fontSize: '0.72rem', fontFamily: 'DM Sans, sans-serif', outline: 'none', width: '100%' }}
                          />
                          {/* Tramos */}
                          <div style={{ marginTop: '0.4rem' }}>
                            <p style={{ fontSize: '0.55rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--gris)', marginBottom: '0.3rem', fontFamily: 'DM Sans, sans-serif' }}>Tramos</p>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
                              {BLOQUES_OPCIONES.map(b => {
                                const activo = editBloques.includes(b.value)
                                return (
                                  <button key={b.value} type="button" onClick={() => toggleBloque(b.value)}
                                    style={{ padding: '0.2rem 0.5rem', fontSize: '0.6rem', fontFamily: 'DM Sans, sans-serif', border: 'none', cursor: 'pointer', background: activo ? 'var(--amarillo)' : 'var(--crema2)', color: 'var(--negro)', fontWeight: activo ? 600 : 400 }}>
                                    {b.label}
                                  </button>
                                )
                              })}
                            </div>
                          </div>
                          <div style={{ display: 'flex', gap: '0.3rem', marginTop: '0.5rem' }}>
                            <button onClick={() => guardarEdit(r.id)} disabled={updating === r.id || !editNombre.trim()}
                              style={{ background: 'var(--negro)', color: 'var(--crema)', border: 'none', padding: '0.25rem 0.65rem', fontSize: '0.6rem', letterSpacing: '0.1em', textTransform: 'uppercase', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', opacity: updating === r.id ? 0.5 : 1 }}>
                              Guardar
                            </button>
                            <button onClick={() => setEditando(null)}
                              style={{ background: 'none', border: '1px solid var(--crema3)', padding: '0.25rem 0.5rem', fontSize: '0.6rem', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', color: 'var(--gris)' }}>
                              Cancelar
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <p style={{ fontWeight: 500, color: 'var(--negro)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: '0.1rem' }}>{r.nombre}</p>
                          <p style={{ fontSize: '0.68rem', color: 'var(--gris)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {r.empresa ?? <span style={{ color: 'var(--gris-l)', fontStyle: 'italic' }}>Sin empresa</span>}
                            <span style={{ color: 'var(--gris-l)', marginLeft: '0.4rem' }}>
                              · {new Date(r.created_at).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}
                            </span>
                          </p>
                        </>
                      )}
                    </td>

                    {/* Isla */}
                    <td style={{ padding: '0.6rem 0.75rem' }}>
                      {r.isla
                        ? <span style={{ background: 'var(--amarillo)', color: 'var(--negro)', padding: '0.15rem 0.4rem', fontSize: '0.6rem', whiteSpace: 'nowrap', display: 'inline-block', maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.isla}</span>
                        : <span style={{ color: 'var(--gris-l)' }}>—</span>}
                    </td>

                    {/* Email + teléfono apilados */}
                    <td style={{ padding: '0.6rem 0.75rem', overflow: 'hidden' }}>
                      <p style={{ fontSize: '0.72rem', color: 'var(--gris)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: '0.1rem' }}>{r.email}</p>
                      <p style={{ fontSize: '0.7rem', color: 'var(--gris-l)', whiteSpace: 'nowrap' }}>{r.telefono ?? '—'}</p>
                    </td>

                    {/* Bloques — solo hora */}
                    <td style={{ padding: '0.6rem 0.75rem' }}>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.2rem' }}>
                        {(r.bloques ?? []).map(b => (
                          <span key={b} style={{ fontSize: '0.55rem', background: 'var(--amarillo)', color: 'var(--negro)', padding: '0.1rem 0.3rem', whiteSpace: 'nowrap' }}>
                            {b.split('·')[0].trim().split('–')[0].trim()}
                          </span>
                        ))}
                      </div>
                    </td>

                    {/* WA toggle */}
                    <td style={{ padding: '0.6rem 0.75rem', textAlign: 'center' }}>
                      <button onClick={() => toggleWA(r.id, r.wa_confirmado)} disabled={updating === r.id}
                        title={r.wa_confirmado ? 'Quitar de lista WA' : 'Añadir a lista WA'}
                        style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 28, height: 28, background: r.wa_confirmado ? '#25D366' : 'var(--crema2)', color: r.wa_confirmado ? '#fff' : 'var(--gris-l)', border: `1px solid ${r.wa_confirmado ? '#25D366' : 'var(--crema3)'}`, cursor: 'pointer', opacity: updating === r.id ? 0.5 : 1 }}>
                        {waIcono}
                      </button>
                    </td>

                    {/* Acciones */}
                    <td style={{ padding: '0.65rem 0.75rem', whiteSpace: 'nowrap' }}>
                      <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                        <button onClick={() => editando === r.id ? setEditando(null) : startEdit(r)} title="Editar nombre y empresa"
                          style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 26, height: 26, background: editando === r.id ? 'var(--negro)' : 'none', border: `1px solid ${editando === r.id ? 'var(--negro)' : 'var(--crema3)'}`, color: editando === r.id ? 'var(--crema)' : 'var(--gris)', cursor: 'pointer', flexShrink: 0 }}>
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
                            <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
                          </svg>
                        </button>
                        <a href={`mailto:${r.email}`} title="Email"
                          style={{ display: 'inline-flex', alignItems: 'center', fontSize: '0.62rem', color: 'var(--gris)', textDecoration: 'none', border: '1px solid var(--crema3)', padding: '0.2rem 0.5rem' }}>
                          Email
                        </a>
                        <button onClick={() => eliminar(r.id, r.nombre)} disabled={updating === r.id}
                          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', background: 'none', border: '1px solid #fca5a5', color: '#dc2626', cursor: 'pointer', padding: '0.2rem 0.5rem', fontSize: '0.62rem', fontFamily: 'DM Sans, sans-serif', opacity: updating === r.id ? 0.5 : 1, whiteSpace: 'nowrap' }}>
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/>
                            <path d="M10 11v6M14 11v6M9 6V4h6v2"/>
                          </svg>
                          Eliminar
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
