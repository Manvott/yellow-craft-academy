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

interface Comb { id?: string | null; nombre: string; peso: string; unidad: string; orden: number }

function emptyComb(orden = 0): Comb { return { nombre: '', peso: '', unidad: 'g', orden } }

export default function MenuClient({ productos }: { productos: ProductoEscandallo[] }) {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [filtro, setFiltro] = useState<'todos' | 'con' | 'sin'>('todos')
  const [activo, setActivo] = useState<string | null>(null)
  const [combs, setCombs] = useState<Comb[]>([])
  const [saving, setSaving] = useState(false)

  const filtered = productos.filter(p => {
    const matchSearch = p.nombre.toLowerCase().includes(search.toLowerCase()) ||
      (p as any).proveedor?.nombre?.toLowerCase().includes(search.toLowerCase())
    const tieneCombs = (p.combinaciones?.filter(c => c.nombre).length ?? 0) > 0
    const matchFiltro = filtro === 'todos' ? true : filtro === 'con' ? tieneCombs : !tieneCombs
    return matchSearch && matchFiltro
  })

  function abrirProducto(p: ProductoEscandallo) {
    if (activo === p.id) { setActivo(null); return }
    setActivo(p.id)
    const existentes = (p.combinaciones ?? [])
      .sort((a, b) => a.orden - b.orden)
      .map(c => ({ id: c.id ?? undefined, nombre: c.nombre, peso: c.peso?.toString() ?? '', unidad: c.unidad, orden: c.orden }))
    // Siempre al menos 5 filas
    while (existentes.length < 5) existentes.push(emptyComb(existentes.length) as Comb)
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

  return (
    <div>
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

      {/* Filtros */}
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Buscar producto o marca..."
          style={{ flex: '1 1 200px', ...S.input }}
        />
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
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.65rem', color: isActivo ? 'rgba(247,243,238,0.5)' : 'var(--gris)' }}>
                      {(p as any).proveedor?.nombre ?? '—'}
                    </span>
                    {p.categoria && (
                      <span style={{ fontSize: '0.58rem', color: isActivo ? 'rgba(247,243,238,0.4)' : 'var(--gris-l)' }}>· {p.categoria}</span>
                    )}
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

                  {/* Cabeceras */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 90px 80px 28px', gap: '0.4rem', marginBottom: '0.35rem' }}>
                    {['Ingrediente / Producto', 'Cantidad', 'Unidad', ''].map((h, i) => (
                      <span key={i} style={{ ...S.label }}>{h}</span>
                    ))}
                  </div>

                  {/* Filas */}
                  {combs.map((c, idx) => (
                    <div key={idx} style={{ display: 'grid', gridTemplateColumns: '1fr 90px 80px 28px', gap: '0.4rem', marginBottom: '0.35rem' }}>
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
