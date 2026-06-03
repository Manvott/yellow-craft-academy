'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import type { RegistroAcred } from '@/app/[locale]/admin/(panel)/acreditacion/page'
import QRCode from 'qrcode'

interface Props { registros: RegistroAcred[] }

function buildVCard(r: RegistroAcred): string {
  return [
    'BEGIN:VCARD', 'VERSION:3.0',
    `FN:${r.nombre}`,
    r.empresa ? `ORG:${r.empresa}` : '',
    r.telefono ? `TEL;TYPE=CELL:${r.telefono}` : '',
    `EMAIL:${r.email}`,
    r.cargo ? `TITLE:${r.cargo}` : '',
    r.isla ? `NOTE:${r.isla} · Yellow Craft Academy 2026` : 'NOTE:Yellow Craft Academy 2026',
    'END:VCARD',
  ].filter(Boolean).join('\n')
}

function imprimirQR(canvas: HTMLCanvasElement | null, r: RegistroAcred) {
  if (!canvas) return
  const dataUrl = canvas.toDataURL('image/png')
  const win = window.open('', '_blank', 'width=400,height=500')
  if (!win) return
  win.document.write(`<!DOCTYPE html><html><head>
    <title>QR - ${r.nombre}</title>
    <style>
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body { display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100vh; background: #fff; font-family: Arial, sans-serif; padding: 16px; }
      img { max-width: 100%; height: auto; display: block; }
      .nombre { font-size: 16px; font-weight: bold; margin-top: 10px; text-align: center; }
      .empresa { font-size: 12px; color: #666; margin-top: 4px; text-align: center; }
      .isla { font-size: 11px; background: #F5C518; color: #000; padding: 2px 8px; margin-top: 6px; display: inline-block; }
      @media print { body { padding: 0; } }
    </style>
  </head><body>
    <img src="${dataUrl}" />
    <p class="nombre">${r.nombre}</p>
    ${r.empresa ? `<p class="empresa">${r.empresa}</p>` : ''}
    ${r.isla ? `<span class="isla">${r.isla}</span>` : ''}
    <script>window.onload = () => { window.print(); window.onafterprint = () => window.close(); }<\/script>
  </body></html>`)
  win.document.close()
}

function QRInline({ registro, size = 180 }: { registro: RegistroAcred; size?: number }) {
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
    const extra = registro.empresa ? 52 : 34
    const m = 12
    const final = document.createElement('canvas')
    final.width = size + m * 2
    final.height = size + extra + m * 2
    const ctx = final.getContext('2d')!
    ctx.fillStyle = '#FFFFFF'
    ctx.fillRect(0, 0, final.width, final.height)
    ctx.drawImage(canvas, m, m)
    ctx.fillStyle = '#0A0A08'
    ctx.font = `bold ${Math.round(size * 0.07)}px Arial`
    ctx.textAlign = 'center'
    ctx.fillText(registro.nombre, final.width / 2, size + m + 20)
    if (registro.empresa) {
      ctx.fillStyle = '#8A8880'
      ctx.font = `${Math.round(size * 0.055)}px Arial`
      ctx.fillText(registro.empresa, final.width / 2, size + m + 38)
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
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', padding: '0.75rem', background: 'var(--blanco)', border: '1px solid var(--crema3)' }}>
      <canvas ref={canvasRef} style={{ display: 'block' }} />
      <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '0.9rem', fontWeight: 400, color: 'var(--negro)', textAlign: 'center', lineHeight: 1.2 }}>{registro.nombre}</p>
      {registro.empresa && <p style={{ fontSize: '0.6rem', color: 'var(--gris)', textAlign: 'center' }}>{registro.empresa}</p>}
      <div style={{ display: 'flex', gap: '0.4rem' }}>
        <button onClick={descargar}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', background: 'var(--negro)', color: 'var(--crema)', border: 'none', padding: '0.3rem 0.75rem', fontSize: '0.6rem', letterSpacing: '0.15em', textTransform: 'uppercase', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' }}>
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
          PNG
        </button>
        <button onClick={() => imprimirQR(canvasRef.current, registro)}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', background: 'none', color: 'var(--gris)', border: '1px solid var(--crema3)', padding: '0.3rem 0.75rem', fontSize: '0.6rem', letterSpacing: '0.15em', textTransform: 'uppercase', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' }}>
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
          Imprimir
        </button>
      </div>
    </div>
  )
}

export default function AcreditacionClient({ registros }: Props) {
  const router = useRouter()
  const [updating, setUpdating] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [filtro, setFiltro] = useState<'todos' | 'asistio' | 'pendiente'>('todos')
  const [qrAbierto, setQrAbierto] = useState<string | null>(null)

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
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Buscar por nombre o empresa..."
          style={{ flex: '1 1 200px', background: 'var(--blanco)', border: '1px solid var(--crema3)', color: 'var(--grafito)', padding: '0.65rem 1rem', fontFamily: 'DM Sans, sans-serif', fontSize: '0.82rem', outline: 'none' }}
        />
        {(['todos', 'asistio', 'pendiente'] as const).map(key => (
          <button key={key} onClick={() => setFiltro(key)}
            style={{ padding: '0.45rem 0.9rem', fontSize: '0.68rem', letterSpacing: '0.1em', textTransform: 'uppercase', border: '1px solid var(--crema3)', cursor: 'pointer', background: filtro === key ? 'var(--negro)' : 'var(--blanco)', color: filtro === key ? 'var(--crema)' : 'var(--gris)', fontFamily: 'DM Sans, sans-serif' }}>
            {key === 'todos' ? `Todos (${registros.length})` : key === 'asistio' ? `Asistió (${registros.filter(r => r.asistio).length})` : `Pendiente (${registros.filter(r => !r.asistio).length})`}
          </button>
        ))}
      </div>

      {/* Lista */}
      <div style={{ background: 'var(--blanco)', border: '1px solid var(--crema3)', overflow: 'hidden' }}>
        {filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--gris-l)', fontSize: '0.82rem' }}>Sin resultados</div>
        )}
        {filtered.map((r, i) => (
          <div key={r.id}>
            {/* Fila */}
            <div style={{
              display: 'grid', gridTemplateColumns: '36px 1fr auto auto',
              gap: '0.75rem', alignItems: 'center',
              padding: '0.75rem 1rem',
              borderBottom: qrAbierto === r.id ? '1px solid var(--amarillo)' : '1px solid var(--crema3)',
              background: r.asistio ? '#f0fdf4' : i % 2 === 0 ? 'var(--blanco)' : 'var(--crema)',
              transition: 'background 0.2s',
            }}>
              {/* Toggle asistió */}
              <button onClick={() => toggleAsistio(r.id, r.asistio)} disabled={updating === r.id}
                title={r.asistio ? 'Quitar asistencia' : 'Marcar asistencia'}
                style={{ width: 28, height: 28, border: `2px solid ${r.asistio ? '#16a34a' : 'var(--crema3)'}`, background: r.asistio ? '#16a34a' : 'var(--blanco)', color: r.asistio ? '#fff' : 'var(--gris-l)', cursor: 'pointer', fontSize: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: updating === r.id ? 0.5 : 1, transition: 'all 0.2s', flexShrink: 0 }}>
                {r.asistio ? '✓' : ''}
              </button>

              {/* Info */}
              <div>
                <p style={{ fontWeight: 500, color: 'var(--negro)', fontSize: '0.85rem', marginBottom: '0.1rem' }}>{r.nombre}</p>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                  {r.empresa && <span style={{ fontSize: '0.7rem', color: 'var(--gris)' }}>{r.empresa}</span>}
                  {r.isla && <span style={{ fontSize: '0.58rem', background: 'var(--amarillo)', color: 'var(--negro)', padding: '0.05rem 0.35rem' }}>{r.isla}</span>}
                  {r.telefono && <span style={{ fontSize: '0.68rem', color: 'var(--gris-l)' }}>{r.telefono}</span>}
                </div>
              </div>

              {/* Bloques */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.2rem', maxWidth: 180 }}>
                {(r.bloques ?? []).map(b => (
                  <span key={b} style={{ fontSize: '0.52rem', background: 'var(--crema2)', color: 'var(--gris)', padding: '0.1rem 0.3rem', border: '1px solid var(--crema3)', whiteSpace: 'nowrap' }}>
                    {b.split('·')[0].trim().split('–')[0].trim()}
                  </span>
                ))}
              </div>

              {/* Botón QR */}
              <button
                onClick={() => setQrAbierto(qrAbierto === r.id ? null : r.id)}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
                  padding: '0.45rem 0.85rem',
                  border: `1px solid ${qrAbierto === r.id ? 'var(--negro)' : 'var(--crema3)'}`,
                  background: qrAbierto === r.id ? 'var(--negro)' : 'var(--blanco)',
                  color: qrAbierto === r.id ? 'var(--crema)' : 'var(--gris)',
                  cursor: 'pointer', fontSize: '0.65rem', letterSpacing: '0.15em',
                  textTransform: 'uppercase', fontFamily: 'DM Sans, sans-serif',
                  whiteSpace: 'nowrap', transition: 'all 0.2s',
                }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
                  <rect x="3" y="14" width="7" height="7"/>
                  <path d="M14 14h2v2h-2zM18 14h3v3h-3zM14 18h2v3h-2zM18 19h3v2h-3z"/>
                </svg>
                {qrAbierto === r.id ? 'Cerrar' : 'QR'}
              </button>
            </div>

            {/* QR expandido */}
            {qrAbierto === r.id && (
              <div style={{ padding: '1.25rem 1rem', background: 'var(--crema2)', borderBottom: '1px solid var(--crema3)', display: 'flex', justifyContent: 'center' }}>
                <QRInline registro={r} size={200} />
              </div>
            )}
          </div>
        ))}
      </div>

    </div>
  )
}
