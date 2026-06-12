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

      // Nombre dividido: primera palabra = nombre, resto = apellidos
      const partes = r.nombre.trim().split(/\s+/)
      const primerNombre = partes[0]
      const apellidos    = partes.slice(1).join(' ')

      const nombreY   = H / 2 - 8 * SCALE
      const apellidoY = nombreY + 18 * SCALE

      ctx.fillStyle = '#1A1A1A'
      ctx.font      = `bold ${18 * SCALE}px Georgia, serif`
      ctx.fillText(primerNombre, textX, nombreY, maxW)

      if (apellidos) {
        ctx.fillStyle = '#1A1A1A'
        ctx.font      = `${13 * SCALE}px Georgia, serif`
        ctx.fillText(apellidos, textX, apellidoY, maxW)
      }

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

  // Construir filas de tabla con 2 columnas
  const rows: string[] = []
  for (let i = 0; i < registros.length; i += 2) {
    const td1 = `<td><img src="${dataUrls[i]}" /></td>`
    const td2 = i + 1 < registros.length ? `<td><img src="${dataUrls[i + 1]}" /></td>` : '<td></td>'
    rows.push(`<tr>${td1}${td2}</tr>`)
  }
  const tabla = `<table>${rows.join('')}</table>`

  win.document.write(`<!DOCTYPE html><html><head>
    <title>Pegatinas YCA 2026 — ${registros.length} asistentes</title>
    <style>
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body { background: #ddd; padding: 24px; font-family: sans-serif; }
      h1 { font-size: 12px; color: #666; margin-bottom: 20px; letter-spacing: 0.2em; text-transform: uppercase; }
      table { border-collapse: collapse; }
      td {
        border: 1px solid #E0E0E0;
        padding: 6px;
        background: #f5f5f5;
      }
      td img { display: block; width: 264px; height: 94px; }
      @media print {
        body { background: white; padding: 0.4cm; }
        h1 { display: none; }
        table { border-collapse: collapse; }
        td {
          border: 1px solid #E0E0E0;
          padding: 4px;
          background: white;
          page-break-inside: avoid;
        }
        td img { width: 7cm; height: 2.5cm; }
        @page { margin: 0.4cm; }
      }
    </style>
  </head><body>
    <h1>Yellow Craft Academy 2026 &mdash; ${registros.length} pegatinas</h1>
    ${tabla}
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

const TARDEO_VALUE = '18:00 – 21:00h · Tardeo · cóctel · atardecer'
const esSoloTardeo = (r: RegistroAcred) => {
  const b = r.bloques ?? []
  return b.length === 1 && b[0] === TARDEO_VALUE
}

export default function AcreditacionClient({ registros }: Props) {
  const router   = useRouter()
  const [updating, setUpdating]   = useState<string | null>(null)
  const [search,   setSearch]     = useState('')
  const [filtro,   setFiltro]     = useState<'todos' | 'asistio' | 'pendiente' | 'solo-tardeo'>('todos')
  const [qrAbierto, setQrAbierto] = useState<string | null>(null)
  const [printingAll, setPrintingAll] = useState(false)
  const [printingSinTardeo, setPrintingSinTardeo] = useState(false)

  async function toggleAsistio(id: string, current: boolean) {
    setUpdating(id)
    const supabase = createClient()
    await supabase.from('registros').update({ asistio: !current }).eq('id', id)
    setUpdating(null)
    router.refresh()
  }

  const soloTardeoCount = registros.filter(esSoloTardeo).length

  const filtered = registros.filter(r => {
    const matchSearch  = r.nombre.toLowerCase().includes(search.toLowerCase()) ||
      (r.empresa ?? '').toLowerCase().includes(search.toLowerCase())
    const matchFiltro  =
      filtro === 'asistio'     ? r.asistio :
      filtro === 'pendiente'   ? !r.asistio :
      filtro === 'solo-tardeo' ? esSoloTardeo(r) :
      true
    return matchSearch && matchFiltro
  })

  async function handlePrintAll() {
    setPrintingAll(true)
    await imprimirTodasPegatinas(registros)
    setPrintingAll(false)
  }

  async function handlePrintSinTardeo() {
    setPrintingSinTardeo(true)
    await imprimirTodasPegatinas(registros.filter(r => !esSoloTardeo(r)))
    setPrintingSinTardeo(false)
  }

  return (
    <div>
      {/* Controles */}
      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '1.5rem', alignItems: 'center' }}>
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Buscar por nombre o empresa..."
          style={{ flex: '1 1 200px', background: 'var(--blanco)', border: '1px solid var(--crema3)', color: 'var(--grafito)', padding: '0.65rem 1rem', fontFamily: 'DM Sans, sans-serif', fontSize: '0.82rem', outline: 'none' }}
        />
        {([
          { key: 'todos',       label: `Todos (${registros.length})` },
          { key: 'solo-tardeo', label: `Solo tardeo (${soloTardeoCount})` },
          { key: 'asistio',     label: `Asistió (${registros.filter(r => r.asistio).length})` },
          { key: 'pendiente',   label: `Pendiente (${registros.filter(r => !r.asistio).length})` },
        ] as const).map(({ key, label }) => (
          <button key={key} onClick={() => setFiltro(key)}
            style={{ padding: '0.45rem 0.9rem', fontSize: '0.68rem', letterSpacing: '0.1em', textTransform: 'uppercase', border: `1px solid ${key === 'solo-tardeo' ? '#d97706' : 'var(--crema3)'}`, cursor: 'pointer', background: filtro === key ? (key === 'solo-tardeo' ? '#d97706' : 'var(--negro)') : 'var(--blanco)', color: filtro === key ? '#fff' : (key === 'solo-tardeo' ? '#d97706' : 'var(--gris)'), fontFamily: 'DM Sans, sans-serif' }}>
            {label}
          </button>
        ))}
        {/* Imprimir sin tardeo */}
        {(() => { const sinTardeo = registros.filter(r => !esSoloTardeo(r)); return (
        <button onClick={handlePrintSinTardeo} disabled={printingSinTardeo || sinTardeo.length === 0}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.45rem 1rem', fontSize: '0.68rem', letterSpacing: '0.1em', textTransform: 'uppercase', border: '1px solid var(--negro)', cursor: 'pointer', background: 'var(--blanco)', color: 'var(--negro)', fontFamily: 'DM Sans, sans-serif', opacity: printingSinTardeo ? 0.6 : 1 }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
          {printingSinTardeo ? 'Generando...' : `Imprimir sin tardeo (${sinTardeo.length})`}
        </button>
        ); })()}
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
              display: 'grid', gridTemplateColumns: '28px 1fr auto',
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
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.1rem' }}>
                  <p style={{ fontWeight: 500, color: 'var(--negro)', fontSize: '0.85rem', margin: 0 }}>{r.nombre}</p>
                  {esSoloTardeo(r) && (
                    <span style={{ fontSize: '0.5rem', letterSpacing: '0.1em', textTransform: 'uppercase', background: '#fef3c7', color: '#b45309', padding: '0.1rem 0.35rem', flexShrink: 0, fontFamily: 'DM Sans, sans-serif', fontWeight: 600, border: '1px solid #fcd34d' }}>Tardeo</span>
                  )}
                  {r.origen === 'admin' && (
                    <span style={{ fontSize: '0.5rem', letterSpacing: '0.1em', textTransform: 'uppercase', background: '#f3e8ff', color: '#7c3aed', padding: '0.1rem 0.35rem', flexShrink: 0, fontFamily: 'DM Sans, sans-serif', fontWeight: 600, border: '1px solid #ddd6fe' }}>Admin</span>
                  )}
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                  {r.empresa && <span style={{ fontSize: '0.7rem', color: 'var(--gris)' }}>{r.empresa}</span>}
                  {r.isla && <span style={{ fontSize: '0.58rem', background: 'var(--amarillo)', color: 'var(--negro)', padding: '0.05rem 0.35rem' }}>{r.isla}</span>}
                  {r.telefono && <span style={{ fontSize: '0.68rem', color: 'var(--gris-l)' }}>{r.telefono}</span>}
                </div>
              </div>

              {/* Bloques + Botones QR + Pegatina */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', alignItems: 'center' }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.2rem' }}>
                  {(r.bloques ?? []).map(b => (
                    <span key={b} style={{ fontSize: '0.52rem', background: 'var(--crema2)', color: 'var(--gris)', padding: '0.1rem 0.3rem', border: '1px solid var(--crema3)', whiteSpace: 'nowrap' }}>
                      {b.split('·')[0].trim().split('–')[0].trim()}
                    </span>
                  ))}
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
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
