import { getLocale } from 'next-intl/server'
import LandingClient from '@/components/landing/LandingClient'

export const metadata = {
  title: 'Yellow Craft Academy · AVA · 15 de junio · Lanzarote',
  description: 'Una jornada de formación técnica gastronómica para profesionales HORECA. Lanzarote, 15 de junio 2026. Entrada gratuita, plazas limitadas.',
}

export default async function EventoPage() {
  const locale = await getLocale()
  return <LandingClient locale={locale} />
}
