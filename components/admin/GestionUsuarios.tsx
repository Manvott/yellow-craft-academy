'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { SECCIONES_ADMIN } from '@/lib/admin-secciones'

interface Usuario {
  user_id: string
  email: string
  secciones: string[]
  es_superadmin: boolean
}

interface Props { usuarios: Usuario[] }

const cardStyle: React.CSSProperties = {
  background: 'var(--blanco)', border: '1px solid var(--crema3)', padding: '1.5rem', marginBottom: '1rem',
}

export default function GestionUsuarios({ usuarios }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)
  const [feedback, setFeedback] = useState('')

  async function guardarPermisos(userId: string, email: string, secciones: string[], esSuperadmin: boolean) {
    setLoading(userId)
    const supabase = createClient()
    await supabase.from('admin_roles').upsert({ user_id: userId, email, secciones, es_superadmin: esSuperadmin })
    setLoading(null)
    setFeedback(`Permisos de ${email} actualizados`)
    router.refresh()
  }

  return (
    <div>
      <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.4rem', fontWeight: 300, color: 'var(--negro)', marginBottom: '1.25rem' }}>
        Permisos de acceso
      </h2>
      <p style={{ fontSize: '0.78rem', color: 'var(--gris)', marginBottom: '1.5rem', lineHeight: 1.6 }}>
        Selecciona qué secciones puede ver cada usuario. ★ = Superadmin (acceso total, no se puede restringir).
      </p>

      {usuarios.length === 0 && (
        <div style={cardStyle}>
          <p style={{ fontSize: '0.8rem', color: 'var(--gris)' }}>Solo hay un usuario. Crea más usuarios para asignar permisos.</p>
        </div>
      )}

      {usuarios.map(u => (
        <UsuarioPermisos key={u.user_id} usuario={u} onSave={guardarPermisos} saving={loading === u.user_id} />
      ))}

      {feedback && (
        <p style={{ fontSize: '0.78rem', color: '#166534', background: '#f0fdf4', border: '1px solid #86efac', padding: '0.6rem 1rem', marginTop: '1rem' }}>
          ✓ {feedback}
        </p>
      )}
    </div>
  )
}

function UsuarioPermisos({ usuario, onSave, saving }: {
  usuario: Usuario
  onSave: (id: string, email: string, secs: string[], sup: boolean) => void
  saving: boolean
}) {
  const [secciones, setSecciones] = useState<string[]>(usuario.secciones ?? [])
  const [sup, setSup] = useState(usuario.es_superadmin)

  function toggle(key: string) {
    setSecciones(prev => prev.includes(key) ? prev.filter(s => s !== key) : [...prev, key])
  }

  const seccionesVisibles = SECCIONES_ADMIN.filter(s => !s.soloSuperadmin)

  return (
    <div style={{ background: 'var(--blanco)', border: '1px solid var(--crema3)', padding: '1.25rem', marginBottom: '1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <div>
          <p style={{ fontWeight: 500, fontSize: '0.85rem', color: 'var(--negro)' }}>{usuario.email}</p>
          {sup && <span style={{ fontSize: '0.62rem', background: 'var(--amarillo)', color: 'var(--negro)', padding: '0.1rem 0.5rem' }}>★ Superadmin</span>}
        </div>
        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.75rem', color: 'var(--gris)' }}>
          <input type="checkbox" checked={sup} onChange={e => setSup(e.target.checked)} style={{ accentColor: 'var(--negro)', width: 14, height: 14 }} />
          Superadmin (todo)
        </label>
      </div>

      {!sup && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem', marginBottom: '1rem' }}>
          {seccionesVisibles.map(s => (
            <label key={s.key} style={{
              display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer',
              padding: '0.6rem 0.75rem', border: `1px solid ${secciones.includes(s.key) ? 'var(--negro)' : 'var(--crema3)'}`,
              background: secciones.includes(s.key) ? 'var(--negro)' : 'var(--crema)',
              transition: 'all 0.2s',
            }}>
              <input type="checkbox" checked={secciones.includes(s.key)} onChange={() => toggle(s.key)}
                style={{ accentColor: 'var(--amarillo)', width: 14, height: 14 }} />
              <span style={{ fontSize: '0.72rem', color: secciones.includes(s.key) ? 'var(--crema)' : 'var(--negro)', fontFamily: 'DM Sans, sans-serif' }}>
                {s.icono} {s.label}
              </span>
            </label>
          ))}
        </div>
      )}

      <button onClick={() => onSave(usuario.user_id, usuario.email, sup ? SECCIONES_ADMIN.map(s => s.key) : secciones, sup)}
        disabled={saving}
        style={{ background: 'var(--negro)', color: 'var(--crema)', border: 'none', padding: '0.6rem 1.4rem', fontSize: '0.68rem', letterSpacing: '0.2em', textTransform: 'uppercase', fontWeight: 500, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.5 : 1, fontFamily: 'DM Sans, sans-serif' }}>
        {saving ? 'Guardando...' : 'Guardar permisos'}
      </button>
    </div>
  )
}
