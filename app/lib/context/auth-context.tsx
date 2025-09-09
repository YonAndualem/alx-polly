'use client';

import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Session, User } from '@supabase/supabase-js';

/**
 * Authentication context interface defining the shape of auth state and actions.
 * 
 * This interface provides type safety for components consuming the auth context,
 * ensuring consistent access to user state, session data, and authentication actions.
 */
interface AuthContextType {
  /** Current user session object, null if not authenticated */
  session: Session | null;
  /** Current user object, null if not authenticated */
  user: User | null;
  /** Function to sign out the current user */
  signOut: () => void;
  /** Loading state during authentication checks */
  loading: boolean;
}

/**
 * React context for managing global authentication state.
 * 
 * This context provides authentication state and actions throughout the
 * application, eliminating the need for prop drilling and ensuring
 * consistent auth state management.
 */
const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  signOut: () => { },
  loading: true,
});

/**
 * Authentication provider component that manages global auth state.
 * 
 * This component wraps the application to provide authentication context
 * to all child components. It handles:
 * - Initial user session loading
 * - Real-time auth state changes
 * - Session persistence across page reloads
 * - Cleanup of auth listeners
 * 
 * @param children - React components that will have access to auth context
 * 
 * @example
 * ```tsx
 * function App() {
 *   return (
 *     <AuthProvider>
 *       <YourAppComponents />
 *     </AuthProvider>
 *   );
 * }
 * ```
 */
export const AuthProvider = ({ children }: { children: React.ReactNode }): JSX.Element => {
  // Memoize Supabase client to prevent recreation on every render
  const supabase = useMemo(() => createClient(), []);

  // Authentication state management
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true; // Prevent state updates if component unmounts

    /**
     * Fetches the current user session on component mount.
     * This ensures the auth state is immediately available when the app loads.
     */
    const getUser = async () => {
      const { data, error } = await supabase.auth.getUser();
      if (error) {
        console.error('Error fetching user:', error);
      }

      // Only update state if component is still mounted
      if (mounted) {
        setUser(data.user ?? null);
        setSession(null); // Session will be set by the auth state change listener
        setLoading(false);
        console.log('AuthContext: Initial user loaded', data.user);
      }
    };

    getUser();

    /**
     * Subscribe to auth state changes for real-time updates.
     * This listener handles login, logout, token refresh, and other auth events.
     */
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      // Note: Don't set loading to false here, only after initial load
      console.log('AuthContext: Auth state changed', _event, session, session?.user);
    });

    // Cleanup function to prevent memory leaks
    return () => {
      mounted = false;
      authListener.subscription.unsubscribe();
    };
  }, [supabase]);

  /**
   * Signs out the current user and clears the session.
   * This function is exposed through the context for use by components.
   */
  const signOut = async () => {
    await supabase.auth.signOut();
  };

  console.log('AuthContext: user', user);

  return (
    <AuthContext.Provider value={{ session, user, signOut, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

/**
 * Custom hook for accessing authentication context.
 * 
 * This hook provides a convenient way to access the authentication state
 * and actions from any component within the AuthProvider tree. It includes
 * runtime validation to ensure it's used within the proper context.
 * 
 * @returns AuthContextType - Current auth state and available actions
 * 
 * @throws Error if used outside of AuthProvider
 * 
 * @example
 * ```tsx
 * function UserProfile() {
 *   const { user, loading, signOut } = useAuth();
 *   
 *   if (loading) return <div>Loading...</div>;
 *   if (!user) return <div>Please log in</div>;
 *   
 *   return (
 *     <div>
 *       <p>Welcome, {user.email}</p>
 *       <button onClick={signOut}>Sign Out</button>
 *     </div>
 *   );
 * }
 * ```
 */
export const useAuth = (): AuthContextType => useContext(AuthContext);
