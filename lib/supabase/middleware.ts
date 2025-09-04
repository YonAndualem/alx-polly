import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

/**
 * Updates and validates user sessions for protected routes.
 * 
 * This middleware function handles session management for the entire application:
 * - Validates existing user sessions
 * - Refreshes tokens when necessary
 * - Redirects unauthenticated users to login
 * - Manages session cookies securely
 * 
 * @param request - The incoming HTTP request object
 * @returns NextResponse - Modified response with updated session cookies or redirect
 * 
 * @security
 * - Validates authentication for all protected routes
 * - Handles automatic token refresh
 * - Secures session cookies with proper settings
 * - Prevents access to protected resources without authentication
 */
export async function updateSession(request: NextRequest) {
  // Create initial response that will be modified with session data
  let supabaseResponse = NextResponse.next({
    request,
  })

  // Initialize Supabase client for server-side session management
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        // Extract all cookies from the incoming request
        getAll() {
          return request.cookies.getAll()
        },
        // Set cookies in both request and response for proper session handling
        setAll(cookiesToSet) {
          // Set cookies in the request for immediate use
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
          
          // Create new response with updated cookies
          supabaseResponse = NextResponse.next({
            request,
          })
          
          // Set cookies in the response for client-side persistence
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Validate current user session and refresh tokens if needed
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Check if user is authenticated and current route requires auth
  if (
    !user && // User is not authenticated
    !request.nextUrl.pathname.startsWith('/login') && // Not on login page
    !request.nextUrl.pathname.startsWith('/auth') // Not on auth pages
  ) {
    // Redirect unauthenticated users to login page
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // Return response with updated session cookies
  return supabaseResponse
}