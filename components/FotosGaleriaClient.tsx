'use client'

import { useState, useRef } from 'react'

interface Foto {
  id: string
  nombre_archivo: string
  url_publica: string
  sesion: string | null
  subido_por: string | null
  created_at: string
}

interface Props { fotosIniciales: Foto[] }

async function subirConPresign(
  file: File,
  sesion: string,
  subidoPor: string,
  onProgress: (p: number) => void
): Promise<Foto | null> {
  const presignRes = await fetch('/api/fotos/presign', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nombre: file.name, tipo: file.type, sesion }),
  })
  if (!presignRes.ok) return null
  const { uploadUrl, key, publicUrl } = await presignRes.json()

  await new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.upload.onprogress = e => { if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100)) }
    xhr.onload = () => (xhr.status < 300 ? resolve() : reject())
    xhr.onerror = reject
    xhr.open('PUT', uploadUrl)
    xhr.setRequestHeader('Content-Type', file.type)
    xhr.send(file)
  })

  const regRes = await fetch('/api/fotos/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nombre_archivo: file.name, url_publica: publicUrl, r2_key: key, sesion, subido_por: subidoPor }),
  })
  if (!regRes.ok) return null
  const { id } = await regRes.json()

  return { id, nombre_archivo: file.name, url_publica: publicUrl, sesion, subido_por: subidoPor || null, created_at: new Date().toISOString() }
}

export default function FotosGaleriaClient({ fotosIniciales }: Props) {
  const [fotos, setFotos] = useState<Foto[]>(fotosIniciales)
  const [subiendo, setSubiendo] = useState(false)
  const [progreso, setProgreso] = useState(0)
  const [nombre, setNombre] = useState('')
  const [sesion, setSesion] = useState('general')
  const [filtro, setFiltro] = useState('todas')
  const [lightbox, setLightbox] = useState<Foto | null>(null)
  const [error, setError] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const sesiones = ['todas', ...Array.from(new Set(fotos.map(f => f.sesion ?? 'general')))]
  const filtradas = filtro === 'todas' ? fotos : fotos.filter(f => (f.sesion ?? 'general') === filtro)

  async function handleFiles(files: FileList) {
    setSubiendo(true)
    setError('')
    const nuevas: Foto[] = []
    for (let i = 0; i < files.length; i++) {
      const foto = await subirConPresign(files[i], sesion, nombre, p =>
        setProgreso(Math.round(((i / files.length) + p / 100 / files.length) * 100))
      )
      if (foto) nuevas.push(foto)
    }
    if (nuevas.length < files.length) setError(`${files.length - nuevas.length} foto(s) no se pudieron subir.`)
    setFotos(prev => [...nuevas, ...prev])
    setSubiendo(false)
    setProgreso(0)
    if (inputRef.current) inputRef.current.value = ''
  }

  return (
    <div>
      {/* Upload panel */}
      <div style={{ background: 'white', borderRadius: '1rem', border: '1px solid rgba(0,0,0,0.07)', padding: '2rem', marginBottom: '3rem' }}>
        <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.4rem', fontWeight: 400, color: 'var(--negro)', marginBottom: '1.2rem' }}>
          Subir fotografías
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
          <div>
            <label style={{ fontSize: '0.68rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--gris)', display: 'block', marginBottom: '0.4rem', fontFamily: 'DM Sans, sans-serif' }}>
              Tu nombre (fotógrafo)
            </label>
            <input type="text" value={nombre} onChange={e => setNombre(e.target.value)} placeholder="Nombre del fotógrafo"
              style={{ width: '100%', border: '1px solid rgba(0,0,0,0.12)', borderRadius: '0.5rem', padding: '0.6rem 0.8rem', fontSize: '0.85rem', fontFamily: 'DM Sans, sans-serif', outline: 'none', boxSizing: 'border-box' }} />
          </div>
          <div>
            <label style={{ fontSize: '0.68rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--gris)', display: 'block', marginBottom: '0.4rem', fontFamily: 'DM Sans, sans-serif' }}>
              Sesión / categoría
            </label>
            <input type="text" value={sesion} onChange={e => setSesion(e.target.value)} placeholder="ej: apertura, taller-croqueta"
              style={{ width: '100%', border: '1px solid rgba(0,0,0,0.12)', borderRadius: '0.5rem', padding: '0.6rem 0.8rem', fontSize: '0.85rem', fontFamily: 'DM Sans, sans-serif', outline: 'none', boxSizing: 'border-box' }} />
          </div>
        </div>
        <label
          style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', border: '2px dashed rgba(245,197,24,0.4)', borderRadius: '0.75rem', padding: '2rem', cursor: subiendo ? 'default' : 'pointer', background: 'rgba(245,197,24,0.03)' }}
          onDragOver={e => e.preventDefault()}
          onDrop={e => { e.preventDefault(); if (!subiendo && e.dataTransfer.files.length) handleFiles(e.dataTransfer.files) }}
        >
          <span style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📷</span>
          <span style={{ fontSize: '0.85rem', fontFamily: 'DM Sans, sans-serif', color: 'var(--gris)' }}>
            {subiendo ? `Subiendo… ${progreso}%` : 'Arrastra fotos aquí o haz clic para seleccionar'}
          </span>
          <input ref={inputRef} type="file" multiple accept="image/*" style={{ display: 'none' }} disabled={subiendo}
            onChange={e => { if (e.target.files?.length) handleFiles(e.target.files) }} />
        </label>
        {subiendo && (
          <div style={{ marginTop: '0.8rem', height: '4px', background: 'rgba(0,0,0,0.08)', borderRadius: '2px', overflow: 'hidden' }}>
            <div style={{ height: '100%', background: 'var(--amarillo)', width: `${progreso}%`, transition: 'width 0.3s' }} />
          </div>
        )}
        {error && <p style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: '#dc2626', fontFamily: 'DM Sans, sans-serif' }}>{error}</p>}
      </div>

      {/* Filtros */}
      {sesiones.length > 1 && (
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
          {sesiones.map(s => (
            <button key={s} onClick={() => setFiltro(s)}
              style={{ padding: '0.35rem 1rem', borderRadius: '2rem', border: filtro === s ? '1.5px solid var(--negro)' : '1.5px solid rgba(0,0,0,0.1)', background: filtro === s ? 'var(--negro)' : 'transparent', color: filtro === s ? 'var(--crema)' : 'var(--gris)', fontSize: '0.72rem', fontFamily: 'DM Sans, sans-serif', letterSpacing: '0.05em', cursor: 'pointer', textTransform: 'capitalize' }}>
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Grid */}
      {filtradas.length === 0 ? (
        <p style={{ textAlign: 'center', color: 'var(--gris)', fontFamily: 'DM Sans, sans-serif', padding: '4rem 0' }}>
          Aún no hay fotografías. ¡Sé el primero en subir!
        </p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1rem' }}>
          {filtradas.map(foto => (
            <div key={foto.id} onClick={() => setLightbox(foto)}
              style={{ position: 'relative', borderRadius: '0.75rem', overflow: 'hidden', aspectRatio: '4/3', cursor: 'pointer', background: '#f0ece6' }}>
              <img src={foto.url_publica} alt={foto.nombre_archivo} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
            </div>
          ))}
        </div>
      )}

      {/* Lightbox */}
      {lightbox && (
        <div onClick={() => setLightbox(null)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.92)', zIndex: 9999, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
          <img src={lightbox.url_publica} alt={lightbox.nombre_archivo} onClick={e => e.stopPropagation()}
            style={{ maxWidth: '90vw', maxHeight: '80vh', objectFit: 'contain', borderRadius: '0.5rem' }} />
          <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem', alignItems: 'center' }}>
            <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem', fontFamily: 'DM Sans, sans-serif' }}>{lightbox.subido_por ?? 'Fotógrafo'}</span>
            <a href={lightbox.url_publica} download={lightbox.nombre_archivo} onClick={e => e.stopPropagation()}
              style={{ background: 'var(--amarillo)', color: 'var(--negro)', padding: '0.5rem 1.5rem', borderRadius: '2rem', fontSize: '0.8rem', fontFamily: 'DM Sans, sans-serif', fontWeight: 600, textDecoration: 'none' }}>
              ↓ Descargar
            </a>
            <button onClick={() => setLightbox(null)}
              style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white', padding: '0.5rem 1rem', borderRadius: '2rem', cursor: 'pointer', fontSize: '0.8rem', fontFamily: 'DM Sans, sans-serif' }}>
              Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
