import { NextResponse, type NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const token = request.cookies.get('metahabit_session')?.value
  const { pathname } = request.nextUrl

  // Protected paths
  const isProtectedPath =
    pathname.startsWith('/hoje') ||
    pathname.startsWith('/habitos') ||
    pathname.startsWith('/projetos') ||
    pathname.startsWith('/loja') ||
    pathname.startsWith('/progresso')

  if (isProtectedPath && !token) {
    const loginUrl = new URL('/login', request.url)
    return NextResponse.redirect(loginUrl)
  }

  // Redirect authenticated users away from /login or /cadastro to /hoje
  const isAuthPath = pathname === '/login' || pathname === '/cadastro'
  if (isAuthPath && token) {
    const hojeUrl = new URL('/hoje', request.url)
    return NextResponse.redirect(hojeUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/hoje/:path*',
    '/habitos/:path*',
    '/projetos/:path*',
    '/loja/:path*',
    '/progresso/:path*',
    '/login',
    '/cadastro',
  ],
}
