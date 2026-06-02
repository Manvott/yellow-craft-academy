import AjustesAdmin from '@/components/admin/AjustesAdmin'

export default function AjustesPage() {
  return (
    <div>
      <p style={{ fontSize: '0.6rem', letterSpacing: '0.4em', textTransform: 'uppercase', color: 'var(--gris)', marginBottom: '0.5rem', fontFamily: 'DM Sans, sans-serif' }}>
        Cuenta y acceso
      </p>
      <h1 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '2rem', fontWeight: 300, color: 'var(--negro)', marginBottom: '2.5rem', lineHeight: 1 }}>
        Ajustes
      </h1>
      <AjustesAdmin />
    </div>
  )
}
