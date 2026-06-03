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

function QRCard({ registro, size }: { registro: RegistroAcred; size: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (!canvasRef.current) return
    QRCode.toCanvas(canvasRef.current, buildVCard(registro), {
      width: size,
      margin: 2,
      color: { dark: '#0A0A08', light: '#FFFFFF' },
    })
  }, [registro, size])

  function descargar() {
    const canvas = canvasRef.current
    if (!canvas) return

    // Crear canvas con texto (nombre + empresa)
    const margin = 16
    const textHeight = registro.empresa ? 52 : 34
    const final = document.createElement('canvas')
    final.width = size + margin * 2
    final.height = size + textHeight + margin * 2
    const ctx = final.getContext('2d')!
    ctx.fillStyle = '#FFFFFF'
    ctx.fillRect(0, 0, final.width, final.height)
    ctx.drawImage(canvas, margin, margin)

    // Nombre
    ctx.fillStyle = '#0A0A08'
    ctx.font = `bold ${Math.round(size * 0.065)}px Arial`
    ctx.textAlign = 'center'
    ctx.fillText(registro.nombre, final.width / 2, size + margin + 22)

    // Empresa
    if (registro.empresa) {
      ctx.fillStyle = '#8A8880'
      ctx.font = `${Math.round(size * 0.05)}px Arial`
      ctx.fillText(registro.empresa, final.width / 2, size + margin + 42)
    }

    // Isla
    if (registro.isla) {
      ctx.fillStyle = '#0A0A08'
      ctx.font = `${Math.round(size * 0.045)}px Arial`
      ctx.fillText(registro.isla, final.width / 2, size + margin + (registro.empresa ? 58 : 40))
    }

    final.toBlob(blob => {
      if (!blob) return
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `QR-${registro.nombre.replace(/\s+/g, '-')}.png`
      a.click()
      URL.revokeObjectURL(url)
    }, 'image/png')
  }

  return (
    <div className="qr-card" style={{ border: '1px solid var(--crema3)', background: 'var(--blanco)', padding: '0.75rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.4rem' }}>
      <canvas ref={canvasRef} style={{ display: 'block', maxWidth: '100%' }} />
      <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 'clamp(0.85rem,2vw,1rem)', fontWeight: 400, color: 'var(--negro)', textAlign: 'center', lineHeight: 1.2 }}>
        {registro.nombre}
      </p>
      {registro.empresa && (
        <p style={{ fontSize: '0.62rem', color: 'var(--gris)', textAlign: 'center' }}>{registro.empresa}</p>
      )}
      {registro.isla && (
        <span style={{ fontSize: '0.55rem', background: 'var(--amarillo)', color: 'var(--negro)', padding: '0.1rem 0.45rem' }}>
          {registro.isla}
        </span>
      )}
      <button onClick={descargar}
        style={{ marginTop: '0.3rem', display: 'inline-flex', alignItems: 'center', gap: '0.3rem', background: 'var(--negro)', color: 'var(--crema)', border: 'none', padding: '0.35rem 0.8rem', fontSize: '0.6rem', letterSpacing: '0.15em', textTransform: 'uppercase', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', width: '100%', justifyContent: 'center' }}>
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
        PNG
      </button>
    </div>
  )
}

export default function AcreditacionClient({ registros }: Props) {
  const router = useRouter()
  const [updating, setUpdating] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [vista, setVista] = useState<'lista' | 'qr'>('lista')
  const [filtro, setFiltro] = useState<'todos' | 'asistio' | 'pendiente'>('todos')
  const [qrSize, setQrSize] = useState(200)

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
          {/* Controles de tamaño */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: '1.5rem', padding: '1rem 1.25rem', background: 'var(--blanco)', border: '1px solid var(--crema3)', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1, minWidth: 220 }}>
              <span style={{ fontSize: '0.65rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--gris)', whiteSpace: 'nowrap', fontFamily: 'DM Sans, sans-serif' }}>
                Tamaño QR
              </span>
              <input type="range" min={100} max={400} step={10} value={qrSize}
                onChange={e => setQrSize(Number(e.target.value))}
                style={{ flex: 1, accentColor: 'var(--negro)' }}
              />
              <span style={{ fontSize: '0.75rem', color: 'var(--negro)', fontFamily: 'DM Sans, sans-serif', minWidth: 48, textAlign: 'right' }}>
                {qrSize}px
              </span>
            </div>
            <div style={{ display: 'flex', gap: '0.4rem' }}>
              {[100,150,200,250,300,350].map(s => (
                <button key={s} onClick={() => setQrSize(s)}
                  style={{ padding: '0.3rem 0.6rem', fontSize: '0.62rem', border: `1px solid ${qrSize === s ? 'var(--negro)' : 'var(--crema3)'}`, background: qrSize === s ? 'var(--negro)' : 'var(--blanco)', color: qrSize === s ? 'var(--crema)' : 'var(--gris)', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' }}>
                  {s}
                </button>
              ))}
            </div>

            {/* Botón imprimir */}
            <button
              onClick={() => window.print()}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'var(--negro)', color: 'var(--crema)', border: 'none', padding: '0.65rem 1.25rem', fontSize: '0.68rem', letterSpacing: '0.18em', textTransform: 'uppercase', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', whiteSpace: 'nowrap' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2"/>
                <rect x="6" y="14" width="12" height="8"/>
              </svg>
              Imprimir
            </button>

            <p style={{ fontSize: '0.62rem', color: 'var(--gris-l)', fontFamily: 'DM Sans, sans-serif', fontStyle: 'italic', width: '100%' }}>
              Ajusta el tamaño según el formato de etiqueta · Descarga PNG individual o imprime todos directamente
            </p>
          </div>

          <div id="qr-grid" style={{ display: 'grid', gridTemplateColumns: `repeat(auto-fill, minmax(${qrSize + 24}px, 1fr))`, gap: '1rem' }}>
            {filtered.map(r => <QRCard key={r.id} registro={r} size={qrSize} />)}
          </div>
          {filtered.length === 0 && (
            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--gris-l)', fontSize: '0.82rem' }}>Sin resultados</div>
          )}

          <style>{`
            @media print {
              /* Ocultar todo el admin excepto los QR */
              body > * { display: none !important; }
              #qr-print-area { display: flex !important; }

              /* Sidebar, topbar, controles */
              .admin-sidebar,
              .admin-topbar,
              .no-print { display: none !important; }

              /* Main sin padding */
              .admin-main { margin: 0 !important; padding: 0 !important; }

              /* Grid de QR — ajustable según tamaño elegido */
              #qr-grid {
                display: flex !important;
                flex-wrap: wrap !important;
                gap: 8mm !important;
                padding: 8mm !important;
              }

              /* Cada tarjeta QR ocupa su propia página */
              .qr-card {
                border: none !important;
                padding: 8mm !important;
                page-break-after: always !important;
                break-after: page !important;
                width: 100% !important;
                display: flex !important;
                flex-direction: column !important;
                align-items: center !important;
                justify-content: center !important;
                min-height: 90vh !important;
                gap: 4mm !important;
              }

              .qr-card:last-child {
                page-break-after: avoid !important;
                break-after: avoid !important;
              }

              /* QR más grande en impresión */
              .qr-card canvas {
                width: auto !important;
                height: auto !important;
              }

              /* Ocultar botón PNG en impresión */
              .qr-card button { display: none !important; }

              /* Fuente limpia */
              .qr-card p, .qr-card span {
                font-family: Arial, sans-serif !important;
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
              }

              @page {
                margin: 6mm;
                size: A4;
              }
            }
          `}</style>
        </div>
      )}
    </div>
  )
}
