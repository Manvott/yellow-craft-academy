'use client'

import { useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Props {
  label: string
  bucket: string
  accept: string
  icono: string
  urlActual: string
  onUploaded: (url: string) => void
  hint?: string
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
    const supabase = createClient()
    const ext = f.name.split('.').pop() ?? 'bin'
    // Sanitizar: solo letras, números y guiones — sin espacios, +, (), &, etc.
    const baseName = f.name
      .toLowerCase()
      .normalize('NFD').replace(/[̀-ͯ]/g, '') // quitar acentos
      .replace(/[^a-z0-9.]/g, '-')                      // reemplazar todo lo especial
      .replace(/-+/g, '-')                               // colapsar guiones múltiples
      .replace(/^-|-$/g, '')                             // quitar guiones extremos
    const path = `${Date.now()}-${baseName}`
    const { data, error: err } = await supabase.storage.from(bucket).upload(path, f, { upsert: true })
    setUploading(false)
    if (err) { setError(err.message); return }
    const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(data.path)
    onUploaded(publicUrl)
  }

  const S = {
    label: { fontSize: '0.6rem', letterSpacing: '0.25em', textTransform: 'uppercase' as const, color: 'var(--gris)', display: 'block', marginBottom: '0.4rem', fontFamily: 'DM Sans, sans-serif' },
    input: { width: '100%', background: 'var(--crema)', border: '1px solid var(--crema3)', color: 'var(--grafito)', padding: '0.7rem 0.9rem', fontFamily: 'DM Sans, sans-serif', fontSize: '0.82rem', outline: 'none' } as React.CSSProperties,
  }

  return (
    <div>
      <label style={S.label}>{label}</label>

      {/* URL actual / subida */}
      {urlActual && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem', padding: '0.4rem 0.75rem', background: 'var(--blanco)', border: '1px solid var(--crema3)', fontSize: '0.72rem' }}>
          <span>{icono}</span>
          <a href={urlActual} target="_blank" rel="noopener noreferrer" style={{ color: '#2563eb', textDecoration: 'none', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            Ver archivo actual
          </a>
          <button type="button" onClick={() => { onUploaded(''); setFile(null) }} style={{ fontSize: '0.65rem', color: '#dc2626', background: 'none', border: 'none', cursor: 'pointer' }}>Quitar</button>
        </div>
      )}

      {/* Input file oculto */}
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        style={{ display: 'none' }}
        onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }}
      />

      {/* Botón subir */}
      <button type="button"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'var(--negro)', color: 'var(--crema)', border: 'none', padding: '0.65rem 1.25rem', fontSize: '0.68rem', letterSpacing: '0.15em', textTransform: 'uppercase', cursor: uploading ? 'wait' : 'pointer', whiteSpace: 'nowrap', fontFamily: 'DM Sans, sans-serif', opacity: uploading ? 0.6 : 1 }}>
        <span style={{ fontSize: '1rem' }}>{icono}</span>
        {uploading ? 'Subiendo...' : 'Añadir'}
      </button>

      {file && !uploading && !error && (
        <p style={{ fontSize: '0.65rem', color: '#16a34a', marginTop: '0.25rem' }}>✓ {file.name} subido correctamente</p>
      )}
      {error && <p style={{ fontSize: '0.65rem', color: '#dc2626', marginTop: '0.25rem' }}>Error: {error}</p>}
      {hint && <p style={{ fontSize: '0.62rem', color: 'var(--gris-l)', marginTop: '0.25rem' }}>{hint}</p>}
    </div>
  )
}
