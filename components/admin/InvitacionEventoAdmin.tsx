'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { ConfiguracionInvitacionEvento } from '@/lib/tipos-invitacion-evento'

const cardStyle: React.CSSProperties = {
  background: 'var(--blanco)',
  border: '1px solid var(--crema3)',
  padding: '1.75rem',
}

const labelStyle: React.CSSProperties = {
  fontSize: '0.6rem',
  letterSpacing: '0.3em',
  textTransform: 'uppercase',
  color: 'var(--gris)',
  display: 'block',
  marginBottom: '0.4rem',
  fontFamily: 'DM Sans, sans-serif',
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  background: 'var(--crema)',
  border: '1px solid var(--crema3)',
  color: 'var(--grafito)',
  padding: '0.85rem 1rem',
  fontFamily: 'DM Sans, sans-serif',
  fontSize: '0.85rem',
  outline: 'none',
  marginBottom: '0.75rem',
}

const btnStyle: React.CSSProperties = {
  background: 'var(--negro)',
  color: 'var(--crema)',
  border: 'none',
  padding: '0.75rem 1.75rem',
  fontSize: '0.68rem',
  letterSpacing: '0.2em',
  textTransform: 'uppercase',
  fontWeight: 500,
  cursor: 'pointer',
  fontFamily: 'DM Sans, sans-serif',
}

function Feedback({ ok, msg }: { ok: boolean; msg: string }) {
  if (!msg) return null
  return (
    <p style={{ fontSize: '0.8rem', marginTop: '0.75rem', padding: '0.65rem 1rem', background: ok ? '#f0fdf4' : '#fef2f2', border: `1px solid ${ok ? '#86efac' : '#fca5a5'}`, color: ok ? '#166534' : '#dc2626' }}>
      {msg}
    </p>
  )
}

export default function InvitacionEventoAdmin({ config }: { config: ConfiguracionInvitacionEvento | null }) {
  const router = useRouter()
  const [eventoNombre, setEventoNombre] = useState(config?.evento_nombre ?? '')
  const [mensaje, setMensaje] = useState(config?.mensaje ?? '')
  const [imagenUrl, setImagenUrl] = useState(config?.imagen_url ?? '')
  const [saving, setSaving] = useState(false)
  const [feedback, setFeedback] = useState({ ok: false, msg: '' })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!eventoNombre.trim() || !mensaje.trim()) {
      setFeedback({ ok: false, msg: 'El nombre del evento y el mensaje son obligatorios.' })
      return
    }
    setSaving(true)
    const res = await fetch('/api/admin/guardar-invitacion-evento', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: config?.id,
        evento_nombre: eventoNombre.trim(),
        mensaje: mensaje.trim(),
        imagen_url: imagenUrl.trim() || null,
      }),
    })
    const data = await res.json()
    setSaving(false)
    if (!res.ok) {
      setFeedback({ ok: false, msg: data.error ?? 'Error al guardar el mensaje.' })
    } else {
      setFeedback({ ok: true, msg: 'Mensaje de invitación guardado.' })
      router.refresh()
    }
  }

  return (
    <div style={cardStyle}>
      <form onSubmit={handleSubmit} style={{ maxWidth: 560 }}>
        <div>
          <label style={labelStyle}>Nombre del evento</label>
          <input value={eventoNombre} onChange={e => setEventoNombre(e.target.value)} style={inputStyle} placeholder="Ej: Cena de Networking Otoño 2026" />
        </div>
        <div>
          <label style={labelStyle}>Mensaje de invitación</label>
          <textarea rows={8} value={mensaje} onChange={e => setMensaje(e.target.value)} style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.6 }}
            placeholder="Hola {nombre}, desde Ava Selección nos encantaría contar contigo en nuestro próximo evento: {evento_nombre}. ¿Te gustaría asistir?" />
          <p style={{ fontSize: '0.68rem', color: 'var(--gris-l)', marginTop: '-0.4rem', marginBottom: '0.75rem' }}>
            Variables disponibles: {'{nombre}'} {'{evento_nombre}'}
          </p>
        </div>
        <div>
          <label style={labelStyle}>Imagen (URL, opcional)</label>
          <input value={imagenUrl} onChange={e => setImagenUrl(e.target.value)} style={inputStyle} placeholder="https://..." />
        </div>
        <button type="submit" disabled={saving} style={{ ...btnStyle, opacity: saving ? 0.5 : 1 }}>
          {saving ? 'Guardando...' : 'Guardar mensaje'}
        </button>
        <Feedback {...feedback} />
      </form>
    </div>
  )
}
