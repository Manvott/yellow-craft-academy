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

// Genera canvas con layout de pegatina 7x2.5cm (escala 3x = 792x283px)
async function buildPegatinaCanvas(r: RegistroAcred): Promise<HTMLCanvasElement> {
  const SCALE  = 3          // 3x para buena resolución de impresión
  const W      = 264 * SCALE // 792px  (7cm a 96dpi × 3)
  const H      = 94  * SCALE // 282px  (2.5cm a 96dpi × 3)
  const PAD    = 8   * SCALE
  const QR_SZ  = H - PAD * 2

  // 1. Generar QR como dataURL
  const qrDataUrl = await QRCode.toDataURL(buildVCard(r), {
    width: QR_SZ,
    margin: 1,
    color: { dark: '#0A0A08', light: '#FFFFFF' },
  })

  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width  = W
      canvas.height = H
      const ctx = canvas.getContext('2d')!

      // Fondo blanco
      ctx.fillStyle = '#FFFFFF'
      ctx.fillRect(0, 0, W, H)

      // QR
      ctx.drawImage(img, PAD, PAD, QR_SZ, QR_SZ)

      // Divider
      const divX = PAD + QR_SZ + PAD
      ctx.strokeStyle = '#E0E0E0'
      ctx.lineWidth = 1 * SCALE
      ctx.beginPath()
      ctx.moveTo(divX, PAD * 2)
      ctx.lineTo(divX, H - PAD * 2)
      ctx.stroke()

      // Texto — área derecha
      const textX = divX + PAD * 1.5
      const maxW  = W - textX - PAD

      // Etiqueta evento (amarillo)
      ctx.fillStyle = '#D4A800'
      ctx.font = `600 ${8 * SCALE}px sans-serif`
      ctx.textAlign = 'left'
      ctx.fillText('YELLOW CRAFT ACADEMY · 15 JUN 2026', textX, PAD * 3.5, maxW)

      // Nombre (adaptado si es largo)
      const nombreFontSize = r.nombre.length > 22 ? 14 * SCALE : 18 * SCALE
      ctx.fillStyle = '#1A1A1A'
      ctx.font      = `bold ${nombreFontSize}px Georgia, serif`
      ctx.fillText(r.nombre, textX, PAD * 3.5 + 14 * SCALE + 6 * SCALE, maxW)

      // Isla
      if (r.isla) {
        ctx.fillStyle = '#555555'
        ctx.font      = `${8 * SCALE}px sans-serif`
        ctx.fillText(r.isla.toUpperCase(), textX, PAD * 3.5 + 14 * SCALE + 6 * SCALE + nombreFontSize * 0.7 + 6 * SCALE, maxW)
      }

      // Código
      const code = `#YCA-2026-${String(r.id).slice(-4).toUpperCase()}`
      ctx.fillStyle = '#BBBBBB'
      ctx.font      = `${6 * SCALE}px monospace`
      ctx.fillText(code, textX, H - PAD * 2, maxW)

      resolve(canvas)
    }
    img.src = qrDataUrl
  })
}

async function imprimirPegatina(r: RegistroAcred) {
  const canvas  = await buildPegatinaCanvas(r)
  const dataUrl = canvas.toDataURL('image/png')
  const win     = window.open('', '_blank', 'width=500,height=300')
  if (!win) return
  win.document.write(`<!DOCTYPE html><html><head>
    <title>Pegatina - ${r.nombre}</title>
    <style>
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body { display: flex; align-items: center; justify-content: center; min-height: 100vh; background: #f0f0f0; }
      .wrap { background: white; padding: 12px; box-shadow: 0 2px 12px rgba(0,0,0,0.15); }
      img { display: block; width: 264px; height: 94px; }
      @media print {
        body { background: white; }
        .wrap { padding: 0; box-shadow: none; }
        @page { size: 7cm 2.5cm; margin: 0; }
        img { width: 7cm; height: 2.5cm; }
      }
    </style>
  </head><body>
    <div class="wrap">
      <img src="${dataUrl}" />
    </div>
    <script>window.onload = () => { window.print(); window.onafterprint = () => window.close(); }<\/script>
  </body></html>`)
  win.document.close()
}

async function imprimirTodasPegatinas(registros: RegistroAcred[]) {
  const win = window.open('', '_blank', 'width=800,height=600')
  if (!win) return

  // Generar todas las imágenes en paralelo
  const canvases = await Promise.all(registros.map(r => buildPegatinaCanvas(r)))
  const dataUrls = canvases.map(c => c.toDataURL('image/png'))

  const items = registros.map((r, i) => `
    <div class="pegatina">
      <img src="${dataUrls[i]}" />
    </div>
  `).join('')

  win.document.write(`<!DOCTYPE html><html><head>
    <title>Pegatinas YCA 2026 — ${registros.length} asistentes</title>
    <style>
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body { background: #eee; padding: 20px; font-family: sans-serif; }
      h1 { font-size: 14px; color: #555; margin-bottom: 16px; letter-spacing: 0.2em; text-transform: uppercase; }
      .grid { display: flex; flex-wrap: wrap; gap: 8px; }
      .pegatina { background: white; box-shadow: 0 1px 4px rgba(0,0,0,0.15); }
      img { display: block; width: 264px; height: 94px; }
      @media print {
        body { background: white; padding: 0; }
        h1 { display: none; }
        .grid { gap: 4px; }
        .pegatina { box-shadow: none; page-break-inside: avoid; }
        img { width: 7cm; height: 2.5cm; }
        @page { margin: 0.5cm; }
      }
    </style>
  </head><body>
    <h1>Yellow Craft Academy 2026 &mdash; ${registros.length} pegatinas</h1>
    <div class="grid">${items}</div>
    <script>window.onload = () => { window.print(); window.onafterprint = () => window.close(); }<\/script>
  </body></html>`)
  win.document.close()
}

function QRInline({ registro, size = 150 }: { registro: RegistroAcred; size?: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (!canvasRef.current) return
    QRCode.toCanvas(canvasRef.current, buildVCard(registro), {
      width: size,
      margin: 2,
      color: { dark: '#0A0A08', light: '#FFFFFF' },
    })
  }, [registro, size])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', padding: '0.75rem', background: 'var(--blanco)', border: '1px solid var(--crema3)' }}>
      <canvas ref={canvasRef} style={{ display: 'block' }} />
      <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.3rem', fontWeight: 500, color: 'var(--negro)', textAlign: 'center', lineHeight: 1.2, marginTop: '0.4rem' }}>{registro.nombre}</p>
      {registro.empresa && <p style={{ fontSize: '0.9rem', color: 'var(--grafito)', textAlign: 'center', fontFamily: 'DM Sans, sans-serif' }}>{registro.empresa}</p>}
      {registro.isla && <span style={{ fontSize: '0.75rem', background: 'var(--amarillo)', color: 'var(--negro)', padding: '0.15rem 0.6rem', fontWeight: 600, fontFamily: 'DM Sans, sans-serif' }}>{registro.isla}</span>}
      <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.25rem' }}>
        <button onClick={() => imprimirPegatina(registro)}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', background: 'var(--negro)', color: 'var(--crema)', border: 'none', padding: '0.35rem 0.9rem', fontSize: '0.6rem', letterSpacing: '0.15em', textTransform: 'uppercase', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' }}>
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
          Imprimir pegatina
        </button>
      </div>
    </div>
  )
}

export default function AcreditacionClient({ registros }: Props) {
  const router   = useRouter()
  const [updating, setUpdating]   = useState<string | null>(null)
  const [search,   setSearch]     = useState('')
  const [filtro,   setFiltro]     = useState<'todos' | 'asistio' | 'pendiente'>('todos')
  const [qrAbierto, setQrAbierto] = useState<string | null>(null)
  const [printingAll, setPrintingAll] = useState(false)

  async function toggleAsistio(id: string, current: boolean) {
    setUpdating(id)
    const supabase = createClient()
    await supabase.from('registros').update({ asistio: !current }).eq('id', id)
    setUpdating(null)
    router.refresh()
  }

  const filtered = registros.filter(r => {
    const matchSearch  = r.nombre.toLowerCase().includes(search.toLowerCase()) ||
      (r.empresa ?? '').toLowerCase().includes(search.toLowerCase())
    const matchFiltro  = filtro === 'todos' ? true : filtro === 'asistio' ? r.asistio : !r.asistio
    return matchSearch && matchFiltro
  })

  async function handlePrintAll() {
    setPrintingAll(true)
    await imprimirTodasPegatinas(registros)
    setPrintingAll(false)
  }

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
        {/* Imprimir todas */}
        <button onClick={handlePrintAll} disabled={printingAll || registros.length === 0}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.45rem 1rem', fontSize: '0.68rem', letterSpacing: '0.1em', textTransform: 'uppercase', border: '1px solid var(--negro)', cursor: 'pointer', background: 'var(--negro)', color: 'var(--crema)', fontFamily: 'DM Sans, sans-serif', opacity: printingAll ? 0.6 : 1 }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
          {printingAll ? 'Generando...' : `Imprimir todas (${registros.length})`}
        </button>
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

              {/* Botones QR + Pegatina */}
              <div style={{ display: 'flex', gap: '0.4rem' }}>
                <button
                  onClick={() => setQrAbierto(qrAbierto === r.id ? null : r.id)}
                  title="Ver QR para escanear"
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
                    padding: '0.45rem 0.75rem',
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
                  QR
                </button>
                <button
                  onClick={() => imprimirPegatina(r)}
                  title="Imprimir pegatina 7x2.5cm"
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
                    padding: '0.45rem 0.75rem',
                    border: '1px solid var(--crema3)',
                    background: 'var(--blanco)',
                    color: 'var(--gris)',
                    cursor: 'pointer', fontSize: '0.65rem', letterSpacing: '0.15em',
                    textTransform: 'uppercase', fontFamily: 'DM Sans, sans-serif',
                    whiteSpace: 'nowrap',
                  }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
                  Pegatina
                </button>
              </div>
            </div>

            {/* QR expandido para escanear */}
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
