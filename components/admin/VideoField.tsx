'use client'

import { useState, useRef } from 'react'

interface Props {
  value: string
  onChange: (url: string) => void
}

function sanitizePath(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9.]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

function isYouTubeOrVimeo(url: string) {
  return /youtube\.com|youtu\.be|vimeo\.com/.test(url)
}

function embedUrl(url: string): string | null {
  // YouTube
  const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/)
  if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}`
  // Vimeo
  const vimeoMatch = url.match(/vimeo\.com\/(\d+)/)
  if (vimeoMatch) return `https://player.vimeo.com/video/${vimeoMatch[1]}`
  return null
}

const S = {
  label: { display: 'block' as const, fontSize: '0.6rem', letterSpacing: '0.25em', textTransform: 'uppercase' as const, color: 'var(--gris)', marginBottom: '0.5rem', fontFamily: 'DM Sans, sans-serif' },
  tab: (active: boolean): React.CSSProperties => ({
    padding: '0.35rem 0.85rem', fontSize: '0.62rem', letterSpacing: '0.12em', textTransform: 'uppercase',
    border: `1px solid ${active ? 'var(--negro)' : 'var(--crema3)'}`,
    background: active ? 'var(--negro)' : 'var(--blanco)',
    color: active ? 'var(--crema)' : 'var(--gris)',
    cursor: 'pointer', fontFamily: 'DM Sans, sans-serif',
  }),
}

export default function VideoField({ value, onChange }: Props) {
  const [modo, setModo] = useState<'url' | 'archivo'>('url')
  const [urlInput, setUrlInput] = useState(value && isYouTubeOrVimeo(value) ? value : '')
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  function aplicarUrl() {
    const url = urlInput.trim()
    if (!url) return
    onChange(url)
    setError('')
  }

  async function handleFile(f: File) {
    if (f.size > 50 * 1024 * 1024) {
      setError('El archivo supera el límite de 50 MB. Usa una URL de YouTube o Vimeo para vídeos grandes.')
      return
    }
    setUploading(true); setProgress(0); setError('')
    try {
      const path = `${Date.now()}-${sanitizePath(f.name)}`

      if (f.size > 4 * 1024 * 1024) {
        const urlRes = await fetch('/api/upload-url', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ bucket: 'pildoras-media', path }),
        })
        const urlData = await urlRes.json()
        if (!urlRes.ok) { setError(urlData.error ?? 'Error al obtener URL'); return }

        await new Promise<void>((resolve, reject) => {
          const xhr = new XMLHttpRequest()
          xhr.open('PUT', urlData.signedUrl)
          xhr.setRequestHeader('Content-Type', f.type || 'video/mp4')
          xhr.upload.onprogress = (e) => {
            if (e.lengthComputable) setProgress(Math.round((e.loaded / e.total) * 100))
          }
          xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) { onChange(urlData.publicUrl); resolve() }
            else reject(new Error(`Error ${xhr.status}: ${xhr.responseText || 'Error al subir'}`))
          }
          xhr.onerror = () => reject(new Error('Error de red al subir'))
          xhr.timeout = 10 * 60 * 1000
          xhr.ontimeout = () => reject(new Error('Tiempo de espera agotado'))
          xhr.send(f)
        })
      } else {
        const fd = new FormData()
        fd.append('file', f); fd.append('bucket', 'pildoras-media'); fd.append('path', path)
        const res = await fetch('/api/upload', { method: 'POST', body: fd })
        const data = await res.json()
        if (!res.ok) { setError(data.error ?? 'Error al subir'); return }
        onChange(data.url)
      }
    } catch (e: any) {
      setError(e?.message ?? 'Error al subir el archivo')
    } finally {
      setUploading(false)
    }
  }

  const embed = value ? embedUrl(value) : null
  const esArchivo = value && !isYouTubeOrVimeo(value)

  return (
    <div>
      <label style={S.label}>Vídeo</label>

      {/* Previsualización */}
      {value && (
        <div style={{ marginBottom: '0.75rem' }}>
          {embed ? (
            <iframe src={embed} width="100%" height="200" style={{ border: 'none', display: 'block' }} allowFullScreen />
          ) : esArchivo ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.4rem 0.75rem', background: '#f0fdf4', border: '1px solid #86efac', fontSize: '0.72rem' }}>
              <span>🎬</span>
              <a href={value} target="_blank" rel="noopener noreferrer" style={{ color: '#166534', textDecoration: 'none', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {value.split('/').pop()?.split('?')[0] ?? 'Ver vídeo'}
              </a>
            </div>
          ) : null}
          <button type="button" onClick={() => { onChange(''); setUrlInput('') }}
            style={{ fontSize: '0.62rem', color: '#dc2626', background: 'none', border: 'none', cursor: 'pointer', marginTop: '0.3rem', fontFamily: 'DM Sans, sans-serif' }}>
            ✕ Quitar vídeo
          </button>
        </div>
      )}

      {/* Tabs */}
      {!value && (
        <>
          <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '0.75rem' }}>
            <button type="button" onClick={() => setModo('url')} style={S.tab(modo === 'url')}>URL YouTube / Vimeo</button>
            <button type="button" onClick={() => setModo('archivo')} style={S.tab(modo === 'archivo')}>Subir archivo (≤50 MB)</button>
          </div>

          {modo === 'url' && (
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input
                value={urlInput}
                onChange={e => setUrlInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') aplicarUrl() }}
                placeholder="https://www.youtube.com/watch?v=... o https://vimeo.com/..."
                style={{ flex: 1, background: 'var(--blanco)', border: '1px solid var(--crema3)', padding: '0.6rem 0.75rem', fontSize: '0.78rem', outline: 'none', fontFamily: 'DM Sans, sans-serif' }}
              />
              <button type="button" onClick={aplicarUrl} disabled={!urlInput.trim()}
                style={{ background: 'var(--negro)', color: 'var(--crema)', border: 'none', padding: '0.6rem 1rem', fontSize: '0.65rem', letterSpacing: '0.12em', textTransform: 'uppercase', cursor: urlInput.trim() ? 'pointer' : 'default', fontFamily: 'DM Sans, sans-serif', opacity: urlInput.trim() ? 1 : 0.4 }}>
                Aplicar
              </button>
            </div>
          )}

          {modo === 'archivo' && (
            <>
              <input ref={inputRef} type="file" accept="video/*" style={{ display: 'none' }}
                onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }} />
              <button type="button" onClick={() => inputRef.current?.click()} disabled={uploading}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'var(--negro)', color: 'var(--crema)', border: 'none', padding: '0.65rem 1.25rem', fontSize: '0.68rem', letterSpacing: '0.15em', textTransform: 'uppercase', cursor: uploading ? 'wait' : 'pointer', fontFamily: 'DM Sans, sans-serif', opacity: uploading ? 0.6 : 1 }}>
                <span style={{ fontSize: '1rem' }}>🎬</span>
                {uploading ? (progress > 0 ? `Subiendo ${progress}%` : 'Subiendo...') : 'Seleccionar vídeo'}
              </button>
              {uploading && progress > 0 && (
                <div style={{ marginTop: '0.4rem', height: 4, background: 'var(--crema3)', width: '100%', maxWidth: 200 }}>
                  <div style={{ height: '100%', width: `${progress}%`, background: 'var(--negro)', transition: 'width 0.3s' }} />
                </div>
              )}
              <p style={{ fontSize: '0.62rem', color: 'var(--gris-l)', marginTop: '0.35rem', fontFamily: 'DM Sans, sans-serif' }}>MP4, WebM. Máximo 50 MB. Para vídeos más grandes usa la URL de YouTube o Vimeo.</p>
            </>
          )}
        </>
      )}

      {error && <p style={{ fontSize: '0.65rem', color: '#dc2626', marginTop: '0.35rem' }}>{error}</p>}
    </div>
  )
}
