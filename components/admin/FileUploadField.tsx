'use client'

import { useRef, useState } from 'react'

interface Props {
  label: string
  bucket: string
  accept: string
  icono: string
  urlActual: string
  onUploaded: (url: string) => void
  hint?: string
}

function sanitizePath(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9.]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

export default function FileUploadField({ label, bucket, accept, icono, urlActual, onUploaded, hint }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')

  async function handleFile(f: File) {
    setFile(f)
    setUploading(true)
    setError('')

    try {
      const path = `${Date.now()}-${sanitizePath(f.name)}`

      // Archivos > 4MB: subida directa con URL firmada (evita límite Vercel 4.5MB)
      if (f.size > 4 * 1024 * 1024) {
        const urlRes = await fetch('/api/upload-url', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ bucket, path }),
        })
        const urlData = await urlRes.json()
        if (!urlRes.ok) { setError(urlData.error ?? 'Error al obtener URL'); return }

        const uploadRes = await fetch(urlData.signedUrl, {
          method: 'PUT',
          headers: { 'Content-Type': f.type },
          body: f,
        })
        if (!uploadRes.ok) { setError('Error al subir el archivo'); return }

        onUploaded(urlData.publicUrl)
        return
      }

      // Archivos pequeños: ruta normal
      const fd = new FormData()
      fd.append('file', f)
      fd.append('bucket', bucket)
      fd.append('path', path)

      const res = await fetch('/api/upload', { method: 'POST', body: fd })
      const data = await res.json()

      if (!res.ok) {
        setError(data.error ?? 'Error al subir')
      } else {
        onUploaded(data.url)
      }
    } catch (e: any) {
      setError('Error de red. Inténtalo de nuevo.')
    } finally {
      setUploading(false)
    }
  }

  const S = {
    label: { fontSize: '0.6rem', letterSpacing: '0.25em', textTransform: 'uppercase' as const, color: 'var(--gris)', display: 'block', marginBottom: '0.4rem', fontFamily: 'DM Sans, sans-serif' },
  }

  return (
    <div>
      <label style={S.label}>{label}</label>

      {urlActual && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem', padding: '0.4rem 0.75rem', background: '#f0fdf4', border: '1px solid #86efac', fontSize: '0.72rem' }}>
          <span>{icono}</span>
          <a href={urlActual} target="_blank" rel="noopener noreferrer" style={{ color: '#166534', textDecoration: 'none', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {urlActual.split('/').pop()?.split('?')[0] ?? 'Ver archivo'}
          </a>
          <button type="button" onClick={() => { onUploaded(''); setFile(null) }} style={{ fontSize: '0.65rem', color: '#dc2626', background: 'none', border: 'none', cursor: 'pointer' }}>Quitar</button>
        </div>
      )}

      <input ref={inputRef} type="file" accept={accept} style={{ display: 'none' }}
        onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }}
      />

      <button type="button" onClick={() => inputRef.current?.click()} disabled={uploading}
        style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'var(--negro)', color: 'var(--crema)', border: 'none', padding: '0.65rem 1.25rem', fontSize: '0.68rem', letterSpacing: '0.15em', textTransform: 'uppercase', cursor: uploading ? 'wait' : 'pointer', whiteSpace: 'nowrap', fontFamily: 'DM Sans, sans-serif', opacity: uploading ? 0.6 : 1 }}>
        <span style={{ fontSize: '1rem' }}>{icono}</span>
        {uploading ? 'Subiendo...' : 'Añadir'}
      </button>

      {file && !uploading && !error && (
        <p style={{ fontSize: '0.65rem', color: '#16a34a', marginTop: '0.25rem' }}>✓ {file.name}</p>
      )}
      {error && <p style={{ fontSize: '0.65rem', color: '#dc2626', marginTop: '0.25rem' }}>Error: {error}</p>}
      {hint && <p style={{ fontSize: '0.62rem', color: 'var(--gris-l)', marginTop: '0.25rem' }}>{hint}</p>}
    </div>
  )
}
