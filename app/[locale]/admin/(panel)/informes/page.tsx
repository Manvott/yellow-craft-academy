import { createClient } from '@/lib/supabase/server'

export default async function InformesPage() {
  let stats = { inscritos: 0, asistieron: 0, productos: 0, solicitudes: 0, marcas: 0 }
  try {
    const supabase = await createClient()
    const [r, p, s, m] = await Promise.all([
      supabase.from('registros').select('*', { count: 'exact', head: true }),
      supabase.from('productos').select('*', { count: 'exact', head: true }),
      supabase.from('solicitudes_info').select('*', { count: 'exact', head: true }),
      supabase.from('proveedores').select('*', { count: 'exact', head: true }),
    ])
    const { data: asist } = await supabase.from('registros').select('asistio').eq('asistio', true)
    stats = { inscritos: r.count ?? 0, asistieron: asist?.length ?? 0, productos: p.count ?? 0, solicitudes: s.count ?? 0, marcas: m.count ?? 0 }
  } catch {}

  const informes = [
    {
      tipo: 'resumen',
      titulo: 'Resumen ejecutivo',
      desc: 'Estadísticas clave del evento: inscritos, asistencia, por isla, catálogo y solicitudes en una sola hoja.',
      icono: '📊',
      color: 'var(--amarillo)',
    },
    {
      tipo: 'inscritos',
      titulo: 'Listado completo de inscritos',
      desc: 'Todos los datos de cada inscrito: nombre, empresa, isla, perfil, contacto, bloques, estado WA y asistencia.',
      icono: '👥',
      color: 'var(--crema2)',
    },
    {
      tipo: 'asistencia',
      titulo: 'Control de asistencia',
      desc: 'Lista simplificada con el estado de asistencia al evento por cada inscrito.',
      icono: '✓',
      color: 'var(--crema2)',
    },
    {
      tipo: 'por-isla',
      titulo: 'Análisis por isla',
      desc: 'Resumen de inscritos por isla + una pestaña de detalle por cada isla de Canarias.',
      icono: '🏝️',
      color: 'var(--crema2)',
    },
    {
      tipo: 'por-perfil',
      titulo: 'Análisis por perfil profesional',
      desc: 'Distribución de asistentes por tipo de negocio (chef, pastelero, hotel, restaurante...)',
      icono: '👔',
      color: 'var(--crema2)',
    },
    {
      tipo: 'por-bloque',
      titulo: 'Análisis por bloque / ponencia',
      desc: 'Cuántas personas seleccionaron cada bloque del programa y cuántas asistieron.',
      icono: '🕐',
      color: 'var(--crema2)',
    },
    {
      tipo: 'solicitudes',
      titulo: 'Solicitudes de información de producto',
      desc: 'Qué productos pidieron los asistentes, quién los pidió y datos de contacto.',
      icono: '📩',
      color: 'var(--crema2)',
    },
    {
      tipo: 'productos',
      titulo: 'Catálogo de productos',
      desc: 'Todos los productos del evento con marca, categoría, costes y estado de publicación.',
      icono: '📦',
      color: 'var(--crema2)',
    },
    {
      tipo: 'menu',
      titulo: 'Menú — Ingredientes y escandallo',
      desc: 'Todos los productos con sus ingredientes, cantidades y unidades de medida registrados en el módulo Menú.',
      icono: '🍽️',
      color: 'var(--crema2)',
    },
  ]

  return (
    <div>
      <p style={{ fontSize: '0.6rem', letterSpacing: '0.4em', textTransform: 'uppercase', color: 'var(--gris)', marginBottom: '0.4rem', fontFamily: 'DM Sans, sans-serif' }}>
        Exportar datos
      </p>
      <h1 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '2rem', fontWeight: 300, color: 'var(--negro)', marginBottom: '0.5rem', lineHeight: 1 }}>
        Informes
      </h1>
      <p style={{ fontSize: '0.78rem', color: 'var(--gris)', marginBottom: '2rem', fontFamily: 'DM Sans, sans-serif' }}>
        Descarga los datos del evento en formato Excel (.xlsx). Cada informe incluye los datos más recientes.
      </p>

      {/* Resumen rápido */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '0.75rem', marginBottom: '2.5rem' }}>
        {[
          ['Inscritos', stats.inscritos],
          ['Asistieron', stats.asistieron],
          ['Marcas', stats.marcas],
          ['Productos', stats.productos],
          ['Solicitudes', stats.solicitudes],
        ].map(([label, val]) => (
          <div key={label} style={{ background: 'var(--blanco)', border: '1px solid var(--crema3)', padding: '1rem', textAlign: 'center' }}>
            <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '2.5rem', fontWeight: 300, color: 'var(--negro)', lineHeight: 1 }}>{val}</p>
            <p style={{ fontSize: '0.65rem', color: 'var(--gris)', marginTop: '0.25rem', fontFamily: 'DM Sans, sans-serif', letterSpacing: '0.1em', textTransform: 'uppercase' }}>{label}</p>
          </div>
        ))}
      </div>

      {/* ── INFORMES EXCEL ── */}
      {/* Grid de informes */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
        {informes.map(inf => (
          <div key={inf.tipo} style={{ background: inf.color, border: '1px solid var(--crema3)', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
              <span style={{ fontSize: '1.5rem', flexShrink: 0 }}>{inf.icono}</span>
              <div>
                <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.1rem', fontWeight: 400, color: 'var(--negro)', lineHeight: 1.2 }}>{inf.titulo}</p>
                <p style={{ fontSize: '0.75rem', color: 'var(--gris)', lineHeight: 1.6, marginTop: '0.35rem', fontFamily: 'DM Sans, sans-serif' }}>{inf.desc}</p>
              </div>
            </div>
            <a
              href={`/api/export/informes?tipo=${inf.tipo}`}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
                background: 'var(--negro)', color: 'var(--crema)',
                padding: '0.65rem 1.25rem',
                fontSize: '0.68rem', letterSpacing: '0.18em', textTransform: 'uppercase',
                fontWeight: 500, textDecoration: 'none', fontFamily: 'DM Sans, sans-serif',
                alignSelf: 'flex-start', marginTop: 'auto',
              }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
                <polyline points="7 10 12 15 17 10"/>
                <line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
              Descargar Excel
            </a>
          </div>
        ))}
      </div>
    </div>
  )
}
