'use client'

import Link from 'next/link'
import { useLocale, useTranslations } from 'next-intl'
import { usePathname, useRouter } from 'next/navigation'

export default function Navbar() {
  const t = useTranslations('nav')
  const locale = useLocale()
  const pathname = usePathname()
  const router = useRouter()

  function switchLocale() {
    const next = locale === 'es' ? 'en' : 'es'
    const newPath = pathname.replace(`/${locale}`, `/${next}`)
    router.push(newPath)
  }

  return (
    <nav className="bg-yellow-400 shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href={`/${locale}`} className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gray-900 rounded-full flex items-center justify-center">
              <span className="text-yellow-400 font-black text-xs">YC</span>
            </div>
            <span className="font-black text-gray-900 text-lg tracking-tight hidden sm:block">
              Yellow Craft Academy
            </span>
          </Link>

          <div className="flex items-center gap-6">
            <Link
              href={`/${locale}`}
              className="text-gray-900 font-medium hover:text-gray-600 transition-colors text-sm"
            >
              {t('productos')}
            </Link>
            <Link
              href={`/${locale}/pildoras`}
              className="text-gray-900 font-medium hover:text-gray-600 transition-colors text-sm"
            >
              {t('pildoras')}
            </Link>
            <button
              onClick={switchLocale}
              className="text-xs font-bold bg-gray-900 text-yellow-400 px-3 py-1.5 rounded-full hover:bg-gray-700 transition-colors"
            >
              {locale === 'es' ? 'EN' : 'ES'}
            </button>
          </div>
        </div>
      </div>
    </nav>
  )
}
