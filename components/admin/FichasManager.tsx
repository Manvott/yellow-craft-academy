'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import type { ProductoFicha, Combinacion } from '@/app/[locale]/admin/(panel)/fichas/page'
import type { Proveedor } from '@/lib/types'

interface Props { productos: ProductoFicha[]; proveedores: Proveedor[]; verCostes?: boolean }

const UNIDADES = ['g', 'kg', 'ml', 'l', 'cl', 'oz', 'ud', 'ración']

const emptyForm = {
  proveedor_id: '', nombre: '', descripcion: '', imagen_url: '',
  categoria: '', precio_base: '', tiene_cargo: false,
  igic_pct: '', coste_aduana: '', coste_logistica: '',
  tipo_servicio: 'ambos' as 'desayuno' | 'tardeo' | 'ambos',
  disponible: true, publicado_catalogo: false, en_exposicion: false, orden: 0,
}

const emptyComb = (): Combinacion => ({ nombre: '', peso: '', unidad: 'g', orden: 0 })

const S = {
  input: { width: '100%', background: 'var(--crema)', border: '1px solid var(--crema3)', color: 'var(--grafito)', padding: '0.7rem 0.9rem', fontFamily: 'DM Sans, sans-serif', fontSize: '0.82rem', outline: 'none' } as React.CSSProperties,
  label: { fontSize: '0.6rem', letterSpacing: '0.25em', textTransform: 'uppercase' as const, color: 'var(--gris)', display: 'block', marginBottom: '0.3rem', fontFamily: 'DM Sans, sans-serif' },
  section: { background: 'var(--crema)', padding: '1rem 1.25rem', marginBottom: '1rem', borderLeft: '3px solid var(--negro)' } as React.CSSProperties,
}

function Toggle({ on, label, onToggle, color = 'var(--negro)' }: { on: boolean; label: string; onToggle: () => void; color?: string }) {
  return (
    <button type="button" onClick={onToggle} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.45rem 0.9rem', border: `1px solid ${on ? color : 'var(--crema3)'}`, background: on ? color : 'var(--crema)', cursor: 'pointer', fontSize: '0.7rem', color: on ? 'var(--crema)' : 'var(--gris)', fontFamily: 'DM Sans, sans-serif', transition: 'all 0.2s' }}>
      <span style={{ width: 8, height: 8, borderRadius: '50%', background: on ? 'var(--amarillo)' : 'var(--gris-l)', display: 'inline-block', flexShrink: 0 }} />
      {label}
    </button>
  )
}

export default function FichasManager({ productos, proveedores, verCostes = true }: Props) {
  const router = useRouter()
  const [form, setForm] = useState<typeof emptyForm>(emptyForm)
  const [combinaciones, setCombinaciones] = useState<Combinacion[]>([emptyComb(), emptyComb(), emptyComb(), emptyComb(), emptyComb()])
  const [pdfFile, setPdfFile] = useState<File | null>(null)
  const [pdfActual, setPdfActual] = useState<string>('')
  const [imgFile, setImgFile] = useState<File | null>(null)
  const [editing, setEditing] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState('')
  const [filtro, setFiltro] = useState<'todos' | 'publicados' | 'borrador'>('todos')
  const [showForm, setShowForm] = useState(false)
  const pdfInputRef = { current: null as HTMLInputElement | null }
  const imgInputRef = { current: null as HTMLInputElement | null }

  const f = (key: keyof typeof emptyForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(prev => ({ ...prev, [key]: e.target.value }))

  function updateComb(idx: number, field: keyof Combinacion, val: string) {
    setCombinaciones(prev => prev.map((c, i) => i === idx ? { ...c, [field]: val } : c))
  }

  function addComb() {
    setCombinaciones(prev => [...prev, emptyComb()])
  }

  function removeComb(idx: number) {
    if (combinaciones.length <= 1) return
    setCombinaciones(prev => prev.filter((_, i) => i !== idx))
  }

  // Calcular coste total
  const precioBase   = parseFloat(form.precio_base) || 0
  const igic         = precioBase * ((parseFloat(form.igic_pct) || 0) / 100)
  const aduana       = parseFloat(form.coste_aduana) || 0
  const logistica    = parseFloat(form.coste_logistica) || 0
  const costeTotal   = precioBase + igic + aduana + logistica

  async function save() {
    if (!form.nombre || !form.proveedor_id) return
    setLoading(true)
    setUploadProgress('')
    const supabase = createClient()

    // Subir imagen via API route (evita CORS del browser)
    let imagenUrl = form.imagen_url
    if (imgFile) {
      setUploadProgress('Subiendo imagen...')
      try {
        const ext = imgFile.name.split('.').pop() ?? 'jpg'
        const imgPath = `${Date.now()}-img.${ext}`
        const fd = new FormData()
        fd.append('file', imgFile)
        fd.append('bucket', 'product-images')
        fd.append('path', imgPath)
        const res = await fetch('/api/upload', { method: 'POST', body: fd })
        const data = await res.json()
        if (!res.ok) { setUploadProgress(`Error: ${data.error}`); setLoading(false); return }
        imagenUrl = data.url
      } catch {
        setUploadProgress('Error de red al subir imagen.'); setLoading(false); return
      }
      setUploadProgress('')
    }

    // Subir PDF via API route (evita CORS del browser)
    let fichaUrl = pdfActual
    if (pdfFile) {
      setUploadProgress('Subiendo PDF...')
      try {
        const ext = pdfFile.name.split('.').pop() ?? 'pdf'
        const path = `${Date.now()}-ficha.${ext}`
        const fd = new FormData()
        fd.append('file', pdfFile)
        fd.append('bucket', 'fichas-tecnicas')
        fd.append('path', path)
        const res = await fetch('/api/upload', { method: 'POST', body: fd })
        const data = await res.json()
        if (!res.ok) { setUploadProgress(`Error: ${data.error}`); setLoading(false); return }
        fichaUrl = data.url
      } catch {
        setUploadProgress('Error de red al subir PDF.'); setLoading(false); return
      }
      setUploadProgress('')
    }

    const data = {
      proveedor_id: form.proveedor_id,
      nombre: form.nombre,
      descripcion: form.descripcion || null,
      imagen_url: imagenUrl || null,
      categoria: form.categoria || null,
      ficha_tecnica_url: fichaUrl || null,
      en_exposicion: form.en_exposicion,
      precio_base: form.tiene_cargo && form.precio_base ? parseFloat(form.precio_base) : null,
      tiene_cargo: form.tiene_cargo,
      igic_pct: form.tiene_cargo && form.igic_pct ? parseFloat(form.igic_pct) : 0,
      coste_aduana: form.tiene_cargo && form.coste_aduana ? parseFloat(form.coste_aduana) : 0,
      coste_logistica: form.tiene_cargo && form.coste_logistica ? parseFloat(form.coste_logistica) : 0,
      tipo_servicio: form.tipo_servicio,
      disponible: form.disponible,
      publicado_catalogo: form.publicado_catalogo,
      orden: Number(form.orden),
    }

    let productoId = editing
    if (editing) {
      await supabase.from('productos').update(data).eq('id', editing)
      await supabase.from('producto_combinaciones').delete().eq('producto_id', editing)
    } else {
      const { data: nuevo } = await supabase.from('productos').insert(data).select('id').single()
      productoId = nuevo?.id ?? null
    }

    // Guardar combinaciones no vacías
    const combsValidas = combinaciones
      .filter(c => c.nombre.trim())
      .map((c, i) => ({ producto_id: productoId, nombre: c.nombre, peso: c.peso ? parseFloat(c.peso) : null, unidad: c.unidad, orden: i }))
    if (combsValidas.length > 0 && productoId) {
      await supabase.from('producto_combinaciones').insert(combsValidas)
    }

    resetForm(); setImgFile(null); setLoading(false); router.refresh()
  }

  function resetForm() {
    setForm(emptyForm); setEditing(null); setShowForm(false)
    setCombinaciones([emptyComb(), emptyComb(), emptyComb(), emptyComb(), emptyComb()])
    setPdfFile(null); setPdfActual('')
  }

  function startEdit(p: ProductoFicha) {
    setForm({
      proveedor_id: p.proveedor_id, nombre: p.nombre, descripcion: p.descripcion ?? '',
      imagen_url: p.imagen_url ?? '', categoria: p.categoria ?? '',
      precio_base: p.precio_base?.toString() ?? '', tiene_cargo: p.tiene_cargo ?? false,
      igic_pct: p.igic_pct?.toString() ?? '', coste_aduana: p.coste_aduana?.toString() ?? '',
      coste_logistica: p.coste_logistica?.toString() ?? '',
      tipo_servicio: p.tipo_servicio ?? 'ambos',
      disponible: p.disponible, publicado_catalogo: p.publicado_catalogo ?? false,
      en_exposicion: (p as any).en_exposicion ?? false, orden: p.orden,
    })
    const combs = (p.combinaciones ?? []).length > 0
      ? [...(p.combinaciones ?? []).map(c => ({ ...c, peso: c.peso?.toString() ?? '', orden: c.orden })),
         ...Array(Math.max(0, 5 - (p.combinaciones?.length ?? 0))).fill(null).map(emptyComb)]
      : [emptyComb(), emptyComb(), emptyComb(), emptyComb(), emptyComb()]
    setCombinaciones(combs)
    setPdfActual(p.ficha_tecnica_url ?? '')
    setEditing(p.id); setShowForm(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
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

  const filtered = productos.filter(p =>
    filtro === 'publicados' ? p.publicado_catalogo :
    filtro === 'borrador' ? !p.publicado_catalogo : true
  )

  return (
    <div>
      <div style={{ marginBottom: '1.5rem' }}>
        <button type="button" onClick={() => { setShowForm(!showForm); if (showForm) resetForm() }}
          style={{ background: showForm ? 'var(--crema2)' : 'var(--negro)', color: showForm ? 'var(--gris)' : 'var(--crema)', border: '1px solid var(--crema3)', padding: '0.65rem 1.4rem', fontSize: '0.7rem', letterSpacing: '0.2em', textTransform: 'uppercase', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' }}>
          {showForm ? '✕ Cancelar' : '+ Nueva ficha'}
        </button>
      </div>

      {showForm && (
        <div style={{ background: 'var(--blanco)', border: '2px solid var(--negro)', padding: '2rem', marginBottom: '2rem' }}>
          <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.5rem', fontWeight: 300, marginBottom: '1.75rem' }}>
            {editing ? 'Editar ficha' : 'Nueva ficha de producto'}
          </h2>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            {/* Marca */}
            <div style={{ gridColumn: '1/-1' }}>
              <label style={S.label}>Marca / Proveedor *</label>
              <select value={form.proveedor_id} onChange={f('proveedor_id')} style={{ ...S.input, cursor: 'pointer' }}>
                <option value="">Seleccionar...</option>
                {proveedores.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
              </select>
            </div>

            {/* Nombre + Categoría */}
            <div>
              <label style={S.label}>Nombre del producto *</label>
              <input value={form.nombre} onChange={f('nombre')} style={S.input} placeholder="Nombre" />
            </div>
            <div>
              <label style={S.label}>Categoría</label>
              <input value={form.categoria} onChange={f('categoria')} style={S.input} placeholder="Bebida, Alimento..." />
            </div>

            {/* Descripción */}
            <div style={{ gridColumn: '1/-1' }}>
              <label style={S.label}>Descripción</label>
              <textarea value={form.descripcion} onChange={f('descripcion') as any} rows={2} style={{ ...S.input, resize: 'none' }} />
            </div>

            {/* Imagen — URL o archivo */}
            <div>
              <label style={S.label}>Imagen del producto</label>
              {form.imagen_url && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem', padding: '0.4rem 0.75rem', background: 'var(--blanco)', border: '1px solid var(--crema3)', fontSize: '0.72rem' }}>
                  <span>🖼️</span>
                  <a href={form.imagen_url} target="_blank" rel="noopener noreferrer" style={{ color: '#2563eb', textDecoration: 'none', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    Ver imagen actual
                  </a>
                  <button type="button" onClick={() => setForm(p => ({ ...p, imagen_url: '' }))} style={{ fontSize: '0.65rem', color: '#dc2626', background: 'none', border: 'none', cursor: 'pointer' }}>Quitar</button>
                </div>
              )}
              <input
                type="file" accept="image/*" style={{ display: 'none' }}
                ref={el => { imgInputRef.current = el }}
                onChange={e => {
                  const file = e.target.files?.[0]
                  if (file) { setImgFile(file); setForm(p => ({ ...p, imagen_url: `[${file.name}]` })) }
                }}
              />
              <button type="button"
                onClick={() => imgInputRef.current?.click()}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'var(--negro)', color: 'var(--crema)', border: 'none', padding: '0.65rem 1.25rem', fontSize: '0.68rem', letterSpacing: '0.15em', textTransform: 'uppercase', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' }}>
                🖼️ {imgFile ? 'Cambiar imagen' : 'Añadir imagen'}
              </button>
              {imgFile && <p style={{ fontSize: '0.65rem', color: '#16a34a', marginTop: '0.25rem' }}>✓ {imgFile.name}</p>}
            </div>

            {/* Servicio */}
            <div>
              <label style={S.label}>Servicio</label>
              <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.3rem' }}>
                {(['desayuno', 'tardeo', 'ambos'] as const).map(t => (
                  <button key={t} type="button" onClick={() => setForm(p => ({ ...p, tipo_servicio: t }))}
                    style={{ padding: '0.45rem 0.9rem', border: `2px solid ${form.tipo_servicio === t ? 'var(--negro)' : 'var(--crema3)'}`, background: form.tipo_servicio === t ? 'var(--negro)' : 'var(--blanco)', color: form.tipo_servicio === t ? 'var(--crema)' : 'var(--gris)', cursor: 'pointer', fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: 'DM Sans, sans-serif' }}>
                    {t}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* ── FICHA TÉCNICA PDF ── */}
          <div style={{ ...S.section, marginTop: '1.5rem' }}>
            <p style={{ ...S.label, marginBottom: '0.75rem', color: 'var(--negro)' }}>Ficha técnica (PDF)</p>
            {pdfActual && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem', padding: '0.6rem 0.9rem', background: 'var(--blanco)', border: '1px solid var(--crema3)' }}>
                <span style={{ fontSize: '1.2rem' }}>📄</span>
                <a href={pdfActual} target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.78rem', color: '#2563eb', textDecoration: 'none', flex: 1 }}>
                  PDF actual — ver / descargar
                </a>
                <button type="button" onClick={() => setPdfActual('')} style={{ fontSize: '0.65rem', color: '#dc2626', background: 'none', border: 'none', cursor: 'pointer' }}>Quitar</button>
              </div>
            )}
            {/* Input oculto */}
            <input
              type="file" accept="application/pdf" style={{ display: 'none' }}
              ref={el => { pdfInputRef.current = el }}
              onChange={e => setPdfFile(e.target.files?.[0] ?? null)}
            />
            {pdfFile ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.65rem 1rem', background: '#dcfce7', border: '1px solid #86efac', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '1.1rem' }}>📄</span>
                <p style={{ fontSize: '0.78rem', color: '#166534', flex: 1 }}>{pdfFile.name}</p>
                <button type="button" onClick={() => setPdfFile(null)} style={{ fontSize: '0.65rem', color: '#dc2626', background: 'none', border: 'none', cursor: 'pointer' }}>Quitar</button>
              </div>
            ) : (
              <button type="button"
                onClick={() => pdfInputRef.current?.click()}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.6rem', background: 'var(--negro)', color: 'var(--crema)', border: 'none', padding: '0.7rem 1.4rem', fontSize: '0.7rem', letterSpacing: '0.18em', textTransform: 'uppercase', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="18" x2="12" y2="12"/><line x1="9" y1="15" x2="15" y2="15"/></svg>
                Añadir PDF
              </button>
            )}
            <p style={{ fontSize: '0.65rem', color: 'var(--gris)', marginTop: '0.35rem' }}>PDF, máx. 10 MB.</p>
            {uploadProgress && <p style={{ fontSize: '0.75rem', color: '#2563eb', marginTop: '0.3rem' }}>{uploadProgress}</p>}
          </div>

          {/* ── COSTES — solo visible si el usuario tiene permiso ── */}
          {verCostes && <div style={{ ...S.section }}>
            <p style={{ ...S.label, marginBottom: '0.75rem', color: 'var(--negro)' }}>Costes</p>
            <div style={{ marginBottom: '0.75rem' }}>
              <Toggle on={form.tiene_cargo} label="Producto con cargo económico" onToggle={() => setForm(p => ({ ...p, tiene_cargo: !p.tiene_cargo }))} />
            </div>

            {form.tiene_cargo && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '0.75rem', marginTop: '0.75rem' }}>
                <div>
                  <label style={S.label}>Precio base (€)</label>
                  <input type="number" value={form.precio_base} onChange={f('precio_base')} style={S.input} placeholder="0.00" step="0.01" />
                </div>
                <div>
                  <label style={S.label}>IGIC (%)</label>
                  <select value={form.igic_pct} onChange={f('igic_pct')} style={{ ...S.input, cursor: 'pointer' }}>
                    <option value="0">Sin IGIC (0%)</option>
                    <option value="3">3% — Tipo reducido</option>
                    <option value="7">7% — Tipo general</option>
                    <option value="9.5">9.5% — Tipo incrementado</option>
                    <option value="15">15% — Tipo especial</option>
                  </select>
                </div>
                <div>
                  <label style={S.label}>Coste aduana (€)</label>
                  <input type="number" value={form.coste_aduana} onChange={f('coste_aduana')} style={S.input} placeholder="0.00" step="0.01" />
                </div>
                <div>
                  <label style={S.label}>Coste logística (€)</label>
                  <input type="number" value={form.coste_logistica} onChange={f('coste_logistica')} style={S.input} placeholder="0.00" step="0.01" />
                </div>

                {/* Resumen coste */}
                {precioBase > 0 && (
                  <div style={{ gridColumn: '1/-1', background: 'var(--amarillo)', padding: '0.75rem 1rem', display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: '0.5rem' }}>
                    {[
                      ['Base', `${precioBase.toFixed(2)} €`],
                      ['IGIC', `${igic.toFixed(2)} €`],
                      ['Aduana', `${aduana.toFixed(2)} €`],
                      ['Logística', `${logistica.toFixed(2)} €`],
                      ['TOTAL', `${costeTotal.toFixed(2)} €`],
                    ].map(([label, val]) => (
                      <div key={label} style={{ textAlign: 'center' }}>
                        <p style={{ fontSize: '0.58rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--grafito)', fontFamily: 'DM Sans, sans-serif' }}>{label}</p>
                        <p style={{ fontSize: '1rem', fontFamily: 'Cormorant Garamond, serif', fontWeight: label === 'TOTAL' ? 600 : 300, color: 'var(--negro)' }}>{val}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>}

          {/* Toggles finales */}
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', padding: '1rem 0 0' }}>
            <Toggle on={form.disponible} label="Disponible" onToggle={() => setForm(p => ({ ...p, disponible: !p.disponible }))} />
            <Toggle on={form.en_exposicion} label="En exposición" color="#7C3AED"
              onToggle={() => setForm(p => ({ ...p, en_exposicion: !p.en_exposicion }))} />
            <Toggle on={form.publicado_catalogo} label="✓ Publicar al catálogo" color="#16a34a"
              onToggle={() => setForm(p => ({ ...p, publicado_catalogo: !p.publicado_catalogo, disponible: !p.publicado_catalogo ? true : p.disponible }))} />
          </div>

          <button type="button" onClick={save} disabled={loading || !form.nombre || !form.proveedor_id}
            style={{ marginTop: '1.5rem', background: 'var(--negro)', color: 'var(--crema)', border: 'none', padding: '0.9rem 2.25rem', fontSize: '0.72rem', letterSpacing: '0.2em', textTransform: 'uppercase', fontWeight: 500, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', opacity: loading || !form.nombre || !form.proveedor_id ? 0.5 : 1 }}>
            {loading ? 'Guardando...' : editing ? 'Actualizar ficha' : 'Crear ficha'}
          </button>
        </div>
      )}

      {/* Filtros */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
        {([['todos', `Todas (${productos.length})`], ['publicados', `En catálogo (${productos.filter(p=>p.publicado_catalogo).length})`], ['borrador', `Borrador (${productos.filter(p=>!p.publicado_catalogo).length})`]] as const).map(([key, label]) => (
          <button key={key} type="button" onClick={() => setFiltro(key)}
            style={{ padding: '0.4rem 1rem', fontSize: '0.7rem', letterSpacing: '0.12em', textTransform: 'uppercase', border: '1px solid var(--crema3)', cursor: 'pointer', background: filtro === key ? 'var(--negro)' : 'var(--blanco)', color: filtro === key ? 'var(--crema)' : 'var(--gris)', fontFamily: 'DM Sans, sans-serif' }}>
            {label}
          </button>
        ))}
      </div>

      {/* Tabla */}
      <div style={{ background: 'var(--blanco)', border: '1px solid var(--crema3)', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', minWidth: 800, borderCollapse: 'collapse', fontSize: '0.8rem' }}>
            <thead>
              <tr style={{ background: 'var(--crema2)', borderBottom: '1px solid var(--crema3)' }}>
                {['Producto', 'Marca', 'Servicio', 'PDF', ...(verCostes ? ['Cargo'] : []), 'Catálogo', 'Acciones'].map(h => (
                  <th key={h} style={{ textAlign: 'left', padding: '0.65rem 0.9rem', fontSize: '0.58rem', letterSpacing: '0.25em', textTransform: 'uppercase', color: 'var(--gris)', fontWeight: 500, whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((p, i) => (
                <tr key={p.id} style={{ borderBottom: '1px solid var(--crema3)', background: i % 2 === 0 ? 'var(--blanco)' : 'var(--crema)' }}>
                  <td style={{ padding: '0.65rem 0.9rem' }}>
                    <p style={{ fontWeight: 500, color: 'var(--negro)' }}>{p.nombre}</p>
                    {p.categoria && <p style={{ fontSize: '0.68rem', color: 'var(--gris)' }}>{p.categoria}</p>}
                    {(p.combinaciones?.filter(c => c.nombre).length ?? 0) > 0 && (
                      <p style={{ fontSize: '0.65rem', color: 'var(--gris-l)', marginTop: '0.15rem' }}>
                        {p.combinaciones?.filter(c=>c.nombre).length} ingredientes en escandallo
                      </p>
                    )}
                  </td>
                  <td style={{ padding: '0.65rem 0.9rem', color: 'var(--gris)', fontSize: '0.75rem', whiteSpace: 'nowrap' }}>
                    {(p as any).proveedor?.nombre ?? '—'}
                  </td>
                  <td style={{ padding: '0.65rem 0.9rem' }}>
                    <span style={{ fontSize: '0.65rem', padding: '0.15rem 0.45rem', background: p.tipo_servicio === 'desayuno' ? '#FEF9C3' : p.tipo_servicio === 'tardeo' ? '#EDE9FE' : 'var(--crema2)', color: p.tipo_servicio === 'desayuno' ? '#854D0E' : p.tipo_servicio === 'tardeo' ? '#5B21B6' : 'var(--gris)', whiteSpace: 'nowrap' }}>
                      {p.tipo_servicio}
                    </span>
                  </td>
                  <td style={{ padding: '0.65rem 0.9rem', textAlign: 'center' }}>
                    {p.ficha_tecnica_url
                      ? <a href={p.ficha_tecnica_url} target="_blank" rel="noopener noreferrer" title="Descargar PDF"
                          style={{ fontSize: '1.2rem', textDecoration: 'none' }}>📄</a>
                      : <span style={{ color: 'var(--gris-l)', fontSize: '0.7rem' }}>—</span>}
                  </td>
                  {verCostes && (
                    <td style={{ padding: '0.65rem 0.9rem', fontSize: '0.72rem', color: p.tiene_cargo ? 'var(--negro)' : 'var(--gris-l)' }}>
                      {p.tiene_cargo && p.precio_base
                        ? `${(p.precio_base + (p.precio_base*(p.igic_pct??0)/100) + (p.coste_aduana??0) + (p.coste_logistica??0)).toFixed(2)} €`
                        : '—'}
                    </td>
                  )}
                  <td style={{ padding: '0.65rem 0.9rem' }}>
                    <button type="button" onClick={() => toggleCatalogo(p.id, p.publicado_catalogo ?? false)}
                      style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', padding: '0.3rem 0.7rem', border: `1px solid ${p.publicado_catalogo ? '#16a34a' : 'var(--crema3)'}`, background: p.publicado_catalogo ? '#dcfce7' : 'var(--crema)', cursor: 'pointer', fontSize: '0.65rem', color: p.publicado_catalogo ? '#16a34a' : 'var(--gris)', fontFamily: 'DM Sans, sans-serif' }}>
                      {p.publicado_catalogo ? '✓ Publicado' : '○ Borrador'}
                    </button>
                  </td>
                  <td style={{ padding: '0.65rem 0.9rem', whiteSpace: 'nowrap' }}>
                    <div style={{ display: 'flex', gap: '0.4rem' }}>
                      <button type="button" onClick={() => startEdit(p)} style={{ fontSize: '0.65rem', color: '#2563eb', background: 'none', border: '1px solid #bfdbfe', padding: '0.2rem 0.6rem', cursor: 'pointer' }}>Editar</button>
                      <button type="button" onClick={() => remove(p.id, p.nombre)} style={{ fontSize: '0.65rem', color: '#dc2626', background: 'none', border: '1px solid #fca5a5', padding: '0.2rem 0.6rem', cursor: 'pointer' }}>Eliminar</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--gris-l)' }}>
              <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.4rem', fontWeight: 300 }}>Sin fichas todavía</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
