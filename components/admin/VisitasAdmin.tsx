'use client'

import { useState, useMemo } from 'react'

interface Visita {
  id: string
  ruta: string
  referrer: string | null
  dispositivo: string | null
  navegador: string | null
  locale: string | null
  visitor_id: string | null
  created_at: string
}

interface Props { visitas: Visita[] }

const FECHA_EVENTO = '2026-06-15'

function dia(iso: string) { return iso.slice(0, 10) }

function fmtFecha(iso: string) {
  const d = new Date(iso)
  return d.toLocaleString('es-ES', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
}

function nombreRuta(ruta: string) {
  const sin = ruta.replace(/^\/(es|en)/, '') || '/'
  if (sin === '/' || sin === '') return 'Catálogo (inicio)'
  if (sin.startsWith('/fotos/tv')) return 'Carrusel TV'
  if (sin.startsWith('/fotos')) return 'Fotos'
  if (sin.startsWith('/pildoras')) return 'Píldoras'
  if (sin.startsWith('/evento')) return 'Evento'
  return sin
}

export default function VisitasAdmin({ visitas }: Props) {
  const [soloPostEvento, setSoloPostEvento] = useState(false)
  const [desde, setDesde] = useState('')
  const [hasta, setHasta] = useState('')

  const filtradas = useMemo(() => {
    return visitas.filter(v => {
      const d = dia(v.created_at)
      if (soloPostEvento && d <= FECHA_EVENTO) return false
      if (desde && d < desde) return false
      if (hasta && d > hasta) return false
      return true
    })
  }, [visitas, soloPostEvento, desde, hasta])

  const stats = useMemo(() => {
    const hoy = new Date().toISOString().slice(0, 10)
    const hace7 = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10)
    const unicos = new Set(filtradas.map(v => v.visitor_id ?? v.id)).size
    const hoyN = filtradas.filter(v => dia(v.created_at) === hoy).length
    const semana = filtradas.filter(v => dia(v.created_at) >= hace7).length
    const postEvento = filtradas.filter(v => dia(v.created_at) > FECHA_EVENTO).length

    const porDia = new Map<string, number>()
    const porRuta = new Map<string, number>()
    const porDisp = new Map<string, number>()
    for (const v of filtradas) {
      porDia.set(dia(v.created_at), (porDia.get(dia(v.created_at)) ?? 0) + 1)
      const nr = nombreRuta(v.ruta)
      porRuta.set(nr, (porRuta.get(nr) ?? 0) + 1)
      const dp = v.dispositivo ?? 'desconocido'
      porDisp.set(dp, (porDisp.get(dp) ?? 0) + 1)
    }
    const dias = Array.from(porDia.entries()).sort((a, b) => b[0].localeCompare(a[0])).slice(0, 30)
    const rutas = Array.from(porRuta.entries()).sort((a, b) => b[1] - a[1])
    const disp = Array.from(porDisp.entries()).sort((a, b) => b[1] - a[1])
    const maxDia = Math.max(1, ...dias.map(d => d[1]))

    return { total: filtradas.length, unicos, hoyN, semana, postEvento, dias, rutas, disp, maxDia }
  }, [filtradas])

  const kpi = (label: string, valor: number | string, color?: string) => (
    <div style={{ background: 'var(--blanco)', border: '1px solid var(--crema3)', padding: '1.2rem 1.4rem', flex: '1 1 140px' }}>
      <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '2rem', fontWeight: 300, color: color ?? 'var(--negro)', lineHeight: 1 }}>{valor}</div>
      <div style={{ fontSize: '0.62rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--gris)', marginTop: '0.4rem', fontFamily: 'DM Sans, sans-serif' }}>{label}</div>
    </div>
  )

  return (
    <div style={{ fontFamily: 'DM Sans, sans-serif' }}>
      {/* Filtros */}
      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center', marginBottom: '1.5rem' }}>
        <button onClick={() => setSoloPostEvento(o => !o)}
          style={{ padding: '0.5rem 1.1rem', fontSize: '0.7rem', letterSpacing: '0.1em', textTransform: 'uppercase', border: `1px solid ${soloPostEvento ? '#16a34a' : 'var(--crema3)'}`, cursor: 'pointer', background: soloPostEvento ? '#16a34a' : 'var(--blanco)', color: soloPostEvento ? '#fff' : 'var(--gris)' }}>
          Solo después del evento
        </button>
        <label style={{ fontSize: '0.7rem', color: 'var(--gris)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          Desde <input type="date" value={desde} onChange={e => setDesde(e.target.value)} style={{ border: '1px solid var(--crema3)', padding: '0.35rem 0.5rem', fontFamily: 'DM Sans, sans-serif', fontSize: '0.75rem' }} />
        </label>
        <label style={{ fontSize: '0.7rem', color: 'var(--gris)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          Hasta <input type="date" value={hasta} onChange={e => setHasta(e.target.value)} style={{ border: '1px solid var(--crema3)', padding: '0.35rem 0.5rem', fontFamily: 'DM Sans, sans-serif', fontSize: '0.75rem' }} />
        </label>
        {(desde || hasta || soloPostEvento) && (
          <button onClick={() => { setDesde(''); setHasta(''); setSoloPostEvento(false) }}
            style={{ padding: '0.5rem 0.9rem', fontSize: '0.68rem', border: 'none', background: 'none', color: 'var(--gris)', cursor: 'pointer', textDecoration: 'underline' }}>
            Limpiar
          </button>
        )}
      </div>

      {/* KPIs */}
      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '2rem' }}>
        {kpi('Visitas totales', stats.total)}
        {kpi('Visitantes únicos', stats.unicos)}
        {kpi('Hoy', stats.hoyN)}
        {kpi('Últimos 7 días', stats.semana)}
        {kpi('Tras el evento', stats.postEvento, stats.postEvento > 0 ? '#16a34a' : 'var(--gris-l)')}
      </div>

      {stats.total === 0 ? (
        <p style={{ color: 'var(--gris)', padding: '3rem 0', textAlign: 'center', fontSize: '0.85rem' }}>
          Sin visitas registradas en este periodo.
        </p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
          {/* Por día */}
          <div style={{ background: 'var(--blanco)', border: '1px solid var(--crema3)', padding: '1.3rem' }}>
            <h3 style={{ fontSize: '0.68rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--gris)', marginBottom: '1rem' }}>Visitas por día</h3>
            {stats.dias.map(([d, n]) => (
              <div key={d} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.45rem' }}>
                <span style={{ fontSize: '0.68rem', color: 'var(--grafito)', width: 70, flexShrink: 0 }}>{d.slice(5)}</span>
                <div style={{ flex: 1, height: 14, background: 'var(--crema2)' }}>
                  <div style={{ height: '100%', width: `${(n / stats.maxDia) * 100}%`, background: d > FECHA_EVENTO ? '#16a34a' : 'var(--amarillo)' }} />
                </div>
                <span style={{ fontSize: '0.72rem', color: 'var(--negro)', width: 32, textAlign: 'right' }}>{n}</span>
              </div>
            ))}
          </div>

          {/* Por página + dispositivo */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ background: 'var(--blanco)', border: '1px solid var(--crema3)', padding: '1.3rem' }}>
              <h3 style={{ fontSize: '0.68rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--gris)', marginBottom: '1rem' }}>Por página</h3>
              {stats.rutas.map(([r, n]) => (
                <div key={r} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', padding: '0.3rem 0', borderBottom: '1px solid var(--crema2)' }}>
                  <span style={{ color: 'var(--grafito)' }}>{r}</span>
                  <strong style={{ color: 'var(--negro)' }}>{n}</strong>
                </div>
              ))}
            </div>
            <div style={{ background: 'var(--blanco)', border: '1px solid var(--crema3)', padding: '1.3rem' }}>
              <h3 style={{ fontSize: '0.68rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--gris)', marginBottom: '1rem' }}>Por dispositivo</h3>
              {stats.disp.map(([d, n]) => (
                <div key={d} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', padding: '0.3rem 0', borderBottom: '1px solid var(--crema2)' }}>
                  <span style={{ color: 'var(--grafito)', textTransform: 'capitalize' }}>{d}</span>
                  <strong style={{ color: 'var(--negro)' }}>{n}</strong>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Últimas visitas */}
      {stats.total > 0 && (
        <div style={{ background: 'var(--blanco)', border: '1px solid var(--crema3)' }}>
          <h3 style={{ fontSize: '0.68rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--gris)', padding: '1rem 1.3rem', borderBottom: '1px solid var(--crema3)' }}>Últimas visitas</h3>
          <div style={{ maxHeight: 420, overflowY: 'auto' }}>
            {filtradas.slice(0, 200).map(v => (
              <div key={v.id} style={{ display: 'grid', gridTemplateColumns: '110px 1fr 90px 80px', gap: '0.5rem', alignItems: 'center', fontSize: '0.72rem', padding: '0.55rem 1.3rem', borderBottom: '1px solid var(--crema2)' }}>
                <span style={{ color: 'var(--gris)' }}>{fmtFecha(v.created_at)}</span>
                <span style={{ color: 'var(--grafito)' }}>{nombreRuta(v.ruta)}</span>
                <span style={{ color: 'var(--gris)', textTransform: 'capitalize' }}>{v.dispositivo ?? '—'}</span>
                <span style={{ color: 'var(--gris-l)' }}>{v.navegador ?? '—'}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
