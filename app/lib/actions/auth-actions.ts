'use server';

import { createClient } from '@/lib/supabase/server';
import { LoginFormData, RegisterFormData } from '../types';

/**
 * Authenticates a user with email and password credentials.
 * 
 * This function handles user sign-in using Supabase authentication.
 * It validates credentials against the database and establishes
 * a user session upon successful authentication.
 * 
 * @param data - Login credentials containing email and password
 * @returns Promise<{error: string | null}> Authentication result
 * 
 * @security
 * - Uses Supabase's built-in authentication security
 * - Passwords are handled securely by Supabase (hashed, salted)
 * - Rate limiting and security measures handled by Supabase
 * 
 * @example
 * ```typescript
 * const loginData = { email: 'user@example.com', password: 'securePassword' };
 * const result = await login(loginData);
 * if (result.error) {
 *   console.error('Login failed:', result.error);
 * } else {
 *   console.log('User logged in successfully');
 * }
 * ```
 */
export async function login(data: LoginFormData) {
  const supabase = await createClient();

  // Attempt authentication with provided credentials
  const { error } = await supabase.auth.signInWithPassword({
    email: data.email,
    password: data.password,
  });

  if (error) {
    return { error: error.message };
  }

  // Success: no error indicates successful authentication
  return { error: null };
}

/**
 * Registers a new user account with email verification.
 * 
 * This function creates a new user account in the system using Supabase
 * authentication. It includes user metadata (name) and triggers email
 * verification as part of the secure registration process.
 * 
 * @param data - Registration data containing name, email, and password
 * @returns Promise<{error: string | null}> Registration result
 * 
 * @security
 * - Email verification required before account activation
 * - Password strength validation handled by Supabase
 * - User metadata stored securely with account
 * - Duplicate email prevention built-in
 * 
 * @example
 * ```typescript
 * const regData = { 
 *   name: 'John Doe', 
 *   email: 'john@example.com', 
 *   password: 'strongPassword123' 
 * };
 * const result = await register(regData);
 * if (result.error) {
 *   console.error('Registration failed:', result.error);
 * } else {
 *   console.log('Check email for verification link');
 * }
 * ```
 */
export async function register(data: RegisterFormData) {
  const supabase = await createClient();

  // Create new user account with metadata
  const { error } = await supabase.auth.signUp({
    email: data.email,
    password: data.password,
    options: {
      data: {
        name: data.name, // Store user's display name in metadata
      },
    },
  });

  if (error) {
    return { error: error.message };
  }

  // Success: Account created, email verification sent
  return { error: null };
}

/**
 * Signs out the current user and invalidates their session.
 * 
 * This function handles secure user logout by clearing the session
 * and removing authentication tokens. After logout, the user will
 * need to authenticate again to access protected resources.
 * 
 * @returns Promise<{error: string | null}> Logout result
 * 
 * @security
 * - Clears server-side session tokens
 * - Invalidates client-side authentication state
 * - Ensures complete session cleanup
 * 
 * @example
 * ```typescript
 * const result = await logout();
 * if (result.error) {
 *   console.error('Logout failed:', result.error);
 * } else {
 *   // Redirect to login page
 *   router.push('/login');
 * }
 * ```
 */
export async function logout() {
  const supabase = await createClient();
  
  // Clear user session and authentication tokens
  const { error } = await supabase.auth.signOut();
  if (error) {
    return { error: error.message };
  }
  return { error: null };
}

/**
 * Retrieves the currently authenticated user information.
 * 
 * This function fetches the current user's data from the active session.
 * It's commonly used to check authentication status and get user details
 * for authorization decisions and UI personalization.
 * 
 * @returns Promise<User | null> Current user object or null if not authenticated
 * 
 * @example
 * ```typescript
 * const user = await getCurrentUser();
 * if (user) {
 *   console.log(`Welcome back, ${user.email}`);
 * } else {
 *   console.log('Please log in to continue');
 * }
 * ```
 */
export async function getCurrentUser() {
  const supabase = await createClient();
  
  // Fetch current user from session
  const { data } = await supabase.auth.getUser();
  return data.user;
}

/**
 * Retrieves the current user session information.
 * 
 * This function gets the complete session object, including tokens
 * and session metadata. Useful for session management and token
 * validation in middleware and authentication flows.
 * 
 * @returns Promise<Session | null> Current session object or null if no active session
 * 
 * @example
 * ```typescript
 * const session = await getSession();
 * if (session) {
 *   console.log(`Session expires at: ${session.expires_at}`);
 * } else {
 *   console.log('No active session found');
 * }
 * ```
 */
export async function getSession() {
  const supabase = await createClient();
  
  // Fetch current session with tokens and metadata
  const { data } = await supabase.auth.getSession();
  return data.session;
}
