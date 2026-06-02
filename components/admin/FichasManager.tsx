'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import type { ProductoFicha } from '@/app/[locale]/admin/(panel)/fichas/page'
import type { Proveedor } from '@/lib/types'

interface Props { productos: ProductoFicha[]; proveedores: Proveedor[] }

const emptyForm = {
  proveedor_id: '', nombre: '', descripcion: '', imagen_url: '',
  categoria: '', precio_orientativo: '', unidad_venta: '',
  ficha_tecnica_url: '', producto_combinar: '',
  tiene_cargo: false, tipo_servicio: 'ambos' as 'desayuno' | 'tardeo' | 'ambos',
  disponible: true, publicado_catalogo: false, orden: 0,
}

const S = {
  input: { width: '100%', background: 'var(--crema)', border: '1px solid var(--crema3)', color: 'var(--grafito)', padding: '0.75rem 0.9rem', fontFamily: 'DM Sans, sans-serif', fontSize: '0.82rem', outline: 'none' } as React.CSSProperties,
  label: { fontSize: '0.6rem', letterSpacing: '0.25em', textTransform: 'uppercase' as const, color: 'var(--gris)', display: 'block', marginBottom: '0.3rem', fontFamily: 'DM Sans, sans-serif' },
}

function Toggle({ on, label, onToggle, color = 'var(--negro)' }: { on: boolean; label: string; onToggle: () => void; color?: string }) {
  return (
    <button onClick={onToggle} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.45rem 0.9rem', border: `1px solid ${on ? color : 'var(--crema3)'}`, background: on ? color : 'var(--crema)', cursor: 'pointer', fontSize: '0.7rem', color: on ? 'var(--crema)' : 'var(--gris)', fontFamily: 'DM Sans, sans-serif', transition: 'all 0.2s' }}>
      <span style={{ width: 8, height: 8, borderRadius: '50%', background: on ? 'var(--amarillo)' : 'var(--gris-l)', display: 'inline-block' }} />
      {label}
    </button>
  )
}

export default function FichasManager({ productos, proveedores }: Props) {
  const router = useRouter()
  const [form, setForm] = useState<typeof emptyForm>(emptyForm)
  const [editing, setEditing] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [filtro, setFiltro] = useState<'todos' | 'publicados' | 'borrador'>('todos')
  const [showForm, setShowForm] = useState(false)

  const f = (key: keyof typeof emptyForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm(prev => ({ ...prev, [key]: e.target.value }))
  }

  async function save() {
    setLoading(true)
    const supabase = createClient()
    const data = { ...form, precio_orientativo: form.precio_orientativo ? parseFloat(form.precio_orientativo) : null, orden: Number(form.orden) }
    if (editing) {
      await supabase.from('productos').update(data).eq('id', editing)
    } else {
      await supabase.from('productos').insert(data)
    }
    setForm(emptyForm); setEditing(null); setLoading(false); setShowForm(false); router.refresh()
  }

  async function toggleCatalogo(id: string, current: boolean) {
    const supabase = createClient()
    await supabase.from('productos').update({ publicado_catalogo: !current, disponible: !current }).eq('id', id)
    router.refresh()
  }

  async function remove(id: string, nombre: string) {
    if (!confirm(`¿Eliminar "${nombre}"?`)) return
    const supabase = createClient()
    await supabase.from('productos').delete().eq('id', id)
    router.refresh()
  }

  function startEdit(p: ProductoFicha) {
    setForm({
      proveedor_id: p.proveedor_id, nombre: p.nombre, descripcion: p.descripcion ?? '',
      imagen_url: p.imagen_url ?? '', categoria: p.categoria ?? '',
      precio_orientativo: p.precio_orientativo?.toString() ?? '', unidad_venta: p.unidad_venta ?? '',
      ficha_tecnica_url: p.ficha_tecnica_url ?? '', producto_combinar: p.producto_combinar ?? '',
      tiene_cargo: p.tiene_cargo ?? false, tipo_servicio: p.tipo_servicio ?? 'ambos',
      disponible: p.disponible, publicado_catalogo: p.publicado_catalogo ?? false, orden: p.orden,
    })
    setEditing(p.id); setShowForm(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const filtered = productos.filter(p => {
    if (filtro === 'publicados') return p.publicado_catalogo
    if (filtro === 'borrador') return !p.publicado_catalogo
    return true
  })

  const tagServicio = (t: string) => t === 'desayuno' ? { bg: '#FEF9C3', color: '#854D0E' } : t === 'tardeo' ? { bg: '#EDE9FE', color: '#5B21B6' } : { bg: 'var(--crema2)', color: 'var(--gris)' }

  return (
    <div>
      {/* Botón nuevo / formulario */}
      <div style={{ marginBottom: '1.5rem' }}>
        <button onClick={() => { setShowForm(!showForm); setEditing(null); setForm(emptyForm) }}
          style={{ background: showForm ? 'var(--crema2)' : 'var(--negro)', color: showForm ? 'var(--gris)' : 'var(--crema)', border: '1px solid var(--crema3)', padding: '0.65rem 1.4rem', fontSize: '0.7rem', letterSpacing: '0.2em', textTransform: 'uppercase', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' }}>
          {showForm ? '✕ Cancelar' : '+ Nueva ficha'}
        </button>
      </div>

      {showForm && (
        <div style={{ background: 'var(--blanco)', border: '2px solid var(--negro)', padding: '1.75rem', marginBottom: '2rem' }}>
          <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.4rem', fontWeight: 300, color: 'var(--negro)', marginBottom: '1.5rem' }}>
            {editing ? 'Editar ficha' : 'Nueva ficha de producto'}
          </h2>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            {/* Proveedor */}
            <div style={{ gridColumn: '1/-1' }}>
              <label style={S.label}>Proveedor / Marca *</label>
              <select value={form.proveedor_id} onChange={f('proveedor_id')} style={{ ...S.input, cursor: 'pointer' }}>
                <option value="">Seleccionar marca...</option>
                {proveedores.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
              </select>
            </div>

            {/* Nombre */}
            <div style={{ gridColumn: '1/-1' }}>
              <label style={S.label}>Nombre del producto *</label>
              <input value={form.nombre} onChange={f('nombre')} style={S.input} placeholder="Nombre del producto" />
            </div>

            {/* Descripción */}
            <div style={{ gridColumn: '1/-1' }}>
              <label style={S.label}>Descripción</label>
              <textarea value={form.descripcion} onChange={f('descripcion') as any} rows={2} style={{ ...S.input, resize: 'none' }} placeholder="Descripción breve" />
            </div>

            {/* Ficha técnica */}
            <div style={{ gridColumn: '1/-1' }}>
              <label style={S.label}>Ficha técnica (URL o texto)</label>
              <input value={form.ficha_tecnica_url} onChange={f('ficha_tecnica_url')} style={S.input} placeholder="https://... o descripción técnica" />
            </div>

            {/* Producto a combinar */}
            <div style={{ gridColumn: '1/-1' }}>
              <label style={S.label}>Producto a combinar</label>
              <input value={form.producto_combinar} onChange={f('producto_combinar')} style={S.input} placeholder="Ej: Maridaje con pan de centeno" />
            </div>

            {/* Categoría */}
            <div>
              <label style={S.label}>Categoría</label>
              <input value={form.categoria} onChange={f('categoria')} style={S.input} placeholder="Bebida, Alimento..." />
            </div>

            {/* Precio */}
            <div>
              <label style={S.label}>Precio orientativo (€)</label>
              <input type="number" value={form.precio_orientativo} onChange={f('precio_orientativo')} style={S.input} placeholder="0.00" />
            </div>

            {/* Unidad */}
            <div>
              <label style={S.label}>Unidad de venta</label>
              <input value={form.unidad_venta} onChange={f('unidad_venta')} style={S.input} placeholder="Botella, Caja 6u..." />
            </div>

            {/* Imagen */}
            <div>
              <label style={S.label}>URL imagen</label>
              <input value={form.imagen_url} onChange={f('imagen_url')} style={S.input} placeholder="https://..." />
            </div>

            {/* Tipo servicio */}
            <div style={{ gridColumn: '1/-1' }}>
              <label style={S.label}>¿Para qué servicio?</label>
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.3rem' }}>
                {(['desayuno', 'tardeo', 'ambos'] as const).map(t => (
                  <button key={t} onClick={() => setForm(p => ({ ...p, tipo_servicio: t }))}
                    style={{ padding: '0.5rem 1.2rem', border: `2px solid ${form.tipo_servicio === t ? 'var(--negro)' : 'var(--crema3)'}`, background: form.tipo_servicio === t ? 'var(--negro)' : 'var(--blanco)', color: form.tipo_servicio === t ? 'var(--crema)' : 'var(--gris)', cursor: 'pointer', fontSize: '0.72rem', letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: 'DM Sans, sans-serif', transition: 'all 0.2s' }}>
                    {t === 'desayuno' ? '🌅 Desayuno' : t === 'tardeo' ? '🌇 Tardeo' : '⭐ Ambos'}
                  </button>
                ))}
              </div>
            </div>

            {/* Checkboxes */}
            <div style={{ gridColumn: '1/-1', display: 'flex', gap: '0.75rem', flexWrap: 'wrap', paddingTop: '0.5rem', borderTop: '1px solid var(--crema3)' }}>
              <Toggle on={form.tiene_cargo} label="Tiene cargo" onToggle={() => setForm(p => ({ ...p, tiene_cargo: !p.tiene_cargo }))} />
              <Toggle on={form.disponible} label="Disponible" onToggle={() => setForm(p => ({ ...p, disponible: !p.disponible }))} />
              <Toggle on={form.publicado_catalogo} label="✓ Publicar al catálogo" onToggle={() => setForm(p => ({ ...p, publicado_catalogo: !p.publicado_catalogo, disponible: !p.publicado_catalogo ? true : p.disponible }))} color="#16a34a" />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
            <button onClick={save} disabled={loading || !form.nombre || !form.proveedor_id}
              style={{ background: 'var(--negro)', color: 'var(--crema)', border: 'none', padding: '0.85rem 2rem', fontSize: '0.72rem', letterSpacing: '0.2em', textTransform: 'uppercase', fontWeight: 500, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', opacity: loading || !form.nombre || !form.proveedor_id ? 0.5 : 1 }}>
              {loading ? 'Guardando...' : editing ? 'Actualizar ficha' : 'Crear ficha'}
            </button>
            {form.publicado_catalogo && (
              <span style={{ fontSize: '0.72rem', color: '#16a34a', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                ✓ Se publicará en el catálogo al guardar
              </span>
            )}
          </div>
        </div>
      )}

      {/* Filtros + lista */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
        {([['todos', `Todas (${productos.length})`], ['publicados', `En catálogo (${productos.filter(p => p.publicado_catalogo).length})`], ['borrador', `Borrador (${productos.filter(p => !p.publicado_catalogo).length})`]] as const).map(([key, label]) => (
          <button key={key} onClick={() => setFiltro(key)}
            style={{ padding: '0.4rem 1rem', fontSize: '0.7rem', letterSpacing: '0.12em', textTransform: 'uppercase', border: '1px solid var(--crema3)', cursor: 'pointer', background: filtro === key ? 'var(--negro)' : 'var(--blanco)', color: filtro === key ? 'var(--crema)' : 'var(--gris)', fontFamily: 'DM Sans, sans-serif' }}>
            {label}
          </button>
        ))}
      </div>

      {/* Tabla fichas */}
      <div style={{ background: 'var(--blanco)', border: '1px solid var(--crema3)', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', minWidth: 900, borderCollapse: 'collapse', fontSize: '0.8rem' }}>
            <thead>
              <tr style={{ background: 'var(--crema2)', borderBottom: '1px solid var(--crema3)' }}>
                {['Producto', 'Marca', 'Categoría', 'Servicio', 'Cargo', 'Catálogo', 'Acciones'].map(h => (
                  <th key={h} style={{ textAlign: 'left', padding: '0.65rem 0.9rem', fontSize: '0.58rem', letterSpacing: '0.25em', textTransform: 'uppercase', color: 'var(--gris)', fontWeight: 500, whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((p, i) => {
                const ts = tagServicio(p.tipo_servicio ?? 'ambos')
                return (
                  <tr key={p.id} style={{ borderBottom: '1px solid var(--crema3)', background: i % 2 === 0 ? 'var(--blanco)' : 'var(--crema)' }}>
                    <td style={{ padding: '0.65rem 0.9rem' }}>
                      <p style={{ fontWeight: 500, color: 'var(--negro)', marginBottom: '0.1rem' }}>{p.nombre}</p>
                      {p.producto_combinar && <p style={{ fontSize: '0.68rem', color: 'var(--gris)' }}>+ {p.producto_combinar}</p>}
                    </td>
                    <td style={{ padding: '0.65rem 0.9rem', color: 'var(--gris)', fontSize: '0.75rem', whiteSpace: 'nowrap' }}>
                      {(p as any).proveedor?.nombre ?? '—'}
                    </td>
                    <td style={{ padding: '0.65rem 0.9rem', color: 'var(--gris)', fontSize: '0.75rem' }}>{p.categoria ?? '—'}</td>
                    <td style={{ padding: '0.65rem 0.9rem' }}>
                      <span style={{ background: ts.bg, color: ts.color, padding: '0.15rem 0.5rem', fontSize: '0.65rem', whiteSpace: 'nowrap' }}>
                        {p.tipo_servicio === 'desayuno' ? 'Desayuno' : p.tipo_servicio === 'tardeo' ? 'Tardeo' : 'Ambos'}
                      </span>
                    </td>
                    <td style={{ padding: '0.65rem 0.9rem', textAlign: 'center' }}>
                      <span style={{ fontSize: '0.72rem', color: p.tiene_cargo ? 'var(--negro)' : 'var(--gris-l)' }}>
                        {p.tiene_cargo ? '✓ Con cargo' : 'Sin cargo'}
                      </span>
                    </td>
                    {/* Toggle publicar */}
                    <td style={{ padding: '0.65rem 0.9rem' }}>
                      <button onClick={() => toggleCatalogo(p.id, p.publicado_catalogo ?? false)}
                        title={p.publicado_catalogo ? 'Quitar del catálogo' : 'Publicar en catálogo'}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', padding: '0.3rem 0.7rem', border: `1px solid ${p.publicado_catalogo ? '#16a34a' : 'var(--crema3)'}`, background: p.publicado_catalogo ? '#dcfce7' : 'var(--crema)', cursor: 'pointer', fontSize: '0.65rem', color: p.publicado_catalogo ? '#16a34a' : 'var(--gris)', fontFamily: 'DM Sans, sans-serif', transition: 'all 0.2s' }}>
                        {p.publicado_catalogo ? '✓ Publicado' : '○ Borrador'}
                      </button>
                    </td>
                    <td style={{ padding: '0.65rem 0.9rem', whiteSpace: 'nowrap' }}>
                      <div style={{ display: 'flex', gap: '0.4rem' }}>
                        <button onClick={() => startEdit(p)} style={{ fontSize: '0.65rem', color: '#2563eb', background: 'none', border: '1px solid #bfdbfe', padding: '0.2rem 0.6rem', cursor: 'pointer' }}>Editar</button>
                        <button onClick={() => remove(p.id, p.nombre)} style={{ fontSize: '0.65rem', color: '#dc2626', background: 'none', border: '1px solid #fca5a5', padding: '0.2rem 0.6rem', cursor: 'pointer' }}>Eliminar</button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--gris-l)' }}>
              <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.4rem', fontWeight: 300 }}>Sin fichas todavía</p>
              <p style={{ fontSize: '0.78rem', marginTop: '0.5rem' }}>Pulsa "+ Nueva ficha" para empezar</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
