'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

const cardStyle: React.CSSProperties = {
  background: 'var(--blanco)',
  border: '1px solid var(--crema3)',
  padding: '1.75rem',
  marginBottom: '1.5rem',
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

// ── Cambiar contraseña ─────────────────────────────────────────────────────────
function CambiarPassword() {
  const [nueva, setNueva] = useState('')
  const [confirmar, setConfirmar] = useState('')
  const [loading, setLoading] = useState(false)
  const [feedback, setFeedback] = useState({ ok: false, msg: '' })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (nueva.length < 8) return setFeedback({ ok: false, msg: 'La contraseña debe tener al menos 8 caracteres.' })
    if (nueva !== confirmar) return setFeedback({ ok: false, msg: 'Las contraseñas no coinciden.' })
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ password: nueva })
    setLoading(false)
    if (error) {
      setFeedback({ ok: false, msg: `Error: ${error.message}` })
    } else {
      setFeedback({ ok: true, msg: 'Contraseña actualizada correctamente.' })
      setNueva('')
      setConfirmar('')
    }
  }

  return (
    <div style={cardStyle}>
      <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.4rem', fontWeight: 300, color: 'var(--negro)', marginBottom: '1.25rem' }}>
        Cambiar contraseña
      </h2>
      <form onSubmit={handleSubmit} style={{ maxWidth: 380 }}>
        <div>
          <label style={labelStyle}>Nueva contraseña</label>
          <input type="password" required minLength={8} value={nueva} onChange={e => setNueva(e.target.value)} style={inputStyle} placeholder="Mínimo 8 caracteres" />
        </div>
        <div>
          <label style={labelStyle}>Confirmar contraseña</label>
          <input type="password" required minLength={8} value={confirmar} onChange={e => setConfirmar(e.target.value)} style={inputStyle} placeholder="Repite la contraseña" />
        </div>
        <button type="submit" disabled={loading} style={{ ...btnStyle, opacity: loading ? 0.5 : 1 }}>
          {loading ? 'Guardando...' : 'Actualizar contraseña'}
        </button>
        <Feedback {...feedback} />
      </form>
    </div>
  )
}

// ── Invitar usuario ─────────────────────────────────────────────────────────────
function InvitarUsuario() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [feedback, setFeedback] = useState({ ok: false, msg: '' })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (password.length < 8) return setFeedback({ ok: false, msg: 'La contraseña debe tener al menos 8 caracteres.' })
    setLoading(true)
    const res = await fetch('/api/admin/crear-usuario', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })
    const data = await res.json()
    setLoading(false)
    if (!res.ok) {
      setFeedback({ ok: false, msg: data.error ?? 'Error al crear el usuario.' })
    } else {
      setFeedback({ ok: true, msg: `Usuario ${email} creado correctamente. Ya puede acceder al panel.` })
      setEmail('')
      setPassword('')
    }
  }

  return (
    <div style={cardStyle}>
      <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.4rem', fontWeight: 300, color: 'var(--negro)', marginBottom: '0.5rem' }}>
        Añadir usuario administrador
      </h2>
      <p style={{ fontSize: '0.78rem', color: 'var(--gris)', lineHeight: 1.6, marginBottom: '1.25rem' }}>
        Crea hasta 15 usuarios en total. Ajusta sus permisos en la sección de abajo.
      </p>
      <form onSubmit={handleSubmit} style={{ maxWidth: 380 }}>
        <div>
          <label style={labelStyle}>Email del nuevo usuario</label>
          <input type="email" required value={email} onChange={e => setEmail(e.target.value)} style={inputStyle} placeholder="email@ejemplo.com" />
        </div>
        <div>
          <label style={labelStyle}>Contraseña inicial</label>
          <input type="password" required minLength={8} value={password} onChange={e => setPassword(e.target.value)} style={inputStyle} placeholder="Mínimo 8 caracteres" />
        </div>
        <button type="submit" disabled={loading} style={{ ...btnStyle, opacity: loading ? 0.5 : 1 }}>
          {loading ? 'Creando...' : 'Crear usuario'}
        </button>
        <Feedback {...feedback} />
      </form>
    </div>
  )
}

export default function AjustesAdmin() {
  return (
    <div style={{ maxWidth: 600 }}>
      <CambiarPassword />
      <InvitarUsuario />
    </div>
  )
}
