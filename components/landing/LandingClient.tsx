'use client'

import { useRef, useState, useTransition } from 'react'
import Link from 'next/link'
import { registrarAsistente } from '@/app/actions/registros'

interface Props { locale: string }

const BLOQUES = [
  { value: '10:00 – 12:00h · Edu Azuaza · SOSA', hora: '10:00 – 12:00h', nombre: 'Ponencia · Edu Azuaza · SOSA', sub: 'Ingredientes técnicos en la cocina contemporánea' },
  { value: '12:00 – 13:30h · Brunch con producto', hora: '12:00 – 13:30h', nombre: 'Brunch con producto en escena', sub: 'Networking · portfolio AVA en mesa' },
  { value: '14:00 – 16:00h · Alexis García · 100×100', hora: '14:00 – 16:00h', nombre: 'Ponencia · Alexis García · 100×100 Alexis', sub: 'La alquimia de la masa' },
  { value: '16:30 – 17:30h · Óscar Lafuente · Ron Arehucas', hora: '16:30 – 17:30h', nombre: 'Ponencia · Óscar Lafuente · Ron Arehucas', sub: 'El Atlántico en copa · coctelería y maridaje' },
  { value: '18:00 – 21:00h · Tardeo · cóctel · atardecer', hora: '18:00 – 21:00h', nombre: 'Tardeo · cóctel · atardecer', sub: 'Cierre experiencial · gastronomía y música' },
]

const PONENTES = [
  { num: '01', marca: 'SOSA · Director Técnico', nombre: 'Edu Azuaza', resultado: 'Vas a entender por qué dos elaboraciones con los mismos ingredientes pueden dar resultados completamente distintos — y cómo usar esa diferencia a tu favor desde el día siguiente.', para: 'Para quienes trabajan por intuición y para quienes lo hacen por fórmula. Los dos van a salir con nuevas herramientas.', hora: '10:00 – 12:00h' },
  { num: '02', marca: '100×100 ALEXIS', nombre: 'Alexis García', resultado: 'Vas a entender la química que hay detrás de cada masa — por qué los ingredientes reaccionan entre sí de una manera y no de otra, y cómo usar esa lógica para tomar decisiones en tu obrador.', para: 'No importa si haces pan, hojaldre o pastelería. La magia es la misma. Entenderla lo cambia todo.', hora: '14:00 – 16:00h' },
  { num: '03', marca: 'RON AREHUCAS · Coctelería atlántica', nombre: 'Óscar Lafuente', resultado: 'Vas a entender cómo el territorio se convierte en argumento de venta — y cómo aplicar esa lógica a tu producto, sea un cóctel, un pan o un plato.', para: 'Una ponencia sobre identidad, narrativa y producto. Más transversal de lo que parece.', hora: '16:30 – 17:30h' },
]

const JORNADA = [
  { hora: '9:30h', titulo: 'Bienvenida y café', ponente: null, desc: 'Llegada, primer contacto con el espacio y con el producto. Momento para orientarse antes de empezar.', tipo: 'outline' },
  { hora: '10:00h', titulo: 'Ingredientes técnicos en la cocina contemporánea', ponente: 'Edu Azuaza · SOSA', desc: 'Entenderás qué hay detrás de los ingredientes que cambian el resultado de una elaboración.', resultado: 'Al salir: sabrás qué ingredientes incorporar, para qué y cómo argumentarlo ante tu cliente.', tipo: 'pill' },
  { hora: '12:00h', titulo: 'Brunch con producto en escena', ponente: null, desc: 'El portfolio de AVA en mesa para verlo, probarlo y entenderlo en contexto.', tipo: 'pill-alt' },
  { hora: '14:00h', titulo: 'La alquimia de la masa', ponente: 'Alexis García · 100×100 Alexis', desc: 'La química entre los ingredientes de cualquier masa — pan, hojaldre, pastelería.', resultado: 'Al salir: entenderás por qué tu masa se comporta como se comporta.', tipo: 'pill' },
  { hora: '16:00h', titulo: 'Pausa · producto y café', ponente: null, desc: 'Momento de descanso entre bloques.', tipo: 'outline' },
  { hora: '16:30h', titulo: 'El Atlántico en copa', ponente: 'Óscar Lafuente · Ron Arehucas', desc: 'Territorio, identidad y producto. Cómo el origen se convierte en argumento de venta.', resultado: 'Al salir: una manera diferente de hablar de tu producto.', tipo: 'pill' },
  { hora: '18:00h', titulo: 'Tardeo · cóctel · atardecer', ponente: null, desc: 'Cierre experiencial con gastronomía, coctelería atlántica y música.', tipo: 'pill-alt' },
]

// ── Estilos base ──────────────────────────────────────────────────────────────
const S = {
  eyebrow: { fontSize: '0.62rem', letterSpacing: '0.4em', textTransform: 'uppercase' as const, color: 'var(--gris)', fontFamily: 'DM Sans, sans-serif' },
  sectionTitle: { fontFamily: 'Cormorant Garamond, serif', fontWeight: 300, lineHeight: 1.05, color: 'var(--negro)' },
  input: {
    background: 'var(--blanco)', border: '1px solid var(--crema3)', color: 'var(--grafito)',
    padding: '0.95rem 1.2rem', fontFamily: 'DM Sans, sans-serif', fontSize: '0.85rem',
    fontWeight: 300, outline: 'none', width: '100%',
  } as React.CSSProperties,
}

function YCLogo({ size = 36 }: { size?: number }) {
  return (
    <svg viewBox="0 0 560 560" xmlns="http://www.w3.org/2000/svg" style={{ width: size, height: size }}>
      <circle cx="280" cy="280" r="268" fill="#F0EAE0" />
      <circle cx="280" cy="92" r="32" fill="#F5C518" />
      <text x="280" y="242" fontFamily="Helvetica Neue, Arial, sans-serif" fontSize="72" fontWeight="200" letterSpacing="7" fill="#0A0A08" textAnchor="middle" dominantBaseline="middle">YELLOW</text>
      <text x="280" y="318" fontFamily="Helvetica Neue, Arial, sans-serif" fontSize="60" fontWeight="600" letterSpacing="14" fill="#0A0A08" textAnchor="middle" dominantBaseline="middle">CRAFT</text>
      <text x="280" y="378" fontFamily="Helvetica Neue, Arial, sans-serif" fontSize="18" fontWeight="400" letterSpacing="9" fill="#0A0A08" textAnchor="middle" dominantBaseline="middle" opacity="0.38">ACADEMY</text>
    </svg>
  )
}

function RegistroForm() {
  const [isPending, startTransition] = useTransition()
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const [nombreInscrito, setNombreInscrito] = useState('')
  const [islaInscrito, setIslaInscrito] = useState('')
  const formRef = useRef<HTMLFormElement>(null)

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    setNombreInscrito(fd.get('nombre') as string)
    setIslaInscrito(fd.get('isla') as string || '')
    startTransition(async () => {
      const result = await registrarAsistente(fd)
      if (result.ok) {
        setSuccess(true)
      } else {
        setError(result.error ?? 'Error al enviar.')
      }
    })
  }

  if (success) {
    const etiqueta = islaInscrito ? `${nombreInscrito} - ${islaInscrito}` : nombreInscrito
    const waText = encodeURIComponent(`Hola, me acabo de inscribir en Yellow Craft Academy (15 jun). Soy ${etiqueta}. Confirmo que acepto recibir información del evento por WhatsApp.`)
    const waUrl = `https://wa.me/34608649038?text=${waText}`

    return (
      <div style={{ padding: '2.5rem 0' }}>
        {/* Cabecera */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
          <div style={{ width: 48, height: 48, background: 'var(--amarillo)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '1.3rem' }}>✓</div>
          <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '2rem', fontWeight: 300, color: 'var(--negro)', lineHeight: 1 }}>
            ¡Estás inscrito!
          </p>
        </div>
        <p style={{ fontSize: '0.87rem', color: 'var(--gris)', lineHeight: 1.85, marginBottom: '1.5rem' }}>
          Enhorabuena, tu plaza está reservada.
        </p>

        {/* Dirección */}
        <div style={{ padding: '1.25rem 1.5rem', background: 'var(--amarillo)', marginBottom: '1.25rem' }}>
          <p style={{ fontSize: '0.62rem', letterSpacing: '0.3em', textTransform: 'uppercase', color: 'var(--negro)', marginBottom: '0.4rem', fontFamily: 'DM Sans, sans-serif' }}>
            Recuerda la dirección del evento
          </p>
          <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.25rem', fontWeight: 400, color: 'var(--negro)', lineHeight: 1.4 }}>
            Sala Ocean · Puerto del Carmen · Lanzarote
          </p>
          <p style={{ fontSize: '0.78rem', color: 'var(--grafito)', marginTop: '0.4rem', fontFamily: 'DM Sans, sans-serif' }}>
            15 de junio de 2026 · 9:30h – 21:00h
          </p>
        </div>

        {/* Botón WhatsApp — paso obligatorio para la lista de difusión */}
        <div style={{ padding: '1.25rem 1.5rem', background: 'var(--blanco)', border: '1px solid var(--crema3)', marginBottom: '1.25rem' }}>
          <p style={{ fontSize: '0.62rem', letterSpacing: '0.3em', textTransform: 'uppercase', color: 'var(--gris)', marginBottom: '0.6rem', fontFamily: 'DM Sans, sans-serif' }}>
            Último paso
          </p>
          <p style={{ fontSize: '0.85rem', color: 'var(--negro)', lineHeight: 1.65, marginBottom: '1rem' }}>
            Para añadirte a la lista de difusión de WhatsApp, pulsa el botón y envía el mensaje que aparece ya escrito.
          </p>
          <a
            href={waUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.75rem',
              background: '#25D366', color: '#fff',
              padding: '0.85rem 1.5rem',
              fontSize: '0.78rem', fontWeight: 500, letterSpacing: '0.05em',
              textDecoration: 'none', fontFamily: 'DM Sans, sans-serif',
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
            Unirme al canal de WhatsApp
          </a>
        </div>

        {/* Google Maps */}
        <a
          href="https://maps.google.com/?q=Sala+Ocean+Puerto+del+Carmen+Lanzarote"
          target="_blank"
          rel="noopener noreferrer"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.72rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--negro)', textDecoration: 'none', borderBottom: '1px solid var(--crema3)', paddingBottom: 2 }}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/><circle cx="12" cy="9" r="2.5"/></svg>
          Ver en Google Maps →
        </a>
      </div>
    )
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      <input name="nombre" placeholder="Nombre y apellidos" required style={S.input} />
      <input name="empresa" placeholder="Empresa o proyecto" style={S.input} />
      <select name="perfil" defaultValue="" style={{ ...S.input, cursor: 'pointer', color: 'var(--gris)' }}>
        <option value="" disabled>Tu perfil profesional</option>
        {['Chef / Cocinero', 'Pastelero / Obrador', 'Hotel / Hospitality', 'Restaurante / Gastronomía', 'Specialty Coffee / Brunch', 'Consultor / Asesor gastronómico', 'Otro'].map(o => (
          <option key={o} value={o}>{o}</option>
        ))}
      </select>
      <input name="email" type="email" placeholder="Email de contacto" required style={S.input} />
      <div>
        <input name="telefono" type="tel" placeholder="Teléfono WhatsApp" style={S.input} />
        <p style={{ fontSize: '0.68rem', color: 'var(--gris)', marginTop: '0.3rem', paddingLeft: '0.2rem' }}>
          Usaremos este número solo para confirmarte la plaza por WhatsApp.
        </p>
      </div>

      <select name="isla" required defaultValue="" style={{ ...S.input, cursor: 'pointer', color: 'var(--gris)' }}>
        <option value="" disabled>Tu isla *</option>
        {['Lanzarote', 'Fuerteventura', 'Gran Canaria', 'Tenerife', 'La Palma', 'La Gomera', 'El Hierro', 'Fuera de Canarias'].map(i => (
          <option key={i} value={i} style={{ color: 'var(--grafito)' }}>{i}</option>
        ))}
      </select>

      <input name="cargo" placeholder="Cargo que ocupas" style={S.input} />

      <input
        name="instagram"
        placeholder="Instagram (opcional) — @tunombre"
        style={S.input}
      />

      {/* Primera vez en evento AVA */}
      <div>
        <p style={{ fontSize: '0.65rem', letterSpacing: '0.3em', textTransform: 'uppercase', color: 'var(--gris)', marginBottom: '0.5rem', fontFamily: 'DM Sans, sans-serif' }}>
          ¿Es la primera vez que vienes a un evento AVA?
        </p>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          {[{ value: 'si', label: 'Sí, primera vez' }, { value: 'no', label: 'Ya he venido antes' }].map(opt => (
            <label key={opt.value} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', padding: '0.75rem 1.1rem', background: 'var(--blanco)', border: '1px solid var(--crema3)', flex: 1, fontSize: '0.82rem', color: 'var(--grafito)' }}>
              <input type="radio" name="primera_vez" value={opt.value} defaultChecked={opt.value === 'si'} style={{ accentColor: 'var(--negro)', width: 14, height: 14 }} />
              {opt.label}
            </label>
          ))}
        </div>
      </div>

      {/* Cliente de AVA */}
      <div>
        <p style={{ fontSize: '0.65rem', letterSpacing: '0.3em', textTransform: 'uppercase', color: 'var(--gris)', marginBottom: '0.5rem', fontFamily: 'DM Sans, sans-serif' }}>
          ¿Eres cliente de AVA?
        </p>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          {[{ value: 'si', label: 'Sí, soy cliente' }, { value: 'no', label: 'Todavía no' }].map(opt => (
            <label key={opt.value} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', padding: '0.75rem 1.1rem', background: 'var(--blanco)', border: '1px solid var(--crema3)', flex: 1, fontSize: '0.82rem', color: 'var(--grafito)' }}>
              <input type="radio" name="cliente_ava" value={opt.value} defaultChecked={opt.value === 'no'} style={{ accentColor: 'var(--negro)', width: 14, height: 14 }} />
              {opt.label}
            </label>
          ))}
        </div>
      </div>

      <p style={{ fontSize: '0.65rem', letterSpacing: '0.3em', textTransform: 'uppercase', color: 'var(--gris)', marginTop: '0.5rem' }}>
        ¿A qué bloques vas a asistir?
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {BLOQUES.map(b => (
          <label key={b.value} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', cursor: 'pointer', padding: '0.85rem 1rem', background: 'var(--blanco)', border: '1px solid var(--crema3)' }}>
            <input type="checkbox" name="bloques" value={b.value} style={{ marginTop: '0.15rem', accentColor: 'var(--negro)', width: 14, height: 14, flexShrink: 0 }} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
              <span style={{ fontSize: '0.62rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--gris-l)' }}>{b.hora}</span>
              <span style={{ fontSize: '0.85rem', color: 'var(--grafito)', fontWeight: 400 }}>{b.nombre}</span>
              <span style={{ fontSize: '0.75rem', color: 'var(--gris)' }}>{b.sub}</span>
            </div>
          </label>
        ))}
      </div>

      <p style={{ fontSize: '0.75rem', color: 'var(--gris)', lineHeight: 1.6, fontStyle: 'italic' }}>
        Selecciona todos los bloques a los que prevés asistir. Puedes cambiar tu asistencia escribiéndonos directamente.
      </p>

      <a href="https://maps.google.com/?q=Avenida+de+las+Playas+Puerto+del+Carmen+Lanzarote" target="_blank" rel="noopener noreferrer"
        style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.75rem', color: 'var(--gris)', textDecoration: 'none', marginTop: '0.25rem', padding: '0.85rem 1rem', background: 'var(--blanco)', border: '1px solid var(--crema3)' }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" /><circle cx="12" cy="9" r="2.5" /></svg>
        Av. de las Playas · Puerto del Carmen · Lanzarote — Ver en Google Maps
      </a>

      {/* Aceptación canal WhatsApp — obligatorio */}
      <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.85rem', cursor: 'pointer', padding: '1rem 1.1rem', background: 'var(--blanco)', border: '1px solid var(--amarillo)', marginTop: '0.5rem' }}>
        <input
          type="checkbox"
          name="whatsapp_canal"
          required
          style={{ marginTop: '0.2rem', accentColor: 'var(--negro)', width: 16, height: 16, flexShrink: 0, cursor: 'pointer' }}
        />
        <div>
          <p style={{ fontSize: '0.82rem', color: 'var(--negro)', fontWeight: 400, lineHeight: 1.5, marginBottom: '0.25rem' }}>
            Acepto unirme al canal de difusión de WhatsApp de Yellow Craft Academy
          </p>
          <p style={{ fontSize: '0.72rem', color: 'var(--gris)', lineHeight: 1.6 }}>
            Recibirás información del evento, cambios de programa y novedades directamente en WhatsApp. Sin grupos, solo difusión. Puedes salir cuando quieras.
          </p>
        </div>
      </label>

      {error && (
        <p style={{ fontSize: '0.8rem', color: '#c0392b', padding: '0.75rem 1rem', background: '#fef2f2', border: '1px solid #fca5a5' }}>{error}</p>
      )}

      <button type="submit" disabled={isPending}
        style={{ background: 'var(--negro)', color: 'var(--crema)', border: 'none', padding: '1rem', fontSize: '0.75rem', letterSpacing: '0.2em', textTransform: 'uppercase', fontWeight: 500, cursor: isPending ? 'not-allowed' : 'pointer', opacity: isPending ? 0.6 : 1, fontFamily: 'DM Sans, sans-serif', marginTop: '0.25rem' }}>
        {isPending ? 'Enviando...' : 'Reservar plaza'}
      </button>
    </form>
  )
}

export default function LandingClient({ locale }: Props) {
  return (
    <div style={{ background: 'var(--crema)', color: 'var(--grafito)', fontFamily: 'DM Sans, sans-serif', fontWeight: 300, overflowX: 'hidden' }}>

      {/* NAV */}
      <nav style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100, display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.25rem 2.5rem', background: 'rgba(247,243,238,0.94)', backdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(0,0,0,0.07)' }}>
        <Link href={`/${locale}/evento`} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', textDecoration: 'none' }}>
          <YCLogo size={34} />
          <span style={{ fontSize: '0.7rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--gris)' }}>Organizado por AVA</span>
        </Link>
        <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
          <Link href={`/${locale}`} style={{ fontSize: '0.7rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--gris)', textDecoration: 'none' }}>Catálogo</Link>
          <Link href={`/${locale}/pildoras`} style={{ fontSize: '0.7rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--gris)', textDecoration: 'none' }}>Píldoras</Link>
          <a href="#registro" style={{ fontSize: '0.68rem', letterSpacing: '0.2em', textTransform: 'uppercase', background: 'var(--negro)', color: 'var(--crema)', padding: '0.45rem 1.3rem', fontWeight: 500, textDecoration: 'none' }}>Reservar plaza</a>
        </div>
      </nav>

      {/* HERO */}
      <section style={{ minHeight: '100vh', display: 'grid', gridTemplateColumns: '1fr 1fr', paddingTop: 72 }}>
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '3rem 4rem' }}>
          <p style={{ ...S.eyebrow, marginBottom: '2.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <span style={{ width: 30, height: 1, background: 'var(--gris-l)', display: 'inline-block' }} />
            Primera edición · 15 de junio · Lanzarote
          </p>
          <h1 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 'clamp(3.8rem,6vw,6.5rem)', fontWeight: 300, lineHeight: 0.95, color: 'var(--negro)', marginBottom: '2.5rem' }}>
            Yellow<br /><em style={{ fontStyle: 'italic', color: 'var(--grafito)' }}>Craft</em><br />
            Academy<span style={{ display: 'inline-block', width: '0.45em', height: '0.45em', background: 'var(--amarillo)', borderRadius: '50%', verticalAlign: 'middle', marginLeft: '0.1em', position: 'relative', top: '-0.35em' }} />
          </h1>
          <p style={{ fontSize: '1rem', lineHeight: 1.75, color: 'var(--gris)', maxWidth: 420, marginBottom: '3rem' }}>
            Una jornada de formación técnica gastronómica para profesionales que quieren entender el oficio. No solo practicarlo.
          </p>
          <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
            <a href="#registro" style={{ background: 'var(--negro)', color: 'var(--crema)', padding: '0.9rem 2.2rem', fontSize: '0.75rem', letterSpacing: '0.2em', textTransform: 'uppercase', fontWeight: 500, textDecoration: 'none' }}>Reservar plaza</a>
            <a href="#ponentes" style={{ fontSize: '0.78rem', color: 'var(--gris)', textDecoration: 'none', borderBottom: '1px solid var(--gris-l)', paddingBottom: 2 }}>Ver ponentes</a>
          </div>
        </div>

        <div style={{ background: 'var(--negro)', position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 70% 60% at 60% 30%, rgba(245,197,24,0.1) 0%, transparent 65%)' }} />
          <div style={{ position: 'relative', zIndex: 2, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '2.5rem 0 1.5rem', borderBottom: '1px solid rgba(247,243,238,0.06)' }}>
            <svg viewBox="0 0 560 560" xmlns="http://www.w3.org/2000/svg" style={{ width: 160, height: 160 }}>
              <circle cx="280" cy="280" r="268" fill="#F0EAE0" />
              <circle cx="280" cy="280" r="265" fill="none" stroke="#0A0A08" strokeWidth="1.5" opacity="0.1" />
              <circle cx="280" cy="92" r="32" fill="#F5C518" />
              <line x1="98" y1="152" x2="462" y2="152" stroke="#0A0A08" strokeWidth="1.5" opacity="0.15" />
              <text x="280" y="242" fontFamily="Helvetica Neue, Arial, sans-serif" fontSize="72" fontWeight="200" letterSpacing="7" fill="#0A0A08" textAnchor="middle" dominantBaseline="middle">YELLOW</text>
              <text x="280" y="318" fontFamily="Helvetica Neue, Arial, sans-serif" fontSize="60" fontWeight="600" letterSpacing="14" fill="#0A0A08" textAnchor="middle" dominantBaseline="middle">CRAFT</text>
              <line x1="160" y1="350" x2="400" y2="350" stroke="#0A0A08" strokeWidth="0.7" opacity="0.15" />
              <text x="280" y="378" fontFamily="Helvetica Neue, Arial, sans-serif" fontSize="18" fontWeight="400" letterSpacing="9" fill="#0A0A08" textAnchor="middle" dominantBaseline="middle" opacity="0.38">ACADEMY</text>
            </svg>
          </div>
          <div style={{ position: 'relative', zIndex: 2, padding: '2rem 3rem 3rem' }}>
            <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 'clamp(1.4rem,2.2vw,2rem)', fontWeight: 300, fontStyle: 'italic', color: 'rgba(247,243,238,0.7)', lineHeight: 1.5, marginBottom: '2.5rem' }}>
              "Hay conocimiento que no se aprende en cursos. Se aprende en salas como esta."
            </p>
            {[
              ['Fecha', '15 de junio de 2026'],
              ['Lugar', 'Av. de las Playas · Puerto del Carmen · Lanzarote'],
              ['Horario', '9:30h – 21:00h'],
              ['Acceso', 'Gratuito · Plaza reservada'],
            ].map(([label, val]) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', padding: '0.8rem 0', borderTop: '1px solid rgba(247,243,238,0.07)', gap: '1rem' }}>
                <span style={{ fontSize: '0.6rem', letterSpacing: '0.25em', textTransform: 'uppercase', color: 'rgba(247,243,238,0.3)', whiteSpace: 'nowrap' }}>{label}</span>
                <span style={{ fontSize: '0.75rem', color: 'rgba(247,243,238,0.75)', textAlign: 'right' }}>{val}</span>
              </div>
            ))}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', padding: '0.8rem 0', borderTop: '1px solid rgba(247,243,238,0.07)' }}>
              <span style={{ fontSize: '0.6rem', letterSpacing: '0.25em', textTransform: 'uppercase', color: 'rgba(247,243,238,0.3)' }}>Cómo llegar</span>
              <a href="https://maps.google.com/?q=Avenida+de+las+Playas+Puerto+del+Carmen+Lanzarote" target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.72rem', color: 'rgba(245,197,24,0.7)', textDecoration: 'none' }}>Ver en Google Maps →</a>
            </div>
          </div>
        </div>
      </section>

      {/* STRIP */}
      <div style={{ background: 'var(--amarillo)', padding: '1rem 0', overflow: 'hidden' }}>
        <div style={{ display: 'flex', animation: 'strip 28s linear infinite', width: 'max-content' }}>
          {[0, 1, 2].map(i => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '2rem', padding: '0 2rem', whiteSpace: 'nowrap' }}>
              {['Yellow Craft Academy', '15 de junio · Lanzarote', 'Formación técnica gastronómica', 'Entrada gratuita · Plazas limitadas', 'AVA Identidad'].map((t, j) => (
                <span key={j} style={{ display: 'inline-flex', alignItems: 'center', gap: '2rem' }}>
                  <span style={{ fontSize: '0.7rem', fontWeight: 500, letterSpacing: '0.25em', textTransform: 'uppercase', color: 'var(--negro)' }}>{t}</span>
                  <span style={{ width: 4, height: 4, background: 'var(--negro)', borderRadius: '50%', opacity: 0.25, display: 'inline-block' }} />
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* PONENTES */}
      <div style={{ background: 'var(--blanco)' }} id="ponentes">
        <div style={{ padding: '8rem 4rem', maxWidth: 1300, margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '5rem' }}>
            <div>
              <p style={{ ...S.eyebrow, marginBottom: '1rem' }}>Ponentes confirmados</p>
              <h2 style={{ ...S.sectionTitle, fontSize: 'clamp(2.5rem,4vw,4rem)' }}>Tres voces.<br /><em style={{ fontStyle: 'italic', color: 'var(--gris)' }}>Un mismo criterio.</em></h2>
            </div>
            <span style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '5rem', fontWeight: 300, color: 'var(--crema3)', lineHeight: 1 }}>03</span>
          </div>
          <div>
            {PONENTES.map((p, idx) => (
              <div key={idx} style={{ display: 'grid', gridTemplateColumns: '50px 1fr auto', gap: '2rem', alignItems: 'start', padding: '3rem 0', borderTop: '1px solid var(--crema3)', borderBottom: idx === PONENTES.length - 1 ? '1px solid var(--crema3)' : undefined }}>
                <span style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1rem', color: 'var(--gris-l)', paddingTop: '0.5rem' }}>{p.num}</span>
                <div>
                  <p style={{ fontSize: '0.6rem', letterSpacing: '0.3em', textTransform: 'uppercase', color: 'var(--gris)', marginBottom: '0.3rem' }}>{p.marca}</p>
                  <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '2rem', fontWeight: 400, color: 'var(--negro)', lineHeight: 1.1, marginBottom: '0.75rem' }}>{p.nombre}</p>
                  <p style={{ fontSize: '0.82rem', color: 'var(--negro)', fontWeight: 400, lineHeight: 1.65, padding: '0.6rem 0.9rem', background: 'var(--amarillo)', display: 'inline-block', marginBottom: '0.5rem' }}>{p.resultado}</p>
                  <p style={{ fontSize: '0.75rem', color: 'var(--gris)', lineHeight: 1.65, fontStyle: 'italic', marginTop: '0.5rem' }}>{p.para}</p>
                </div>
                <span style={{ fontSize: '0.6rem', letterSpacing: '0.2em', textTransform: 'uppercase', border: '1px solid var(--crema3)', color: 'var(--gris)', padding: '0.4rem 1rem', whiteSpace: 'nowrap', marginTop: '0.5rem' }}>{p.hora}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* FILOSOFIA */}
      <div style={{ background: 'var(--negro)', padding: '7rem 4rem' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 'clamp(1.9rem,3.2vw,3rem)', fontWeight: 300, lineHeight: 1.5, color: 'rgba(247,243,238,0.75)' }}>
            Hay eventos que te dan ideas.<br />
            <em style={{ color: 'var(--amarillo)', fontStyle: 'italic' }}>Este está diseñado para que el día siguiente</em><br />
            trabajes diferente.
          </p>
          <p style={{ marginTop: '3rem', fontSize: '0.65rem', letterSpacing: '0.35em', textTransform: 'uppercase', color: 'rgba(247,243,238,0.2)' }}>
            AVA · Yellow Craft Academy · Lanzarote · 2026
          </p>
        </div>
      </div>

      {/* JORNADA */}
      <div style={{ background: 'var(--blanco)', padding: '8rem 4rem', borderTop: '1px solid var(--crema3)' }} id="jornada">
        <div style={{ maxWidth: 1300, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '8rem', alignItems: 'start' }}>
          <div>
            <p style={{ ...S.eyebrow, marginBottom: '1rem' }}>Programa del día</p>
            <h2 style={{ ...S.sectionTitle, fontSize: 'clamp(2.2rem,3.5vw,3.5rem)', marginBottom: '1.5rem' }}>
              Una jornada<br />con <em style={{ fontStyle: 'italic', color: 'var(--gris)' }}>tres tiempos</em>
            </h2>
            <p style={{ fontSize: '0.87rem', color: 'var(--gris)', lineHeight: 1.8 }}>
              Conocimiento técnico, producto en mesa y cierre experiencial con atardecer.
            </p>
            <div style={{ marginTop: '2.5rem', padding: '1.5rem', background: 'var(--crema)', borderLeft: '2px solid var(--amarillo)' }}>
              <strong style={{ color: 'var(--negro)', fontWeight: 500, display: 'block', marginBottom: '0.3rem', fontSize: '0.85rem' }}>15 de junio de 2026</strong>
              <p style={{ fontSize: '0.8rem', color: 'var(--gris)', lineHeight: 1.7 }}>
                Avenida de las Playas · Puerto del Carmen · Lanzarote<br />Puertas abiertas desde las 9:30h
              </p>
            </div>
          </div>
          <div>
            {JORNADA.map((item, i) => (
              <div key={i} style={{ display: 'grid', gridTemplateColumns: '100px 1fr', gap: '2rem', padding: '2rem 0', borderTop: '1px solid var(--crema3)', borderBottom: i === JORNADA.length - 1 ? '1px solid var(--crema3)' : undefined }}>
                <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1rem', color: 'var(--gris)', lineHeight: 1.5, paddingTop: '0.1rem' }}>{item.hora}</div>
                <div>
                  {item.ponente && <p style={{ fontSize: '0.72rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--gris-l)', marginBottom: '0.4rem' }}>{item.ponente}</p>}
                  <p style={{ fontSize: '0.9rem', fontWeight: 500, color: 'var(--negro)', marginBottom: '0.35rem' }}>{item.titulo}</p>
                  <p style={{ fontSize: '0.8rem', color: 'var(--gris)', lineHeight: 1.7 }}>{item.desc}</p>
                  {item.resultado && <p style={{ fontSize: '0.78rem', color: 'var(--negro)', fontWeight: 500, marginTop: '0.5rem', padding: '0.5rem 0.75rem', background: 'var(--amarillo)', display: 'inline-block' }}>{item.resultado}</p>}
                  <span style={{ display: 'inline-block', marginTop: '0.5rem', fontSize: '0.58rem', letterSpacing: '0.22em', textTransform: 'uppercase', ...(item.tipo === 'pill' ? { background: 'var(--amarillo)', color: 'var(--negro)', padding: '0.2rem 0.7rem', fontWeight: 500 } : item.tipo === 'pill-alt' ? { background: 'var(--amarillo)', color: 'var(--negro)', padding: '0.2rem 0.7rem', fontWeight: 500 } : { border: '1px solid var(--crema3)', color: 'var(--gris)', padding: '0.2rem 0.7rem' }) }}>
                    {item.tipo === 'pill' ? 'Ponencia técnica' : item.tipo === 'pill-alt' ? 'Producto · Networking' : 'Acceso libre'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* RAZONES */}
      <div style={{ background: 'var(--crema)', padding: '8rem 4rem' }}>
        <div style={{ maxWidth: 1300, margin: '0 auto' }}>
          <p style={{ ...S.eyebrow, marginBottom: '0.5rem' }}>Por qué importa</p>
          <h2 style={{ ...S.sectionTitle, fontSize: 'clamp(2.5rem,4vw,4rem)', maxWidth: 600, marginBottom: '5rem' }}>
            No enseñamos a usar productos.<br /><em style={{ fontStyle: 'italic', color: 'var(--gris)' }}>Enseñamos a comprenderlos.</em>
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '4rem' }}>
            {[
              { num: '01', titulo: 'Técnica con propósito', desc: 'Cada ponencia está seleccionada con criterio estratégico. Conocimiento que transforma la manera de operar en cocina y en negocio.' },
              { num: '02', titulo: 'Producto en contexto real', desc: 'El producto no se presenta en catálogo. Se pone en mesa, se explica desde la técnica y se prueba desde la experiencia. Así es como se decide bien.' },
              { num: '03', titulo: 'Comunidad de criterio', desc: 'El espacio donde se encuentran los profesionales que construyen la gastronomía de Canarias con exigencia real.' },
            ].map(r => (
              <div key={r.num} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <span style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '3.5rem', fontWeight: 300, color: 'var(--crema3)', lineHeight: 1 }}>{r.num}</span>
                <span style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.45rem', fontWeight: 400, color: 'var(--negro)' }}>{r.titulo}</span>
                <span style={{ fontSize: '0.82rem', color: 'var(--gris)', lineHeight: 1.8 }}>{r.desc}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* REGISTRO */}
      <div style={{ background: 'var(--crema2)', padding: '8rem 4rem', borderTop: '1px solid var(--crema3)' }} id="registro">
        <div style={{ maxWidth: 580, margin: '0 auto' }}>
          <p style={{ ...S.eyebrow, marginBottom: '1rem' }}>Entrada gratuita · Plazas limitadas</p>
          <h2 style={{ ...S.sectionTitle, fontSize: 'clamp(2.5rem,4vw,3.8rem)', marginBottom: '1rem' }}>
            Reserva tu<br /><em style={{ fontStyle: 'italic', color: 'var(--gris)' }}>plaza</em>
          </h2>
          <p style={{ fontSize: '0.87rem', color: 'var(--gris)', lineHeight: 1.75, marginBottom: '3rem' }}>
            Indica a qué bloques vas a asistir para que podamos organizarlo bien. Ven a lo que puedas — cada bloque tiene valor por sí solo.
          </p>
          <RegistroForm />
          <p style={{ marginTop: '1.5rem', fontSize: '0.65rem', letterSpacing: '0.25em', textTransform: 'uppercase', color: 'var(--gris-l)', textAlign: 'center' }}>
            Entrada gratuita · Confirmación por orden de registro
          </p>
        </div>
      </div>

      {/* FOOTER */}
      <footer style={{ background: 'var(--negro)', padding: '4rem 4rem 3rem' }}>
        <div style={{ maxWidth: 1300, margin: '0 auto', display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr', gap: '4rem', paddingBottom: '3rem', borderBottom: '1px solid rgba(247,243,238,0.07)' }}>
          <div>
            <YCLogo size={64} />
            <p style={{ fontSize: '0.78rem', color: 'rgba(247,243,238,0.28)', lineHeight: 1.9, marginTop: '1.2rem' }}>
              Una iniciativa de AVA.<br />Formación técnica gastronómica.<br />Canarias · Atlántico Medio · 2026.
            </p>
          </div>
          <div>
            <p style={{ fontSize: '0.58rem', letterSpacing: '0.35em', textTransform: 'uppercase', color: 'rgba(247,243,238,0.22)', marginBottom: '1.2rem' }}>Yellow Craft Academy</p>
            {[['#ponentes', 'Ponentes'], ['#jornada', 'Programa del día'], ['#registro', 'Reservar plaza']].map(([href, label]) => (
              <a key={href} href={href} style={{ display: 'block', fontSize: '0.78rem', color: 'rgba(247,243,238,0.4)', textDecoration: 'none', lineHeight: 2.2 }}>{label}</a>
            ))}
          </div>
          <div>
            <p style={{ fontSize: '0.58rem', letterSpacing: '0.35em', textTransform: 'uppercase', color: 'rgba(247,243,238,0.22)', marginBottom: '1.2rem' }}>Contacto</p>
            <a href="mailto:hola@avagastrum.com" style={{ display: 'block', fontSize: '0.78rem', color: 'rgba(247,243,238,0.4)', textDecoration: 'none', lineHeight: 2.2 }}>hola@avagastrum.com</a>
            <span style={{ display: 'block', fontSize: '0.78rem', color: 'rgba(247,243,238,0.4)', lineHeight: 2.2 }}>Puerto del Carmen · Lanzarote</span>
          </div>
        </div>
        <div style={{ maxWidth: 1300, margin: '0 auto', paddingTop: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <p style={{ fontSize: '0.68rem', color: 'rgba(247,243,238,0.16)' }}>AVA Identidad · Lanzarote · Canarias · 2026</p>
          <span style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '0.9rem', color: 'rgba(245,197,24,0.3)', letterSpacing: '0.1em' }}>29°02′N · 13°36′W</span>
        </div>
      </footer>

      <style>{`
        @keyframes strip { from { transform:translateX(0); } to { transform:translateX(-33.333%); } }
        @media (max-width: 768px) {
          section[style*="grid-template-columns: 1fr 1fr"] { grid-template-columns: 1fr !important; height: auto !important; min-height: 100svh !important; }
          div[style*="grid-template-columns: 1fr 1.5fr"] { grid-template-columns: 1fr !important; gap: 2.5rem !important; }
          div[style*="grid-template-columns: repeat(3"] { grid-template-columns: 1fr !important; }
          div[style*="grid-template-columns: 1.5fr 1fr 1fr"] { grid-template-columns: 1fr !important; gap: 2rem !important; }
          nav { padding: 1rem 1.5rem !important; }
          nav > div:first-child > span { display: none; }
        }
        @media (max-width: 480px) {
          div[style*="padding: 8rem 4rem"] { padding: 4rem 1.5rem !important; }
          div[style*="padding: 7rem 4rem"] { padding: 4rem 1.5rem !important; }
          footer { padding: 3rem 1.5rem 2rem !important; }
        }
      `}</style>
    </div>
  )
}
