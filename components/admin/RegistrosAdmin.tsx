'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import type { Registro as RegistroBase } from '@/app/[locale]/admin/(panel)/registros/page'

type Registro = RegistroBase & { origen?: string | null }

interface Props { registros: Registro[] }

const ISLAS = ['Lanzarote', 'Gran Canaria', 'Tenerife', 'Fuerteventura', 'La Palma', 'La Gomera', 'El Hierro', 'La Graciosa']

const emptyNuevo = { nombre: '', empresa: '', email: '', telefono: '', isla: '', bloques: [] as string[] }

export default function RegistrosAdmin({ registros }: Props) {
  const router = useRouter()
  const [updating,    setUpdating]  = useState<string | null>(null)
  const [filtro,      setFiltro]    = useState<'todos' | 'pendientes' | 'confirmados' | 'solo-tardeo'>('todos')
  const [search,      setSearch]    = useState('')
  const [showNuevo,   setShowNuevo] = useState(false)
  const [nuevo,       setNuevo]     = useState(emptyNuevo)
  const [savingNuevo, setSavingNuevo] = useState(false)
  const [errorNuevo,  setErrorNuevo]  = useState('')
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

  async function guardarNuevo() {
    if (!nuevo.nombre.trim() || !nuevo.email.trim()) { setErrorNuevo('Nombre y email son obligatorios.'); return }
    setSavingNuevo(true); setErrorNuevo('')
    const supabase = createClient()
    const { error } = await supabase.from('registros').insert({
      nombre:   nuevo.nombre.trim(),
      empresa:  nuevo.empresa.trim() || null,
      email:    nuevo.email.trim(),
      telefono: nuevo.telefono.trim() || null,
      isla:     nuevo.isla || null,
      bloques:  nuevo.bloques,
      origen:   'admin',
      primera_vez: false,
      cliente_ava: false,
      acepta_whatsapp: false,
      wa_confirmado: false,
      wa_mensaje_enviado: false,
      asistio: false,
    })
    setSavingNuevo(false)
    if (error) { setErrorNuevo(error.message); return }
    setNuevo(emptyNuevo); setShowNuevo(false); router.refresh()
  }

  function toggleNuevoBloque(val: string) {
    setNuevo(prev => ({
      ...prev,
      bloques: prev.bloques.includes(val) ? prev.bloques.filter(b => b !== val) : [...prev.bloques, val],
    }))
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

  const TARDEO_VALUE = '18:00 – 21:00h · Tardeo · cóctel · atardecer'
  const esSoloTardeo = (r: Registro) => {
    const b = r.bloques ?? []
    return b.length === 1 && b[0] === TARDEO_VALUE
  }

  const soloTardeoCount = registros.filter(esSoloTardeo).length

  const filtered = registros.filter(r => {
    const q = search.toLowerCase()
    const matchSearch = !q ||
      r.nombre.toLowerCase().includes(q) ||
      (r.empresa ?? '').toLowerCase().includes(q)
    const matchFiltro =
      filtro === 'pendientes'   ? !r.wa_confirmado :
      filtro === 'confirmados'  ? r.wa_confirmado :
      filtro === 'solo-tardeo'  ? esSoloTardeo(r) :
      true
    return matchSearch && matchFiltro
  })

  const waIcono = (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
    </svg>
  )

  return (
    <div>
      {/* Header: buscador + botón nuevo */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', gap: '1rem' }}>
        <button onClick={() => { setShowNuevo(v => !v); setErrorNuevo('') }}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', background: showNuevo ? 'var(--gris)' : 'var(--negro)', color: 'var(--crema)', border: 'none', padding: '0.55rem 1.1rem', fontSize: '0.68rem', letterSpacing: '0.15em', textTransform: 'uppercase', fontFamily: 'DM Sans, sans-serif', cursor: 'pointer', whiteSpace: 'nowrap' }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          {showNuevo ? 'Cancelar' : 'Nuevo asistente'}
        </button>
      </div>

      {/* Formulario creación */}
      {showNuevo && (
        <div style={{ background: 'var(--blanco)', border: '1px solid var(--negro)', padding: '1.5rem', marginBottom: '1.25rem' }}>
          <p style={{ fontSize: '0.58rem', letterSpacing: '0.3em', textTransform: 'uppercase', color: 'var(--gris)', marginBottom: '1rem', fontFamily: 'DM Sans, sans-serif' }}>
            Añadir asistente manualmente · <span style={{ color: '#7c3aed', fontWeight: 600 }}>origen: admin</span>
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '0.75rem', marginBottom: '0.75rem' }}>
            {([
              { label: 'Nombre *', key: 'nombre' as const, placeholder: 'Nombre completo' },
              { label: 'Email *',  key: 'email'  as const, placeholder: 'email@dominio.com' },
              { label: 'Empresa',  key: 'empresa' as const, placeholder: 'Nombre empresa (opcional)' },
              { label: 'Teléfono', key: 'telefono' as const, placeholder: '+34 600 000 000' },
            ] as const).map(({ label, key, placeholder }) => (
              <div key={key}>
                <label style={{ display: 'block', fontSize: '0.58rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--gris)', marginBottom: '0.25rem', fontFamily: 'DM Sans, sans-serif' }}>{label}</label>
                <input
                  value={nuevo[key]}
                  onChange={e => setNuevo(prev => ({ ...prev, [key]: e.target.value }))}
                  placeholder={placeholder}
                  style={{ width: '100%', background: 'var(--crema)', border: '1px solid var(--crema3)', color: 'var(--negro)', padding: '0.5rem 0.75rem', fontSize: '0.82rem', fontFamily: 'DM Sans, sans-serif', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>
            ))}
          </div>
          <div style={{ marginBottom: '0.75rem' }}>
            <label style={{ display: 'block', fontSize: '0.58rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--gris)', marginBottom: '0.25rem', fontFamily: 'DM Sans, sans-serif' }}>Isla</label>
            <select value={nuevo.isla} onChange={e => setNuevo(prev => ({ ...prev, isla: e.target.value }))}
              style={{ width: '100%', maxWidth: 280, background: 'var(--crema)', border: '1px solid var(--crema3)', color: 'var(--negro)', padding: '0.5rem 0.75rem', fontSize: '0.82rem', fontFamily: 'DM Sans, sans-serif', outline: 'none' }}>
              <option value="">— Seleccionar isla —</option>
              {ISLAS.map(i => <option key={i} value={i}>{i}</option>)}
            </select>
          </div>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', fontSize: '0.58rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--gris)', marginBottom: '0.4rem', fontFamily: 'DM Sans, sans-serif' }}>Tramos</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
              {BLOQUES_OPCIONES.map(b => {
                const activo = nuevo.bloques.includes(b.value)
                return (
                  <button key={b.value} type="button" onClick={() => toggleNuevoBloque(b.value)}
                    style={{ padding: '0.3rem 0.75rem', fontSize: '0.68rem', fontFamily: 'DM Sans, sans-serif', border: '1px solid var(--crema3)', cursor: 'pointer', background: activo ? 'var(--amarillo)' : 'var(--crema2)', color: 'var(--negro)', fontWeight: activo ? 600 : 400 }}>
                    {b.label}
                  </button>
                )
              })}
            </div>
          </div>
          {errorNuevo && <p style={{ color: '#dc2626', fontSize: '0.75rem', marginBottom: '0.75rem', fontFamily: 'DM Sans, sans-serif' }}>{errorNuevo}</p>}
          <button onClick={guardarNuevo} disabled={savingNuevo}
            style={{ background: 'var(--negro)', color: 'var(--crema)', border: 'none', padding: '0.65rem 1.5rem', fontSize: '0.7rem', letterSpacing: '0.15em', textTransform: 'uppercase', fontFamily: 'DM Sans, sans-serif', cursor: 'pointer', opacity: savingNuevo ? 0.5 : 1 }}>
            {savingNuevo ? 'Guardando...' : 'Crear asistente'}
          </button>
        </div>
      )}

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
        {([
          { key: 'todos',       label: `Todos (${registros.length})` },
          { key: 'solo-tardeo', label: `Solo tardeo (${soloTardeoCount})` },
          { key: 'pendientes',  label: `Pendientes WA (${registros.filter(r => !r.wa_confirmado).length})` },
          { key: 'confirmados', label: `En lista WA (${registros.filter(r => r.wa_confirmado).length})` },
        ] as const).map(({ key, label }) => (
          <button key={key} onClick={() => setFiltro(key)}
            style={{ padding: '0.4rem 1rem', fontSize: '0.7rem', letterSpacing: '0.15em', textTransform: 'uppercase', fontFamily: 'DM Sans, sans-serif', border: `1px solid ${key === 'solo-tardeo' ? '#d97706' : 'var(--crema3)'}`, cursor: 'pointer', background: filtro === key ? (key === 'solo-tardeo' ? '#d97706' : 'var(--negro)') : 'var(--blanco)', color: filtro === key ? (key === 'solo-tardeo' ? '#fff' : 'var(--crema)') : (key === 'solo-tardeo' ? '#d97706' : 'var(--gris)') }}>
            {label}
          </button>
        ))}
      </div>

      <div style={{ background: 'var(--blanco)', border: '1px solid var(--crema3)', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
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
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.1rem' }}>
                            <p style={{ fontWeight: 500, color: 'var(--negro)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', margin: 0, flex: 1 }}>{r.nombre}</p>
                            {esSoloTardeo(r) && (
                              <span style={{ fontSize: '0.5rem', letterSpacing: '0.1em', textTransform: 'uppercase', background: '#fef3c7', color: '#b45309', padding: '0.1rem 0.35rem', flexShrink: 0, fontFamily: 'DM Sans, sans-serif', fontWeight: 600, border: '1px solid #fcd34d' }}>Tardeo</span>
                            )}
                            {r.origen === 'admin' && (
                              <span style={{ fontSize: '0.5rem', letterSpacing: '0.12em', textTransform: 'uppercase', background: '#ede9fe', color: '#7c3aed', padding: '0.1rem 0.35rem', flexShrink: 0, fontFamily: 'DM Sans, sans-serif', fontWeight: 600 }}>Admin</span>
                            )}
                          </div>
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
