import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
  const isMaintenanceMode =
    process.env.MAINTENANCE_MODE === 'true' ||
    process.env.NEXT_PUBLIC_MAINTENANCE_MODE === 'true';

  if (isMaintenanceMode) {
    const { pathname } = request.nextUrl;

    // 1. Bypass static assets, images, next internal files, and the maintenance page itself
    if (
      pathname.startsWith('/_next') ||
      pathname.startsWith('/images') ||
      pathname.startsWith('/favicon') ||
      pathname === '/maintenance.html' ||
      pathname.includes('.')
    ) {
      return NextResponse.next();
    }

    // 2. For API requests, return a clean 503 JSON response
    if (pathname.startsWith('/api')) {
      return new NextResponse(
        JSON.stringify({ error: 'Service under maintenance. Please try again later.' }),
        {
          status: 503,
          headers: {
            'content-type': 'application/json',
          },
        }
      );
    }

    // 3. For all other page requests, rewrite (serve) the static maintenance.html
    // Use rewrite so the URL doesn't change, which is better for user experience and SEO
    return NextResponse.rewrite(new URL('/maintenance.html', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
