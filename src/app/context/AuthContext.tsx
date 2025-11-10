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
  const [user, setUser] = useState<AuthUser | null>(null)
  const [unverifiedUser, setUnverifiedUser] = useState<FirebaseUser | null>(null)
  const [loading, setLoading] = useState(true)

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
          setLoading(false)
          return
        }

        // User signed in with verified email - verify token and sync with Supabase
        setUnverifiedUser(null)
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
          } else {
            console.error('Failed to verify token with backend')
            setUser(firebaseUser)
          }
        } catch (error) {
          console.error('Error verifying token:', error)
          setUser(firebaseUser)
        }
      } else {
        // User signed out
        setUser(null)
        setUnverifiedUser(null)
      }
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  const signOut = async () => {
    await firebaseSignOut(auth)
    setUser(null)
    setUnverifiedUser(null)
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
