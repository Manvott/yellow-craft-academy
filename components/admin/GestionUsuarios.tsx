'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { SECCIONES_ADMIN } from '@/lib/admin-secciones'

interface Usuario {
  user_id: string
  email: string
  secciones: string[]
  es_superadmin: boolean
  ver_costes: boolean
  solo_lectura: boolean
  es_yo?: boolean
}

export default function GestionUsuarios() {
  const router = useRouter()
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [loading, setLoading] = useState(true)
  const [feedback, setFeedback] = useState('')

  useEffect(() => {
    fetch('/api/admin/listar-usuarios')
      .then(r => r.json())
      .then(d => { setUsuarios(d.users ?? []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  async function guardarPermisos(u: Usuario) {
    const secciones = u.es_superadmin ? SECCIONES_ADMIN.map(s => s.key) : u.secciones
    const res = await fetch('/api/admin/guardar-permisos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: u.user_id, email: u.email, secciones, es_superadmin: u.es_superadmin, ver_costes: u.ver_costes, solo_lectura: u.solo_lectura }),
    })
    if (res.ok) {
      setFeedback(`Permisos de ${u.email} guardados correctamente`)
      // Recargar lista para reflejar cambios
      fetch('/api/admin/listar-usuarios').then(r => r.json()).then(d => setUsuarios(d.users ?? []))
    } else {
      const data = await res.json()
      setFeedback(`Error: ${data.error}`)
    }
  }

  function update(id: string, patch: Partial<Usuario>) {
    setUsuarios(prev => prev.map(u => u.user_id === id ? { ...u, ...patch } : u))
  }

  async function eliminarUsuario(u: Usuario) {
    if (!confirm(`¿Eliminar al usuario ${u.email}? Esta acción no se puede deshacer.`)) return
    const res = await fetch('/api/admin/eliminar-usuario', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: u.user_id }),
    })
    if (res.ok) {
      setUsuarios(prev => prev.filter(x => x.user_id !== u.user_id))
      setFeedback(`Usuario ${u.email} eliminado`)
    } else {
      const data = await res.json().catch(() => ({ error: 'Error al eliminar' }))
      setFeedback(`Error: ${data.error}`)
    }
  }

  function toggleSeccion(id: string, key: string) {
    setUsuarios(prev => prev.map(u => {
      if (u.user_id !== id) return u
      const secs = u.secciones.includes(key) ? u.secciones.filter(s => s !== key) : [...u.secciones, key]
      return { ...u, secciones: secs }
    }))
  }

  return (
    <div>
      <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.4rem', fontWeight: 300, color: 'var(--negro)', marginBottom: '0.75rem' }}>
        Permisos de acceso
      </h2>
      <p style={{ fontSize: '0.78rem', color: 'var(--gris)', marginBottom: '1.5rem', lineHeight: 1.6 }}>
        Selecciona qué secciones puede ver cada usuario. ★ = acceso total.
      </p>

      {loading && <p style={{ fontSize: '0.8rem', color: 'var(--gris)' }}>Cargando usuarios...</p>}

      {!loading && usuarios.map(u => (
        <div key={u.user_id} style={{ background: 'var(--blanco)', border: `1px solid ${u.es_yo ? 'var(--amarillo)' : 'var(--crema3)'}`, padding: '1.25rem', marginBottom: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <div>
              <p style={{ fontWeight: 500, fontSize: '0.85rem', color: 'var(--negro)' }}>
                {u.email} {u.es_yo && <span style={{ fontSize: '0.65rem', color: 'var(--gris)' }}>(tú)</span>}
              </p>
              {u.es_superadmin && <span style={{ fontSize: '0.6rem', background: 'var(--amarillo)', color: 'var(--negro)', padding: '0.1rem 0.5rem' }}>★ Superadmin</span>}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.75rem', color: 'var(--gris)' }}>
                <input type="checkbox" checked={u.es_superadmin}
                  onChange={e => update(u.user_id, { es_superadmin: e.target.checked })}
                  style={{ accentColor: 'var(--negro)', width: 14, height: 14 }} />
                Superadmin
              </label>
              {!u.es_yo && (
                <button onClick={() => eliminarUsuario(u)}
                  style={{ background: 'none', border: '1px solid #dc2626', color: '#dc2626', borderRadius: '0.35rem', padding: '0.3rem 0.7rem', fontSize: '0.68rem', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' }}>
                  Eliminar
                </button>
              )}
            </div>
          </div>

          {!u.es_superadmin && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.4rem', marginBottom: '1rem' }}>
              {SECCIONES_ADMIN.map(s => {
                const activo = u.secciones.includes(s.key)
                return (
                  <label key={s.key} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', padding: '0.5rem 0.75rem', border: `1px solid ${activo ? 'var(--negro)' : 'var(--crema3)'}`, background: activo ? 'var(--negro)' : 'var(--crema)', transition: 'all 0.2s' }}>
                    <input type="checkbox" checked={activo} onChange={() => toggleSeccion(u.user_id, s.key)}
                      style={{ accentColor: 'var(--amarillo)', width: 13, height: 13 }} />
                    <span style={{ fontSize: '0.7rem', color: activo ? 'var(--crema)' : 'var(--negro)', fontFamily: 'DM Sans, sans-serif' }}>
                      {s.label}
                    </span>
                  </label>
                )
              })}
            </div>
          )}

          {/* Permiso costes */}
          {!u.es_superadmin && (
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', cursor: 'pointer', padding: '0.6rem 0.75rem', border: '1px solid var(--crema3)', background: 'var(--crema)', marginBottom: '0.75rem' }}>
              <input type="checkbox"
                checked={u.ver_costes}
                onChange={e => update(u.user_id, { ver_costes: e.target.checked })}
                style={{ accentColor: 'var(--negro)', width: 14, height: 14 }}
              />
              <div>
                <p style={{ fontSize: '0.78rem', color: 'var(--negro)', fontFamily: 'DM Sans, sans-serif' }}>Ver costes en Fichas de Producto</p>
                <p style={{ fontSize: '0.65rem', color: 'var(--gris)', fontFamily: 'DM Sans, sans-serif' }}>Si está desactivado, el usuario no verá precios, IGIC ni costes logísticos</p>
              </div>
            </label>
          )}

          {/* Modo prueba / solo lectura */}
          {!u.es_superadmin && (
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', cursor: 'pointer', padding: '0.6rem 0.75rem', border: `1px solid ${u.solo_lectura ? '#fcd34d' : 'var(--crema3)'}`, background: u.solo_lectura ? '#fffbeb' : 'var(--crema)', marginBottom: '0.75rem' }}>
              <input type="checkbox"
                checked={u.solo_lectura}
                onChange={e => update(u.user_id, { solo_lectura: e.target.checked })}
                style={{ accentColor: '#d97706', width: 14, height: 14 }}
              />
              <div>
                <p style={{ fontSize: '0.78rem', color: 'var(--negro)', fontFamily: 'DM Sans, sans-serif' }}>Modo prueba (solo lectura)</p>
                <p style={{ fontSize: '0.65rem', color: 'var(--gris)', fontFamily: 'DM Sans, sans-serif' }}>Puede navegar y probar el portal, pero no se guardan cambios (crear, editar ni eliminar)</p>
              </div>
            </label>
          )}

          <button onClick={() => guardarPermisos(u)}
            style={{ background: 'var(--negro)', color: 'var(--crema)', border: 'none', padding: '0.55rem 1.25rem', fontSize: '0.68rem', letterSpacing: '0.2em', textTransform: 'uppercase', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' }}>
            Guardar
          </button>
        </div>
      ))}

      {feedback && (
        <p style={{ fontSize: '0.78rem', color: '#166534', background: '#f0fdf4', border: '1px solid #86efac', padding: '0.6rem 1rem', marginTop: '0.5rem' }}>
          ✓ {feedback}
        </p>
      )}
    </div>
  )
}
