import { type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

/**
 * Next.js middleware function for handling authentication and session management.
 * 
 * This middleware runs on every request to routes matching the config pattern.
 * It delegates session handling to the Supabase middleware function, which:
 * - Validates user authentication status
 * - Refreshes session tokens automatically
 * - Redirects unauthenticated users to login
 * - Manages secure session cookies
 * 
 * @param request - The incoming HTTP request
 * @returns NextResponse - Response with session handling or redirects
 * 
 * @see updateSession for detailed session handling logic
 */
export async function middleware(request: NextRequest) {
  return await updateSession(request)
}

/**
 * Configuration object defining which routes the middleware should run on.
 * 
 * The matcher pattern includes:
 * - All routes except Next.js internal paths (_next/static, _next/image)
 * - All routes except favicon.ico
 * - All routes except auth-related paths (login, register)
 * - All routes except static assets (svg, png, jpg, etc.)
 * 
 * This ensures middleware only runs on application routes that may require authentication.
 */
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|login|register|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}