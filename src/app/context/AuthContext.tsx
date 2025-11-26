'use client'

/**
 * AuthContext - Firebase Authentication
 * 
 * Manages user authentication state using Firebase Auth.
 * After successful Firebase sign-in, verifies the token with our API
 * and ensures the user exists in Supabase.
 * 
 * Provides:
 * - user: Firebase user object with custom Supabase ID
 * - loading: Auth state loading indicator
 * - signOut: Firebase sign-out function
 */

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { 
  User as FirebaseUser,
  onAuthStateChanged,
  signOut as firebaseSignOut,
} from 'firebase/auth'
import { auth } from '@/lib/firebase/config'
import posthog from 'posthog-js'

interface SupabaseUserData {
  id: string
  firebaseUid: string
  email: string | null
  name: string | null
}

interface AuthUser extends FirebaseUser {
  supabaseId?: string
  supabaseData?: SupabaseUserData
}

interface AuthContextType {
  user: AuthUser | null
  loading: boolean
  unverifiedUser: FirebaseUser | null
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  unverifiedUser: null,
  signOut: async () => {},
})

export function AuthProvider({ children }: { children: ReactNode }) {
  // Start with null to match SSR; hydrate from cache on client
  const [user, setUser] = useState<AuthUser | null>(null)
  const [unverifiedUser, setUnverifiedUser] = useState<FirebaseUser | null>(null)
  const [loading, setLoading] = useState(true)

  // Load cached user after mount to prevent hydration mismatch while
  // keeping the initial SSR markup consistent.
  useEffect(() => {
    const cached = localStorage.getItem('reliever-auth-cache')
    if (cached) {
      try {
        const cachedUser = JSON.parse(cached)
        setUser(cachedUser)
        // Note: we intentionally keep `loading` true here until Firebase
        // confirms the auth state in the onAuthStateChanged listener.
      } catch {
        // Ignore parse errors
      }
    }
  }, [])

  useEffect(() => {
    // Listen for Firebase auth state changes
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Check if email is verified (OAuth users are automatically verified)
        const isOAuthUser = firebaseUser.providerData.some(
          provider => provider.providerId === 'google.com'
        )
        
        if (!firebaseUser.emailVerified && !isOAuthUser) {
          // Email not verified - don't allow access
          console.log('User email not verified')
          setUnverifiedUser(firebaseUser)
          setUser(null)
          localStorage.removeItem('reliever-auth-cache')
          setLoading(false)
          return
        }

        // User signed in with verified email - verify token and sync with Supabase
        setUnverifiedUser(null)
        
        // Create minimal cache object
        const cacheData = {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName,
          photoURL: firebaseUser.photoURL,
          emailVerified: firebaseUser.emailVerified
        }
        
        // Set cached user immediately for UI responsiveness
        setUser(firebaseUser)
        localStorage.setItem('reliever-auth-cache', JSON.stringify(cacheData))
        
        try {
          const idToken = await firebaseUser.getIdToken()
          
          const response = await fetch('/api/auth/verify-token', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ idToken }),
          })

          if (response.ok) {
            const data = await response.json()
            // Attach Supabase user data to Firebase user
            const enrichedUser: AuthUser = Object.assign(firebaseUser, {
              supabaseId: data.user.id,
              supabaseData: data.user,
            })
            setUser(enrichedUser)
            
            // Identify user in PostHog with relevant properties
            posthog.identify(
              data.user.id, // Use Supabase ID as distinct ID
              {
                email: firebaseUser.email,
                name: firebaseUser.displayName || data.user.name,
                firebase_uid: firebaseUser.uid,
                email_verified: firebaseUser.emailVerified,
                auth_provider: firebaseUser.providerData[0]?.providerId || 'email',
              }
            )
          } else {
            console.error('Failed to verify token with backend')
          }
        } catch (error) {
          console.error('Error verifying token:', error)
        }
      } else {
        // User signed out - only clear if we were actually signed in
        setUser(null)
        setUnverifiedUser(null)
        localStorage.removeItem('reliever-auth-cache')
      }
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  const signOut = async () => {
    await firebaseSignOut(auth)
    setUser(null)
    setUnverifiedUser(null)
    // Clear all user-specific caches
    localStorage.removeItem('reliever-auth-cache')
    localStorage.removeItem('reliever-current-vessel-id')
    localStorage.removeItem('reliever-vessels-cache')
    // Reset PostHog identification
    posthog.reset()
  }

  return (
    <AuthContext.Provider value={{ user, loading, unverifiedUser, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
