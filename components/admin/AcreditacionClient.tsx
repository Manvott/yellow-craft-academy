'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import type { RegistroAcred } from '@/app/[locale]/admin/(panel)/acreditacion/page'
import QRCode from 'qrcode'

interface Props { registros: RegistroAcred[] }

function buildVCard(r: RegistroAcred): string {
  const lines = [
    'BEGIN:VCARD',
    'VERSION:3.0',
    `FN:${r.nombre}`,
    `N:${r.nombre};;;`,
    r.empresa ? `ORG:${r.empresa}` : '',
    r.telefono ? `TEL;TYPE=CELL:${r.telefono}` : '',
    `EMAIL:${r.email}`,
    r.cargo ? `TITLE:${r.cargo}` : '',
    r.isla ? `NOTE:Isla: ${r.isla} | Yellow Craft Academy 2026` : 'NOTE:Yellow Craft Academy 2026',
    'END:VCARD',
  ].filter(Boolean)
  return lines.join('\n')
}

function QRCard({ registro }: { registro: RegistroAcred }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [expanded, setExpanded] = useState(false)

  useEffect(() => {
    if (!canvasRef.current) return
    QRCode.toCanvas(canvasRef.current, buildVCard(registro), {
      width: 200,
      margin: 2,
      color: { dark: '#0A0A08', light: '#FDFBF8' },
    })
  }, [registro])

  return (
    <div style={{ border: '1px solid var(--crema3)', background: 'var(--blanco)', padding: '1rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', width: 220 }}>
      <canvas ref={canvasRef} style={{ display: 'block' }} />
      <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1rem', fontWeight: 400, color: 'var(--negro)', textAlign: 'center', lineHeight: 1.2 }}>
        {registro.nombre}
      </p>
      {registro.empresa && (
        <p style={{ fontSize: '0.65rem', color: 'var(--gris)', textAlign: 'center', letterSpacing: '0.05em' }}>{registro.empresa}</p>
      )}
      {registro.isla && (
        <span style={{ fontSize: '0.58rem', background: 'var(--amarillo)', color: 'var(--negro)', padding: '0.1rem 0.5rem', letterSpacing: '0.1em' }}>
          {registro.isla}
        </span>
      )}
      <p style={{ fontSize: '0.6rem', color: 'var(--gris-l)', textAlign: 'center', fontStyle: 'italic' }}>
        Escanea → guarda contacto
      </p>
    </div>
  )
}

export default function AcreditacionClient({ registros }: Props) {
  const router = useRouter()
  const [updating, setUpdating] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [vista, setVista] = useState<'lista' | 'qr'>('lista')
  const [filtro, setFiltro] = useState<'todos' | 'asistio' | 'pendiente'>('todos')

  async function toggleAsistio(id: string, current: boolean) {
    setUpdating(id)
    const supabase = createClient()
    await supabase.from('registros').update({ asistio: !current }).eq('id', id)
    setUpdating(null)
    router.refresh()
  }

  const filtered = registros.filter(r => {
    const matchSearch = r.nombre.toLowerCase().includes(search.toLowerCase()) ||
      (r.empresa ?? '').toLowerCase().includes(search.toLowerCase())
    const matchFiltro = filtro === 'todos' ? true : filtro === 'asistio' ? r.asistio : !r.asistio
    return matchSearch && matchFiltro
  })

  return (
    <div>
      {/* Controles */}
      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '1.5rem', alignItems: 'center' }}>
        <input
          value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Buscar por nombre o empresa..."
          style={{ flex: '1 1 200px', background: 'var(--blanco)', border: '1px solid var(--crema3)', color: 'var(--grafito)', padding: '0.65rem 1rem', fontFamily: 'DM Sans, sans-serif', fontSize: '0.82rem', outline: 'none' }}
        />

        {/* Filtros */}
        <div style={{ display: 'flex', gap: '0.4rem' }}>
          {([['todos', 'Todos'], ['asistio', 'Asistió'], ['pendiente', 'Pendiente']] as const).map(([key, label]) => (
            <button key={key} onClick={() => setFiltro(key)}
              style={{ padding: '0.45rem 0.9rem', fontSize: '0.68rem', letterSpacing: '0.1em', textTransform: 'uppercase', border: '1px solid var(--crema3)', cursor: 'pointer', background: filtro === key ? 'var(--negro)' : 'var(--blanco)', color: filtro === key ? 'var(--crema)' : 'var(--gris)', fontFamily: 'DM Sans, sans-serif' }}>
              {label}
            </button>
          ))}
        </div>

        {/* Vista */}
        <div style={{ display: 'flex', gap: '0.4rem', marginLeft: 'auto' }}>
          <button onClick={() => setVista('lista')}
            style={{ padding: '0.45rem 0.9rem', fontSize: '0.68rem', letterSpacing: '0.1em', textTransform: 'uppercase', border: '1px solid var(--crema3)', cursor: 'pointer', background: vista === 'lista' ? 'var(--negro)' : 'var(--blanco)', color: vista === 'lista' ? 'var(--crema)' : 'var(--gris)', fontFamily: 'DM Sans, sans-serif' }}>
            ☰ Lista
          </button>
          <button onClick={() => setVista('qr')}
            style={{ padding: '0.45rem 0.9rem', fontSize: '0.68rem', letterSpacing: '0.1em', textTransform: 'uppercase', border: '1px solid var(--crema3)', cursor: 'pointer', background: vista === 'qr' ? 'var(--negro)' : 'var(--blanco)', color: vista === 'qr' ? 'var(--crema)' : 'var(--gris)', fontFamily: 'DM Sans, sans-serif' }}>
            ⬛ QR
          </button>
        </div>
      </div>

      {/* ── VISTA LISTA ── */}
      {vista === 'lista' && (
        <div style={{ background: 'var(--blanco)', border: '1px solid var(--crema3)', overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', minWidth: 700, borderCollapse: 'collapse', fontSize: '0.82rem' }}>
              <thead>
                <tr style={{ background: 'var(--crema2)', borderBottom: '1px solid var(--crema3)' }}>
                  {['Asistió', 'Nombre', 'Empresa', 'Isla', 'Teléfono', 'Bloques'].map(h => (
                    <th key={h} style={{ textAlign: 'left', padding: '0.65rem 1rem', fontSize: '0.58rem', letterSpacing: '0.25em', textTransform: 'uppercase', color: 'var(--gris)', fontWeight: 500, whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((r, i) => (
                  <tr key={r.id} style={{ borderBottom: '1px solid var(--crema3)', background: r.asistio ? '#f0fdf4' : i % 2 === 0 ? 'var(--blanco)' : 'var(--crema)' }}>
                    {/* Toggle asistió */}
                    <td style={{ padding: '0.65rem 1rem', textAlign: 'center' }}>
                      <button
                        onClick={() => toggleAsistio(r.id, r.asistio)}
                        disabled={updating === r.id}
                        title={r.asistio ? 'Marcar como no asistió' : 'Marcar como asistió'}
                        style={{
                          width: 28, height: 28, border: `2px solid ${r.asistio ? '#16a34a' : 'var(--crema3)'}`,
                          background: r.asistio ? '#16a34a' : 'var(--blanco)',
                          color: r.asistio ? '#fff' : 'var(--gris-l)',
                          cursor: 'pointer', fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                          opacity: updating === r.id ? 0.5 : 1, transition: 'all 0.2s',
                        }}>
                        {r.asistio ? '✓' : ''}
                      </button>
                    </td>
                    <td style={{ padding: '0.65rem 1rem', fontWeight: 500, color: 'var(--negro)', whiteSpace: 'nowrap' }}>{r.nombre}</td>
                    <td style={{ padding: '0.65rem 1rem', color: 'var(--gris)', fontSize: '0.75rem' }}>{r.empresa ?? '—'}</td>
                    <td style={{ padding: '0.65rem 1rem' }}>
                      {r.isla ? <span style={{ background: 'var(--amarillo)', color: 'var(--negro)', padding: '0.1rem 0.4rem', fontSize: '0.62rem' }}>{r.isla}</span> : <span style={{ color: 'var(--gris-l)' }}>—</span>}
                    </td>
                    <td style={{ padding: '0.65rem 1rem', color: 'var(--gris)', fontSize: '0.75rem', whiteSpace: 'nowrap' }}>{r.telefono ?? '—'}</td>
                    <td style={{ padding: '0.65rem 1rem' }}>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.2rem' }}>
                        {(r.bloques ?? []).map(b => (
                          <span key={b} style={{ fontSize: '0.55rem', background: 'var(--amarillo)', color: 'var(--negro)', padding: '0.1rem 0.35rem', whiteSpace: 'nowrap' }}>
                            {b.split('·')[0].trim().split('–')[0].trim()}
                          </span>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filtered.length === 0 && (
              <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--gris-l)', fontSize: '0.82rem' }}>Sin resultados</div>
            )}
          </div>
        </div>
      )}

      {/* ── VISTA QR ── */}
      {vista === 'qr' && (
        <div>
          <p style={{ fontSize: '0.72rem', color: 'var(--gris)', marginBottom: '1.5rem', lineHeight: 1.6, fontFamily: 'DM Sans, sans-serif' }}>
            Cada QR contiene los datos del inscrito en formato vCard. Al escanearlo con el móvil, se ofrece guardar el contacto directamente.
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
            {filtered.map(r => <QRCard key={r.id} registro={r} />)}
          </div>
          {filtered.length === 0 && (
            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--gris-l)', fontSize: '0.82rem' }}>Sin resultados</div>
          )}
        </div>
      )}
    </div>
  )
}
