'use client'

/**
 * AuthModal - Firebase Authentication
 * 
 * Beautiful authentication modal with email/password and Google OAuth via Firebase.
 * Handles both sign in and sign up flows with smooth transitions.
 */

import { useState } from 'react'
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  sendEmailVerification,
} from 'firebase/auth'
import { auth } from '@/lib/firebase/config'

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  if (!isOpen) return null

  const showSuccessAndClose = () => {
    setSuccess(true)
    setTimeout(() => {
      setSuccess(false)
      onClose()
    }, 1200) // Show checkmark for 1.2 seconds
  }

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setMessage(null)

    try {
      if (mode === 'signin') {
        await signInWithEmailAndPassword(auth, email, password)
        // Success - show checkmark and close
        showSuccessAndClose()
      } else {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password)
        
        // Send email verification
        try {
          await sendEmailVerification(userCredential.user)
          setMessage('Verification email sent! Please check your inbox.')
        } catch (verifyError) {
          console.error('Failed to send verification email:', verifyError)
          // Don't block login if verification email fails
        }
        
        // Success - show checkmark and close
        showSuccessAndClose()
      }
    } catch (err) {
      const firebaseError = err as { code?: string; message?: string }
      
      // Provide user-friendly error messages
      let errorMessage = firebaseError.message || 'An error occurred'
      
      if (firebaseError.code === 'auth/email-already-in-use') {
        errorMessage = 'This email is already registered. Try signing in instead.'
      } else if (firebaseError.code === 'auth/weak-password') {
        errorMessage = 'Password should be at least 6 characters.'
      } else if (firebaseError.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email address.'
      } else if (firebaseError.code === 'auth/user-not-found' || firebaseError.code === 'auth/wrong-password') {
        errorMessage = 'Invalid email or password.'
      } else if (firebaseError.code === 'auth/invalid-credential') {
        errorMessage = 'Invalid email or password.'
      }
      
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleAuth = async () => {
    setLoading(true)
    setError(null)

    try {
      const provider = new GoogleAuthProvider()
      await signInWithPopup(auth, provider)
      // Success - show checkmark and close
      showSuccessAndClose()
    } catch (err) {
      const firebaseError = err as { code?: string; message?: string }
      
      // Handle popup closed by user
      if (firebaseError.code === 'auth/popup-closed-by-user' || firebaseError.code === 'auth/cancelled-popup-request') {
        // Don't show error for user-cancelled popups
        setLoading(false)
        return
      }
      
      setError(firebaseError.message || 'An error occurred')
      setLoading(false)
    }
  }

  const toggleMode = () => {
    setMode(mode === 'signin' ? 'signup' : 'signin')
    setError(null)
    setMessage(null)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="relative w-full max-w-md rounded-xl bg-white p-8 shadow-2xl">
        {/* Success Overlay */}
        {success && (
          <div className="absolute inset-0 z-10 bg-white rounded-xl flex items-center justify-center">
            <div className="text-center">
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4 animate-bounce">
                <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-lg font-semibold text-gray-900">Success!</p>
              <p className="text-sm text-gray-600 mt-1">Signing you in...</p>
            </div>
          </div>
        )}

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 transition-colors"
          aria-label="Close"
          disabled={success}
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Header */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900">
            {mode === 'signin' ? 'Welcome back' : 'Create account'}
          </h2>
          <p className="mt-1 text-sm text-gray-600">
            {mode === 'signin' 
              ? 'Sign in to access your vessels and cases' 
              : 'Sign up to save vessels and generate reports'}
          </p>
        </div>

        {/* Error/Success messages */}
        {error && (
          <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-800">
            {error}
          </div>
        )}
        {message && (
          <div className="mb-4 rounded-lg bg-green-50 p-3 text-sm text-green-800">
            {message}
          </div>
        )}

        {/* Google Sign In */}
        <button
          onClick={handleGoogleAuth}
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 rounded-lg border-2 border-gray-300 bg-white px-4 py-3 font-medium text-gray-700 transition-all hover:bg-gray-50 hover:border-gray-400 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Continue with Google
        </button>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="bg-white px-4 text-gray-500">Or continue with email</span>
          </div>
        </div>

        {/* Email/Password Form */}
        <form onSubmit={handleEmailAuth} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
              placeholder="you@example.com"
              disabled={loading}
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
              placeholder="••••••••"
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-blue-600 px-4 py-3 font-semibold text-white transition-all hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Loading...' : mode === 'signin' ? 'Sign in' : 'Sign up'}
          </button>
        </form>

        {/* Toggle mode */}
        <div className="mt-6 text-center text-sm">
          <span className="text-gray-600">
            {mode === 'signin' ? "Don't have an account? " : 'Already have an account? '}
          </span>
          <button
            onClick={toggleMode}
            className="font-semibold text-blue-600 hover:text-blue-700 transition-colors"
            disabled={loading}
          >
            {mode === 'signin' ? 'Sign up' : 'Sign in'}
          </button>
        </div>
      </div>
    </div>
  )
}
