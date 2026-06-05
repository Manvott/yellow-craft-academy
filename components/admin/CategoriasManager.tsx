'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import type { Categoria } from '@/app/[locale]/admin/(panel)/categorias/page'

interface Props { categorias: Categoria[] }

export default function CategoriasManager({ categorias }: Props) {
  const router = useRouter()
  const [nueva, setNueva] = useState('')
  const [editId, setEditId] = useState<string | null>(null)
  const [editNombre, setEditNombre] = useState('')
  const [loading, setLoading] = useState<string | null>(null)
  const [error, setError] = useState('')

  const S = {
    input: { background: 'var(--crema)', border: '1px solid var(--crema3)', color: 'var(--grafito)', padding: '0.7rem 0.9rem', fontFamily: 'DM Sans, sans-serif', fontSize: '0.82rem', outline: 'none' } as React.CSSProperties,
    btn: (variant: 'primary' | 'ghost' | 'danger' = 'primary'): React.CSSProperties => ({
      background: variant === 'primary' ? 'var(--negro)' : variant === 'danger' ? 'none' : 'none',
      color: variant === 'primary' ? 'var(--crema)' : variant === 'danger' ? '#dc2626' : 'var(--gris)',
      border: variant === 'primary' ? 'none' : variant === 'danger' ? '1px solid #fca5a5' : '1px solid var(--crema3)',
      padding: '0.6rem 1.1rem', fontSize: '0.68rem', letterSpacing: '0.15em',
      textTransform: 'uppercase' as const, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif',
    }),
  }

  async function crear() {
    const nombre = nueva.trim().toUpperCase()
    if (!nombre) return
    setLoading('nueva'); setError('')
    const supabase = createClient()
    const maxOrden = categorias.length ? Math.max(...categorias.map(c => c.orden)) + 1 : 1
    const { error: e } = await supabase.from('categorias').insert({ nombre, orden: maxOrden })
    if (e) { setError(e.message.includes('unique') ? 'Esa categoría ya existe.' : e.message) }
    else { setNueva('') }
    setLoading(null); router.refresh()
  }

  async function guardarEdit() {
    if (!editId || !editNombre.trim()) return
    setLoading(editId); setError('')
    const supabase = createClient()
    const { error: e } = await supabase.from('categorias').update({ nombre: editNombre.trim().toUpperCase() }).eq('id', editId)
    if (e) { setError(e.message) }
    else { setEditId(null); setEditNombre('') }
    setLoading(null); router.refresh()
  }

  async function toggleActiva(cat: Categoria) {
    setLoading(cat.id)
    const supabase = createClient()
    await supabase.from('categorias').update({ activa: !cat.activa }).eq('id', cat.id)
    setLoading(null); router.refresh()
  }

  async function eliminar(cat: Categoria) {
    if (!confirm(`¿Eliminar la categoría "${cat.nombre}"?`)) return
    setLoading(cat.id)
    const supabase = createClient()
    await supabase.from('categorias').delete().eq('id', cat.id)
    setLoading(null); router.refresh()
  }

  const activas = categorias.filter(c => c.activa)
  const inactivas = categorias.filter(c => !c.activa)

  return (
    <div style={{ maxWidth: 600 }}>
      {/* Crear nueva */}
      <div style={{ background: 'var(--blanco)', border: '2px solid var(--negro)', padding: '1.25rem', marginBottom: '2rem' }}>
        <p style={{ fontSize: '0.65rem', letterSpacing: '0.3em', textTransform: 'uppercase', color: 'var(--gris)', marginBottom: '0.75rem', fontFamily: 'DM Sans, sans-serif' }}>
          Nueva categoría
        </p>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <input
            value={nueva}
            onChange={e => setNueva(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && crear()}
            placeholder="Nombre de la categoría..."
            style={{ ...S.input, flex: 1 }}
          />
          <button onClick={crear} disabled={loading === 'nueva' || !nueva.trim()} style={{ ...S.btn(), opacity: loading === 'nueva' || !nueva.trim() ? 0.5 : 1 }}>
            {loading === 'nueva' ? '...' : '+ Añadir'}
          </button>
        </div>
        {error && <p style={{ fontSize: '0.72rem', color: '#dc2626', marginTop: '0.5rem' }}>{error}</p>}
        <p style={{ fontSize: '0.62rem', color: 'var(--gris-l)', marginTop: '0.4rem' }}>Se guardará en mayúsculas. Pulsa Enter o el botón.</p>
      </div>

      {/* Lista activas */}
      <p style={{ fontSize: '0.6rem', letterSpacing: '0.3em', textTransform: 'uppercase', color: 'var(--gris)', marginBottom: '0.75rem', fontFamily: 'DM Sans, sans-serif' }}>
        Categorías activas ({activas.length})
      </p>
      <div style={{ background: 'var(--blanco)', border: '1px solid var(--crema3)', marginBottom: '2rem' }}>
        {activas.length === 0 && <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--gris-l)', fontSize: '0.82rem' }}>Sin categorías activas</div>}
        {activas.map((cat, i) => (
          <div key={cat.id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.65rem 1rem', borderBottom: i < activas.length - 1 ? '1px solid var(--crema3)' : 'none', background: i % 2 === 0 ? 'var(--blanco)' : 'var(--crema)' }}>
            {editId === cat.id ? (
              <>
                <input value={editNombre} onChange={e => setEditNombre(e.target.value)} onKeyDown={e => e.key === 'Enter' && guardarEdit()}
                  style={{ ...S.input, flex: 1, padding: '0.45rem 0.75rem', fontSize: '0.8rem' }} autoFocus />
                <button onClick={guardarEdit} disabled={loading === cat.id} style={S.btn()}>Guardar</button>
                <button onClick={() => { setEditId(null); setEditNombre('') }} style={S.btn('ghost')}>✕</button>
              </>
            ) : (
              <>
                <span style={{ flex: 1, fontWeight: 500, fontSize: '0.82rem', color: 'var(--negro)', fontFamily: 'DM Sans, sans-serif', letterSpacing: '0.05em' }}>{cat.nombre}</span>
                <button onClick={() => { setEditId(cat.id); setEditNombre(cat.nombre) }} style={S.btn('ghost')}>Editar</button>
                <button onClick={() => toggleActiva(cat)} disabled={loading === cat.id} style={S.btn('ghost')} title="Desactivar">
                  Desactivar
                </button>
                <button onClick={() => eliminar(cat)} disabled={loading === cat.id} style={S.btn('danger')} title="Eliminar">✕</button>
              </>
            )}
          </div>
        ))}
      </div>

      {/* Lista inactivas */}
      {inactivas.length > 0 && (
        <>
          <p style={{ fontSize: '0.6rem', letterSpacing: '0.3em', textTransform: 'uppercase', color: 'var(--gris-l)', marginBottom: '0.75rem', fontFamily: 'DM Sans, sans-serif' }}>
            Categorías inactivas ({inactivas.length}) — no aparecen en el catálogo
          </p>
          <div style={{ background: 'var(--blanco)', border: '1px solid var(--crema3)', opacity: 0.7 }}>
            {inactivas.map((cat, i) => (
              <div key={cat.id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.55rem 1rem', borderBottom: i < inactivas.length - 1 ? '1px solid var(--crema3)' : 'none' }}>
                <span style={{ flex: 1, fontSize: '0.78rem', color: 'var(--gris)', textDecoration: 'line-through' }}>{cat.nombre}</span>
                <button onClick={() => toggleActiva(cat)} disabled={loading === cat.id} style={S.btn('ghost')}>Activar</button>
                <button onClick={() => eliminar(cat)} disabled={loading === cat.id} style={S.btn('danger')}>✕</button>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
