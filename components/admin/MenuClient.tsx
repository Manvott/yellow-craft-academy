'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import type { ProductoEscandallo } from '@/app/[locale]/admin/(panel)/menu/page'

const UNIDADES = ['g', 'kg', 'ml', 'l', 'cl', 'oz', 'ud', 'ración']

const S = {
  input: { background: 'var(--blanco)', border: '1px solid var(--crema3)', color: 'var(--grafito)', padding: '0.55rem 0.75rem', fontFamily: 'DM Sans, sans-serif', fontSize: '0.8rem', outline: 'none' } as React.CSSProperties,
  label: { fontSize: '0.58rem', letterSpacing: '0.2em', textTransform: 'uppercase' as const, color: 'var(--gris)', fontFamily: 'DM Sans, sans-serif' },
}

interface Comb { id?: string; nombre: string; peso: string; unidad: string; orden: number }

function emptyComb(orden = 0): Comb { return { nombre: '', peso: '', unidad: 'g', orden } }

const SERVICIOS = [
  { key: 'brunch', label: 'Brunch', color: '#d97706', bg: '#fef3c7', border: '#fcd34d' },
  { key: 'tardeo', label: 'Tardeo', color: '#7c3aed', bg: '#ede9fe', border: '#c4b5fd' },
] as const

type Servicio = typeof SERVICIOS[number]['key']

export default function MenuClient({ productos }: { productos: ProductoEscandallo[] }) {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [seccion, setSeccion] = useState<'todos' | Servicio>('todos')
  const [filtro, setFiltro] = useState<'todos' | 'con' | 'sin'>('todos')
  const [categoria, setCategoria] = useState<string>('todas')
  const [activo, setActivo] = useState<string | null>(null)
  const [combs, setCombs] = useState<Comb[]>([])
  const [editServicio, setEditServicio] = useState<string>('')
  const [saving, setSaving] = useState(false)

  const categorias = ['todas', ...Array.from(new Set(productos.map(p => p.categoria).filter(Boolean) as string[])).sort()]

  const filtered = productos.filter(p => {
    const matchSearch = p.nombre.toLowerCase().includes(search.toLowerCase()) ||
      (p as any).proveedor?.nombre?.toLowerCase().includes(search.toLowerCase())
    const tieneCombs = (p.combinaciones?.filter(c => c.nombre).length ?? 0) > 0
    const matchFiltro = filtro === 'todos' ? true : filtro === 'con' ? tieneCombs : !tieneCombs
    const matchSeccion = seccion === 'todos' ? true : p.tipo_servicio === seccion
    const matchCategoria = categoria === 'todas' ? true : p.categoria === categoria
    return matchSearch && matchFiltro && matchSeccion && matchCategoria
  })

  function abrirProducto(p: ProductoEscandallo) {
    if (activo === p.id) { setActivo(null); return }
    setActivo(p.id)
    setEditServicio(p.tipo_servicio ?? '')
    const existentes = (p.combinaciones ?? [])
      .sort((a, b) => a.orden - b.orden)
      .map(c => ({ id: c.id ?? undefined, nombre: c.nombre, peso: c.peso?.toString() ?? '', unidad: c.unidad, orden: c.orden }))
    while (existentes.length < 5) existentes.push({ id: undefined, ...emptyComb(existentes.length) })
    setCombs(existentes)
  }

  function updateComb(idx: number, field: keyof Comb, val: string) {
    setCombs(prev => prev.map((c, i) => i === idx ? { ...c, [field]: val } : c))
  }

  function addFila() { setCombs(prev => [...prev, emptyComb(prev.length)]) }

  function removeFila(idx: number) {
    if (combs.length <= 1) return
    setCombs(prev => prev.filter((_, i) => i !== idx))
  }

  async function guardar() {
    if (!activo) return
    setSaving(true)
    const supabase = createClient()

    // Actualizar tipo_servicio del producto
    await supabase.from('productos').update({ tipo_servicio: editServicio || null }).eq('id', activo)

    // Borrar todas las combinaciones existentes del producto
    await supabase.from('producto_combinaciones').delete().eq('producto_id', activo)

    // Insertar las no vacías
    const validas = combs
      .filter(c => c.nombre.trim())
      .map((c, i) => ({
        producto_id: activo,
        nombre: c.nombre.trim(),
        peso: c.peso ? parseFloat(c.peso) : null,
        unidad: c.unidad,
        orden: i,
      }))

    if (validas.length > 0) {
      await supabase.from('producto_combinaciones').insert(validas)
    }

    setSaving(false)
    router.refresh()
    setActivo(null)
  }

  const conMenú = productos.filter(p => (p.combinaciones?.filter(c => c.nombre).length ?? 0) > 0).length
  const porServicio = (s: Servicio) => productos.filter(p => p.tipo_servicio === s).length

  return (
    <div>
      {/* Tabs de sección — Brunch / Tardeo */}
      <div style={{ display: 'flex', gap: '0', marginBottom: '1.5rem', borderBottom: '2px solid var(--crema3)' }}>
        {([
          { key: 'todos', label: `Todos (${productos.length})`, color: 'var(--negro)', bg: 'var(--negro)' },
          { key: 'brunch', label: `Brunch (${porServicio('brunch')})`, color: '#d97706', bg: '#d97706' },
          { key: 'tardeo', label: `Tardeo (${porServicio('tardeo')})`, color: '#7c3aed', bg: '#7c3aed' },
        ] as const).map(({ key, label, bg }) => (
          <button key={key} onClick={() => setSeccion(key)}
            style={{
              padding: '0.65rem 1.4rem', fontSize: '0.68rem', letterSpacing: '0.12em', textTransform: 'uppercase',
              fontFamily: 'DM Sans, sans-serif', border: 'none', cursor: 'pointer',
              background: seccion === key ? bg : 'transparent',
              color: seccion === key ? '#fff' : 'var(--gris)',
              borderBottom: seccion === key ? `2px solid ${bg}` : '2px solid transparent',
              marginBottom: '-2px', transition: 'all 0.15s',
            }}>
            {label}
          </button>
        ))}
      </div>

      {/* Stats */}
      <div style={{ display: 'flex', gap: '2rem', marginBottom: '1.5rem' }}>
        <span style={{ fontSize: '0.8rem', fontFamily: 'DM Sans, sans-serif' }}>
          <strong style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.8rem', fontWeight: 300 }}>{productos.length}</strong>
          <span style={{ color: 'var(--gris)', marginLeft: '0.4rem' }}>productos</span>
        </span>
        <span style={{ fontSize: '0.8rem', fontFamily: 'DM Sans, sans-serif' }}>
          <strong style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.8rem', fontWeight: 300, color: '#16a34a' }}>{conMenú}</strong>
          <span style={{ color: 'var(--gris)', marginLeft: '0.4rem' }}>con menú</span>
        </span>
        <span style={{ fontSize: '0.8rem', fontFamily: 'DM Sans, sans-serif' }}>
          <strong style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.8rem', fontWeight: 300, color: 'var(--gris-l)' }}>{productos.length - conMenú}</strong>
          <span style={{ color: 'var(--gris)', marginLeft: '0.4rem' }}>sin menú</span>
        </span>
      </div>

      {/* Filtros secundarios */}
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Buscar producto o marca..."
          style={{ flex: '1 1 200px', ...S.input }}
        />
        <select value={categoria} onChange={e => setCategoria(e.target.value)}
          style={{ ...S.input, cursor: 'pointer', minWidth: 160 }}>
          {categorias.map(c => (
            <option key={c} value={c}>{c === 'todas' ? 'Todas las categorías' : c}</option>
          ))}
        </select>
        {([['todos','Todos'], ['con','Con menú'], ['sin','Sin menú']] as const).map(([key, label]) => (
          <button key={key} onClick={() => setFiltro(key)}
            style={{ padding: '0.45rem 0.9rem', fontSize: '0.68rem', letterSpacing: '0.1em', textTransform: 'uppercase', border: '1px solid var(--crema3)', cursor: 'pointer', background: filtro === key ? 'var(--negro)' : 'var(--blanco)', color: filtro === key ? 'var(--crema)' : 'var(--gris)', fontFamily: 'DM Sans, sans-serif' }}>
            {label}
          </button>
        ))}
      </div>

      {/* Lista de productos */}
      <div style={{ background: 'var(--blanco)', border: '1px solid var(--crema3)' }}>
        {filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--gris-l)', fontSize: '0.82rem' }}>Sin resultados</div>
        )}
        {filtered.map((p, i) => {
          const combsValidas = p.combinaciones?.filter(c => c.nombre) ?? []
          const isActivo = activo === p.id

          return (
            <div key={p.id}>
              {/* Fila producto */}
              <div onClick={() => abrirProducto(p)}
                style={{
                  display: 'grid', gridTemplateColumns: '1fr auto auto',
                  gap: '1rem', alignItems: 'center',
                  padding: '0.85rem 1.1rem',
                  borderBottom: isActivo ? '2px solid var(--negro)' : '1px solid var(--crema3)',
                  background: isActivo ? 'var(--negro)' : i % 2 === 0 ? 'var(--blanco)' : 'var(--crema)',
                  cursor: 'pointer', transition: 'background 0.15s',
                }}>
                <div>
                  <p style={{ fontWeight: 500, fontSize: '0.85rem', color: isActivo ? 'var(--crema)' : 'var(--negro)', marginBottom: '0.1rem' }}>
                    {p.nombre}
                  </p>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '0.65rem', color: isActivo ? 'rgba(247,243,238,0.5)' : 'var(--gris)' }}>
                      {(p as any).proveedor?.nombre ?? '—'}
                    </span>
                    {p.categoria && (
                      <span style={{ fontSize: '0.58rem', color: isActivo ? 'rgba(247,243,238,0.4)' : 'var(--gris-l)' }}>· {p.categoria}</span>
                    )}
                    {p.tipo_servicio && (() => {
                      const s = SERVICIOS.find(x => x.key === p.tipo_servicio)
                      return s ? (
                        <span style={{ fontSize: '0.5rem', letterSpacing: '0.1em', textTransform: 'uppercase', background: isActivo ? 'rgba(255,255,255,0.15)' : s.bg, color: isActivo ? '#fff' : s.color, padding: '0.1rem 0.35rem', border: `1px solid ${isActivo ? 'rgba(255,255,255,0.2)' : s.border}`, fontFamily: 'DM Sans, sans-serif', fontWeight: 600 }}>{s.label}</span>
                      ) : null
                    })()}
                  </div>
                </div>

                {/* Indicador menú */}
                <div style={{ textAlign: 'right' }}>
                  {combsValidas.length > 0 ? (
                    <span style={{ fontSize: '0.62rem', background: isActivo ? 'var(--amarillo)' : '#dcfce7', color: isActivo ? 'var(--negro)' : '#166534', padding: '0.15rem 0.5rem', letterSpacing: '0.05em' }}>
                      {combsValidas.length} ingrediente{combsValidas.length !== 1 ? 's' : ''}
                    </span>
                  ) : (
                    <span style={{ fontSize: '0.62rem', color: isActivo ? 'rgba(247,243,238,0.35)' : 'var(--gris-l)', fontStyle: 'italic' }}>Sin menú</span>
                  )}
                </div>

                {/* Chevron */}
                <span style={{ color: isActivo ? 'var(--amarillo)' : 'var(--gris-l)', fontSize: '0.9rem', transform: isActivo ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s', display: 'inline-block' }}>›</span>
              </div>

              {/* Editor menú expandido */}
              {isActivo && (
                <div style={{ padding: '1.25rem 1.1rem', background: 'var(--crema)', borderBottom: '2px solid var(--negro)' }}>
                  <p style={{ ...S.label, marginBottom: '0.75rem', color: 'var(--negro)' }}>
                    Ingredientes / Productos a combinar — {p.nombre}
                  </p>

                  {/* Selector de servicio */}
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '1rem' }}>
                    <span style={{ ...S.label, flexShrink: 0 }}>Servicio</span>
                    {([{ key: '', label: 'Sin asignar' }, ...SERVICIOS] as const).map(s => {
                      const srv = SERVICIOS.find(x => x.key === s.key)
                      const active = editServicio === s.key
                      return (
                        <button key={s.key} type="button" onClick={() => setEditServicio(s.key)}
                          style={{ padding: '0.3rem 0.8rem', fontSize: '0.62rem', letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: 'DM Sans, sans-serif', cursor: 'pointer', border: `1px solid ${active ? (srv?.border ?? 'var(--negro)') : 'var(--crema3)'}`, background: active ? (srv?.bg ?? 'var(--negro)') : 'var(--blanco)', color: active ? (srv?.color ?? 'var(--crema)') : 'var(--gris)', fontWeight: active ? 600 : 400 }}>
                          {s.label}
                        </button>
                      )
                    })}
                  </div>

                  {/* Cabeceras */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr auto auto auto', gap: '0.4rem', marginBottom: '0.35rem' }}>
                    {['Ingrediente / Producto', 'Cantidad', 'Unidad', ''].map((h, i) => (
                      <span key={i} style={{ ...S.label }}>{h}</span>
                    ))}
                  </div>

                  {/* Filas */}
                  {combs.map((c, idx) => (
                    <div key={idx} style={{ display: 'grid', gridTemplateColumns: '1fr auto auto auto', gap: '0.4rem', marginBottom: '0.35rem' }}>
                      <input value={c.nombre} onChange={e => updateComb(idx, 'nombre', e.target.value)}
                        style={S.input} placeholder={`Ingrediente ${idx + 1}`} />
                      <input type="number" value={c.peso} onChange={e => updateComb(idx, 'peso', e.target.value)}
                        style={{ ...S.input, textAlign: 'right' }} placeholder="0" />
                      <select value={c.unidad} onChange={e => updateComb(idx, 'unidad', e.target.value)}
                        style={{ ...S.input, cursor: 'pointer' }}>
                        {UNIDADES.map(u => <option key={u} value={u}>{u}</option>)}
                      </select>
                      <button type="button" onClick={() => removeFila(idx)}
                        style={{ background: 'none', border: '1px solid #fca5a5', color: '#dc2626', cursor: 'pointer', fontSize: '1rem', lineHeight: 1 }}>×</button>
                    </div>
                  ))}

                  {/* Acciones */}
                  <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.75rem', alignItems: 'center' }}>
                    <button type="button" onClick={addFila}
                      style={{ fontSize: '0.65rem', letterSpacing: '0.15em', textTransform: 'uppercase', background: 'none', color: 'var(--gris)', border: '1px solid var(--crema3)', padding: '0.4rem 0.8rem', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' }}>
                      + Añadir fila
                    </button>
                    <button type="button" onClick={guardar} disabled={saving}
                      style={{ background: 'var(--negro)', color: 'var(--crema)', border: 'none', padding: '0.6rem 1.5rem', fontSize: '0.7rem', letterSpacing: '0.2em', textTransform: 'uppercase', cursor: saving ? 'wait' : 'pointer', fontFamily: 'DM Sans, sans-serif', opacity: saving ? 0.6 : 1 }}>
                      {saving ? 'Guardando...' : 'Guardar menú'}
                    </button>
                    <button type="button" onClick={() => setActivo(null)}
                      style={{ fontSize: '0.65rem', color: 'var(--gris)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' }}>
                      Cancelar
                    </button>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
