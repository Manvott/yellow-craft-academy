import createMiddleware from 'next-intl/middleware'
import { NextRequest, NextResponse } from 'next/server'
import { routing } from './i18n/routing'

const intlMiddleware = createMiddleware(routing)

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (pathname.includes('/admin') && !pathname.includes('/admin/login')) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (supabaseUrl && supabaseKey) {
      try {
        const { createServerClient } = await import('@supabase/ssr')
        const response = NextResponse.next()
        const supabase = createServerClient(supabaseUrl, supabaseKey, {
          cookies: {
            getAll: () => request.cookies.getAll(),
            setAll: (cookiesToSet) => {
              cookiesToSet.forEach(({ name, value, options }) =>
                response.cookies.set(name, value, options)
              )
            },
          },
        })
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) {
          const locale = pathname.split('/')[1] || 'es'
          return NextResponse.redirect(new URL(`/${locale}/admin/login`, request.url))
        }
      } catch {}
    }
  }

  return intlMiddleware(request)
}

export const config = {
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
}
