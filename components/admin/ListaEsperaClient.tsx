'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import type { RegistroEspera } from '@/app/[locale]/admin/(panel)/lista-espera/page'

const ISLAS = ['Lanzarote', 'La Graciosa', 'Fuerteventura', 'Gran Canaria', 'Tenerife', 'La Palma', 'La Gomera', 'El Hierro', 'Fuera de Canarias']

const BLOQUES_OPCIONES = [
  { value: '10:00 – 12:00h · Silma Ayres · SOSA',           label: '10:00' },
  { value: '12:00 – 13:30h · Brunch con producto',            label: '12:00' },
  { value: '14:00 – 16:00h · Alexis García · 100×100',       label: '14:00' },
  { value: '16:30 – 17:30h · Óscar Lafuente · Ron Arehucas', label: '16:30' },
  { value: '18:00 – 21:00h · Tardeo · cóctel · atardecer',   label: '18:00' },
]

const emptyForm = {
  nombre: '', email: '', empresa: '', cargo: '', telefono: '', isla: '',
  instagram: '', primera_vez: true, cliente_ava: false,
  bloques: [] as string[], acepta_whatsapp: false,
}

interface Props { registros: RegistroEspera[] }

export default function ListaEsperaClient({ registros }: Props) {
  const router = useRouter()
  const [showForm, setShowForm]   = useState(false)
  const [form, setForm]           = useState(emptyForm)
  const [saving, setSaving]       = useState(false)
  const [error, setError]         = useState('')
  const [promoting, setPromoting] = useState<string | null>(null)
  const [moviendo, setMoviendo]   = useState<string | null>(null)
  const [search, setSearch]       = useState('')

  function toggleBloque(v: string) {
    setForm(prev => ({
      ...prev,
      bloques: prev.bloques.includes(v) ? prev.bloques.filter(b => b !== v) : [...prev.bloques, v],
    }))
  }

  async function guardar() {
    if (!form.nombre.trim() || !form.email.trim()) { setError('Nombre y email son obligatorios.'); return }
    setSaving(true); setError('')
    const supabase = createClient()
    // Siguiente posición = max actual + 1
    const nextOrden = registros.length > 0
      ? Math.max(...registros.map(r => r.lista_espera_orden ?? 0)) + 1
      : 1
    const { error: err } = await supabase.from('registros').insert({
      nombre:             form.nombre.trim(),
      email:              form.email.trim(),
      empresa:            form.empresa.trim() || null,
      cargo:              form.cargo.trim() || null,
      telefono:           form.telefono.trim() || null,
      isla:               form.isla || null,
      instagram:          form.instagram.trim() || null,
      primera_vez:        form.primera_vez,
      cliente_ava:        form.cliente_ava,
      bloques:            form.bloques,
      acepta_whatsapp:    form.acepta_whatsapp,
      acepta_imagen:      false,
      origen:             'admin',
      lista_espera:       true,
      lista_espera_orden: nextOrden,
      wa_confirmado:      false,
      wa_mensaje_enviado: false,
      asistio:            false,
    })
    setSaving(false)
    if (err) { setError(err.message); return }
    setForm(emptyForm); setShowForm(false); router.refresh()
  }

  async function promover(id: string) {
    setPromoting(id)
    const supabase = createClient()
    await supabase.from('registros').update({ lista_espera: false, lista_espera_orden: null }).eq('id', id)
    setPromoting(null)
    router.refresh()
  }

  // Intercambia el orden de dos filas adyacentes
  async function mover(index: number, direccion: 'arriba' | 'abajo') {
    const targetIndex = direccion === 'arriba' ? index - 1 : index + 1
    if (targetIndex < 0 || targetIndex >= registros.length) return
    const a = registros[index]
    const b = registros[targetIndex]
    setMoviendo(a.id)
    const supabase = createClient()
    const ordenA = a.lista_espera_orden ?? index + 1
    const ordenB = b.lista_espera_orden ?? targetIndex + 1
    await Promise.all([
      supabase.from('registros').update({ lista_espera_orden: ordenB }).eq('id', a.id),
      supabase.from('registros').update({ lista_espera_orden: ordenA }).eq('id', b.id),
    ])
    setMoviendo(null)
    router.refresh()
  }

  const filtered = registros.filter(r =>
    r.nombre.toLowerCase().includes(search.toLowerCase()) ||
    (r.empresa ?? '').toLowerCase().includes(search.toLowerCase())
  )
  const isFiltering = search.trim().length > 0

  const S = {
    label: { display: 'block' as const, fontSize: '0.58rem', letterSpacing: '0.2em', textTransform: 'uppercase' as const, color: 'var(--gris)', marginBottom: '0.25rem', fontFamily: 'DM Sans, sans-serif' },
    input: { width: '100%', background: 'var(--crema)', border: '1px solid var(--crema3)', padding: '0.6rem 0.75rem', fontSize: '0.82rem', outline: 'none', fontFamily: 'DM Sans, sans-serif', color: 'var(--negro)', boxSizing: 'border-box' as const },
  }

  return (
    <div>
      {/* Cabecera */}
      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <span style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '0.82rem' }}>
          <strong style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.8rem', fontWeight: 300, color: '#c2410c' }}>{registros.length}</strong>
          <span style={{ color: 'var(--gris)', marginLeft: '0.4rem' }}>en espera</span>
        </span>
        <button onClick={() => { setShowForm(v => !v); setError('') }}
          style={{ marginLeft: 'auto', display: 'inline-flex', alignItems: 'center', gap: '0.4rem', background: showForm ? 'var(--gris)' : 'var(--negro)', color: 'var(--crema)', border: 'none', padding: '0.6rem 1.25rem', fontSize: '0.68rem', letterSpacing: '0.15em', textTransform: 'uppercase', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' }}>
          {showForm ? '✕ Cancelar' : '+ Añadir a lista de espera'}
        </button>
      </div>

      {/* Formulario */}
      {showForm && (
        <div style={{ border: '2px solid #c2410c', padding: '1.5rem', marginBottom: '1.5rem', background: '#fff7ed' }}>
          <p style={{ fontSize: '0.58rem', letterSpacing: '0.3em', textTransform: 'uppercase', color: '#c2410c', marginBottom: '1.25rem', fontFamily: 'DM Sans, sans-serif', fontWeight: 600 }}>
            Añadir a lista de espera · <span style={{ color: '#7c3aed' }}>origen: admin</span>
            {' '}· <span style={{ color: 'var(--gris)' }}>posición #{registros.length + 1}</span>
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '0.75rem', marginBottom: '0.75rem' }}>
            {([
              { label: 'Nombre *',   key: 'nombre'    as const, placeholder: 'Nombre completo' },
              { label: 'Email *',    key: 'email'     as const, placeholder: 'email@dominio.com' },
              { label: 'Empresa',    key: 'empresa'   as const, placeholder: 'Nombre empresa (opcional)' },
              { label: 'Cargo',      key: 'cargo'     as const, placeholder: 'Cargo que ocupa' },
              { label: 'Teléfono',   key: 'telefono'  as const, placeholder: '+34 600 000 000' },
              { label: 'Instagram',  key: 'instagram' as const, placeholder: '@usuario (opcional)' },
            ] as const).map(({ label, key, placeholder }) => (
              <div key={key}>
                <label style={S.label}>{label}</label>
                <input value={form[key] as string} onChange={e => setForm(prev => ({ ...prev, [key]: e.target.value }))}
                  placeholder={placeholder} style={S.input} />
              </div>
            ))}

            <div>
              <label style={S.label}>Isla</label>
              <select value={form.isla} onChange={e => setForm(prev => ({ ...prev, isla: e.target.value }))}
                style={{ ...S.input, appearance: 'auto' as any }}>
                <option value="">Selecciona isla...</option>
                {ISLAS.map(i => <option key={i} value={i}>{i}</option>)}
              </select>
            </div>
          </div>

          {/* Bloques */}
          <div style={{ marginBottom: '0.75rem' }}>
            <label style={S.label}>Tramos de asistencia</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
              {BLOQUES_OPCIONES.map(b => {
                const activo = form.bloques.includes(b.value)
                return (
                  <button key={b.value} type="button" onClick={() => toggleBloque(b.value)}
                    style={{ padding: '0.3rem 0.75rem', fontSize: '0.65rem', fontFamily: 'DM Sans, sans-serif', border: `1px solid ${activo ? 'var(--negro)' : 'var(--crema3)'}`, cursor: 'pointer', background: activo ? 'var(--amarillo)' : 'var(--blanco)', color: 'var(--negro)', fontWeight: activo ? 600 : 400 }}>
                    {b.label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Radios */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '0.75rem', marginBottom: '0.75rem' }}>
            <div>
              <label style={S.label}>¿Primera vez en evento AVA?</label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                {[{ v: true, l: 'Sí' }, { v: false, l: 'No' }].map(({ v, l }) => (
                  <label key={l} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer', padding: '0.5rem 0.85rem', background: 'var(--blanco)', border: `1px solid ${form.primera_vez === v ? 'var(--negro)' : 'var(--crema3)'}`, fontSize: '0.78rem', flex: 1 }}>
                    <input type="radio" checked={form.primera_vez === v} onChange={() => setForm(prev => ({ ...prev, primera_vez: v }))} style={{ accentColor: 'var(--negro)' }} />
                    {l}
                  </label>
                ))}
              </div>
            </div>
            <div>
              <label style={S.label}>¿Cliente de AVA?</label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                {[{ v: true, l: 'Sí' }, { v: false, l: 'No' }].map(({ v, l }) => (
                  <label key={l} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer', padding: '0.5rem 0.85rem', background: 'var(--blanco)', border: `1px solid ${form.cliente_ava === v ? 'var(--negro)' : 'var(--crema3)'}`, fontSize: '0.78rem', flex: 1 }}>
                    <input type="radio" checked={form.cliente_ava === v} onChange={() => setForm(prev => ({ ...prev, cliente_ava: v }))} style={{ accentColor: 'var(--negro)' }} />
                    {l}
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* WhatsApp */}
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', cursor: 'pointer', marginBottom: '1rem', fontSize: '0.78rem', color: 'var(--gris)', fontFamily: 'DM Sans, sans-serif' }}>
            <input type="checkbox" checked={form.acepta_whatsapp} onChange={e => setForm(prev => ({ ...prev, acepta_whatsapp: e.target.checked }))} style={{ accentColor: 'var(--negro)', width: 14, height: 14 }} />
            Acepta canal de difusión WhatsApp
          </label>

          {error && <p style={{ fontSize: '0.78rem', color: '#c2410c', marginBottom: '0.75rem' }}>{error}</p>}

          <button onClick={guardar} disabled={saving}
            style={{ background: '#c2410c', color: '#fff', border: 'none', padding: '0.7rem 1.5rem', fontSize: '0.68rem', letterSpacing: '0.15em', textTransform: 'uppercase', cursor: saving ? 'wait' : 'pointer', fontFamily: 'DM Sans, sans-serif', opacity: saving ? 0.6 : 1 }}>
            {saving ? 'Guardando...' : 'Añadir a lista de espera'}
          </button>
        </div>
      )}

      {/* Buscador */}
      <input value={search} onChange={e => setSearch(e.target.value)}
        placeholder="Buscar por nombre o empresa..."
        style={{ width: '100%', background: 'var(--blanco)', border: '1px solid var(--crema3)', color: 'var(--grafito)', padding: '0.65rem 1rem', fontFamily: 'DM Sans, sans-serif', fontSize: '0.82rem', outline: 'none', marginBottom: '1rem', boxSizing: 'border-box' }} />

      {isFiltering && (
        <p style={{ fontSize: '0.68rem', color: 'var(--gris-l)', marginBottom: '0.75rem', fontFamily: 'DM Sans, sans-serif' }}>
          Mostrando {filtered.length} resultado{filtered.length !== 1 ? 's' : ''} — el orden real no cambia al buscar
        </p>
      )}

      {/* Lista */}
      <div style={{ background: 'var(--blanco)', border: '1px solid var(--crema3)', overflow: 'hidden' }}>
        {filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--gris-l)', fontSize: '0.82rem', fontFamily: 'DM Sans, sans-serif' }}>
            {registros.length === 0 ? 'No hay nadie en lista de espera.' : 'Sin resultados.'}
          </div>
        )}
        {filtered.map((r, i) => {
          // Índice real en la lista original (para mover correctamente)
          const realIndex = registros.findIndex(x => x.id === r.id)
          const posicion = r.lista_espera_orden ?? (realIndex + 1)
          const enMovimiento = moviendo === r.id

          return (
            <div key={r.id} style={{ display: 'grid', gridTemplateColumns: '44px 1fr auto', gap: '0.75rem', alignItems: 'center', padding: '0.75rem 1rem', borderBottom: '1px solid var(--crema3)', background: i % 2 === 0 ? 'var(--blanco)' : '#fff7ed', opacity: enMovimiento ? 0.5 : 1, transition: 'opacity 0.2s' }}>

              {/* Número + flechas */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.15rem' }}>
                <button onClick={() => mover(realIndex, 'arriba')} disabled={realIndex === 0 || enMovimiento || isFiltering}
                  style={{ background: 'none', border: 'none', cursor: realIndex === 0 || isFiltering ? 'default' : 'pointer', color: realIndex === 0 || isFiltering ? 'var(--crema3)' : 'var(--gris)', padding: '0.1rem', lineHeight: 1, fontSize: '0.7rem' }}>
                  ▲
                </button>
                <span style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.3rem', fontWeight: 300, color: '#c2410c', lineHeight: 1, minWidth: 24, textAlign: 'center' }}>
                  {posicion}
                </span>
                <button onClick={() => mover(realIndex, 'abajo')} disabled={realIndex === registros.length - 1 || enMovimiento || isFiltering}
                  style={{ background: 'none', border: 'none', cursor: realIndex === registros.length - 1 || isFiltering ? 'default' : 'pointer', color: realIndex === registros.length - 1 || isFiltering ? 'var(--crema3)' : 'var(--gris)', padding: '0.1rem', lineHeight: 1, fontSize: '0.7rem' }}>
                  ▼
                </button>
              </div>

              {/* Info */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.15rem', flexWrap: 'wrap' }}>
                  <p style={{ fontWeight: 500, fontSize: '0.85rem', color: 'var(--negro)', margin: 0 }}>{r.nombre}</p>
                  {r.cliente_ava && <span style={{ fontSize: '0.5rem', letterSpacing: '0.1em', textTransform: 'uppercase', background: '#e0f2fe', color: '#0369a1', padding: '0.1rem 0.35rem', fontFamily: 'DM Sans, sans-serif', fontWeight: 600, border: '1px solid #bae6fd' }}>Cliente AVA</span>}
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                  {r.empresa && <span style={{ fontSize: '0.7rem', color: 'var(--gris)' }}>{r.empresa}</span>}
                  {r.cargo && <span style={{ fontSize: '0.68rem', color: 'var(--gris-l)' }}>{r.cargo}</span>}
                  {r.isla && <span style={{ fontSize: '0.58rem', background: 'var(--amarillo)', color: 'var(--negro)', padding: '0.05rem 0.35rem' }}>{r.isla}</span>}
                  {r.telefono && <span style={{ fontSize: '0.65rem', color: 'var(--gris-l)' }}>{r.telefono}</span>}
                  {r.email && <span style={{ fontSize: '0.65rem', color: 'var(--gris-l)' }}>{r.email}</span>}
                </div>
                {(r.bloques ?? []).length > 0 && (
                  <div style={{ display: 'flex', gap: '0.2rem', flexWrap: 'wrap', marginTop: '0.25rem' }}>
                    {(r.bloques ?? []).map(b => (
                      <span key={b} style={{ fontSize: '0.52rem', background: 'var(--crema2)', color: 'var(--gris)', padding: '0.1rem 0.3rem', border: '1px solid var(--crema3)', whiteSpace: 'nowrap' }}>
                        {b.split('·')[0].trim().split('–')[0].trim()}
                      </span>
                    ))}
                  </div>
                )}
                <p style={{ fontSize: '0.6rem', color: 'var(--gris-l)', marginTop: '0.2rem', fontFamily: 'DM Sans, sans-serif' }}>
                  {new Date(r.created_at).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>

              {/* Acción */}
              <button onClick={() => promover(r.id)} disabled={promoting === r.id}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', background: 'var(--negro)', color: 'var(--crema)', border: 'none', padding: '0.5rem 1rem', fontSize: '0.62rem', letterSpacing: '0.12em', textTransform: 'uppercase', cursor: promoting === r.id ? 'wait' : 'pointer', fontFamily: 'DM Sans, sans-serif', opacity: promoting === r.id ? 0.5 : 1, whiteSpace: 'nowrap' }}>
                ✓ Confirmar
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
