'use client'

export default function DescargarExcelBtn() {
  return (
    <button
      onClick={() => { window.location.href = `/api/download/asistentes?t=${Date.now()}` }}
      style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'var(--negro)', color: 'var(--crema)', padding: '0.7rem 1.4rem', fontSize: '0.68rem', letterSpacing: '0.2em', textTransform: 'uppercase', fontWeight: 500, border: 'none', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' }}
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
      Descargar Excel
    </button>
  )
}
