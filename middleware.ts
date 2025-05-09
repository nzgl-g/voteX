import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// This function can be marked `async` if using `await` inside
export function middleware(request: NextRequest) {
  // Get the path of the request
  const path = request.nextUrl.pathname;
  
  // Define protected routes (all routes under /team-leader, /team-member, or /voter)
  const isUserRoute = 
    path.startsWith('/team-leader') || 
    path.startsWith('/team-member') || 
    path.startsWith('/voter');
  
  // Check if the user is authenticated by looking for the token in cookies
  const token = request.cookies.get('token')?.value;
  const isAuthenticated = !!token;

  // If it's a protected route and the user is not authenticated, redirect to the landing page
  if (isUserRoute && !isAuthenticated) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  // If the user is authenticated and trying to access the landing page, redirect to the appropriate dashboard
  if (path === '/' && isAuthenticated) {
    // We would need user role information to determine where to redirect
    // For now, redirect to voter page as default
    return NextResponse.redirect(new URL('/voter', request.url));
  }
  
  return NextResponse.next();
}

// See "Matching Paths" below to learn more
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!api|_next/static|_next/image|favicon.ico|public).*)',
  ],
}; 