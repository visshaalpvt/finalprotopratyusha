import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

// Public routes that don't require authentication
const isPublicRoute = createRouteMatcher([
  '/',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/api/webhooks(.*)',
]);

// Simplified middleware to avoid header immutability issues
// Skip WebSocket upgrade requests to prevent "Cannot read properties of undefined (reading 'bind')" errors
export default clerkMiddleware(async (auth, req) => {
  // Skip middleware for WebSocket upgrade requests
  // These are handled by Next.js internally and shouldn't go through Clerk middleware
  const upgradeHeader = req.headers.get('upgrade');
  if (upgradeHeader === 'websocket') {
    return NextResponse.next();
  }

  // Allow public routes to pass through
  if (isPublicRoute(req)) {
    return NextResponse.next();
  }

  // For protected routes, check authentication
  const { userId } = await auth();
  if (!userId) {
    // For protected routes without auth, redirect to sign-in
    // But don't redirect if already on sign-in/sign-up
    const url = req.nextUrl.clone();
    if (!url.pathname.startsWith('/sign-in') && !url.pathname.startsWith('/sign-up')) {
      url.pathname = '/sign-in';
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};
