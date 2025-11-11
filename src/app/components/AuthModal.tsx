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
  const [verificationSent, setVerificationSent] = useState(false)
  const [verificationEmail, setVerificationEmail] = useState<string>('')

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
        
        // Wait a moment for Firebase to fully initialize the user
        // Then use auth.currentUser (as recommended by Firebase docs)
        await new Promise(resolve => setTimeout(resolve, 100))
        
        const currentUser = auth.currentUser
        if (!currentUser) {
          throw new Error('User was created but currentUser is null')
        }
        
        // Send email verification using currentUser
        try {
          console.group('📧 ═══ SENDING EMAIL VERIFICATION ═══')
          console.log('⏰ Timestamp:', new Date().toISOString())
          console.log('👤 User email:', currentUser.email)
          console.log('🆔 User UID:', currentUser.uid)
          console.log('✓ User emailVerified (before send):', currentUser.emailVerified)
          console.log('🔑 User providerData:', currentUser.providerData)
          console.log('🌐 Auth domain:', auth.config.authDomain)
          console.log('🔐 API key (first 10):', auth.config.apiKey?.substring(0, 10) + '...')
          console.log('🏗️ Project ID:', auth.app.options.projectId)
          
          // Configure redirect URL after email verification
          // Note: The URL must be in Firebase's authorized domains
          // If you get auth/unauthorized-continue-uri, add the domain in Firebase Console
          const actionCodeSettings = {
            url: typeof window !== 'undefined' 
              ? `${window.location.origin}/?emailVerified=true`
              : 'https://www.reliefguard.ca/?emailVerified=true',
            handleCodeInApp: false, // Open link in browser, not in-app
          }
          
          console.log('🔗 ActionCodeSettings:', JSON.stringify(actionCodeSettings, null, 2))
          console.log('📤 Calling Firebase sendEmailVerification()...')
          
          const startTime = performance.now()
          await sendEmailVerification(currentUser, actionCodeSettings)
          const endTime = performance.now()
          const duration = Math.round(endTime - startTime)
          
          console.log(`✅ sendEmailVerification() completed successfully in ${duration}ms`)
          console.log('')
          console.warn('⚠️  CRITICAL: No error ≠ Email delivered!')
          console.log('')
          console.log('📊 NEXT STEP - Verify email was actually sent:')
          console.log('   1. Open: https://console.firebase.google.com/')
          console.log('   2. Select project: reliefguard-c1a3c')
          console.log('   3. Click: Usage tab (or Usage and billing)')
          console.log('   4. Look for: "Authentication" or "Email verifications"')
          console.log('   5. Expected: Count should be 1+ (not 0)')
          console.log('')
          console.log('❌ IF USAGE SHOWS 0 EMAILS SENT:')
          console.log('   → Firebase is NOT sending emails (config issue)')
          console.log('   → Most likely causes:')
          console.log('     • No payment method added (even on free tier)')
          console.log('     • Email template "From email" is blank/wrong')
          console.log('     • Gmail API disabled in Google Cloud Console')
          console.log('   → See: docs/EMAIL_VERIFICATION_TROUBLESHOOT.md')
          console.log('')
          console.log('🌐 Network status:', navigator.onLine ? 'Online ✅' : 'Offline ❌')
          console.log('🔌 Connection type:', (navigator as any).connection?.effectiveType || 'Unknown')
          console.groupEnd()
          
          // Summary diagnostic
          console.log('')
          console.log('═══════════════════════════════════════════')
          console.log('📋 DIAGNOSTIC SUMMARY')
          console.log('═══════════════════════════════════════════')
          console.log('✅ Code execution: Success (no errors thrown)')
          console.log('✅ Auth domain: reliefguard-c1a3c.firebaseapp.com')
          console.log('✅ User created: ' + currentUser.uid)
          console.log('✅ Firebase call: sendEmailVerification() completed')
          console.log('❓ Email delivery: UNKNOWN (check Usage tab)')
          console.log('')
          console.log('🎯 ACTION REQUIRED:')
          console.log('   Go to Firebase Console → Usage tab')
          console.log('   If count is 0: Firebase backend issue')
          console.log('   If count is 1+: Email provider blocking')
          console.log('═══════════════════════════════════════════')
          console.log('')
          
          // Show verification screen instead of closing modal
          setVerificationEmail(currentUser.email || email)
          setVerificationSent(true)
          setLoading(false)
        } catch (verifyError) {
          console.group('❌ ═══ EMAIL VERIFICATION FAILED ═══')
          console.error('Full error object:', verifyError)
          
          const firebaseError = verifyError as { 
            code?: string
            message?: string
            name?: string
            stack?: string
            customData?: unknown
          }
          
          console.error('Error code:', firebaseError.code)
          console.error('Error message:', firebaseError.message)
          console.error('Error name:', firebaseError.name)
          console.error('Error customData:', firebaseError.customData)
          
          // Common error codes and what they mean:
          console.log('')
          console.log('🔍 Common error codes:')
          console.log('  • auth/unauthorized-continue-uri → Domain not in authorized domains')
          console.log('  • auth/invalid-continue-uri → Malformed redirect URL')
          console.log('  • auth/missing-continue-uri → No redirect URL provided')
          console.log('  • auth/quota-exceeded → Daily email limit reached')
          console.log('  • auth/too-many-requests → Rate limited')
          console.groupEnd()
          
          // Don't close modal if email fails - show error
          setError(`Account created, but email failed: ${firebaseError.message || 'Unknown error'}`)
          setLoading(false)
          return // Don't close modal
        }
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
    setVerificationSent(false) // Reset verification screen
  }

  const handleResendVerification = async () => {
    setLoading(true)
    setError(null)
    setMessage(null)

    try {
      const currentUser = auth.currentUser
      if (!currentUser) {
        setError('No user found. Please sign up again.')
        setLoading(false)
        return
      }

      console.group('🔄 ═══ RESENDING EMAIL VERIFICATION ═══')
      console.log('⏰ Timestamp:', new Date().toISOString())
      console.log('👤 User email:', currentUser.email)
      console.log('🆔 User UID:', currentUser.uid)
      console.log('🌐 Auth domain:', auth.config.authDomain)
      
      const actionCodeSettings = {
        url: typeof window !== 'undefined' 
          ? `${window.location.origin}/?emailVerified=true`
          : 'https://www.reliefguard.ca/?emailVerified=true',
        handleCodeInApp: false,
      }

      console.log('🔗 ActionCodeSettings:', JSON.stringify(actionCodeSettings, null, 2))
      console.log('📤 Calling Firebase sendEmailVerification()...')
      
      const startTime = performance.now()
      await sendEmailVerification(currentUser, actionCodeSettings)
      const endTime = performance.now()
      const duration = Math.round(endTime - startTime)
      
      console.log(`✅ Resend completed in ${duration}ms`)
      console.log('📊 Check Firebase Usage tab to verify')
      console.groupEnd()
      
      setMessage('Verification email resent! Check your inbox.')
      setLoading(false)
    } catch (err) {
      const firebaseError = err as { code?: string; message?: string }
      setError(firebaseError.message || 'Failed to resend email')
      setLoading(false)
    }
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
            {verificationSent ? 'Check your email' : mode === 'signin' ? 'Welcome back' : 'Create account'}
          </h2>
          <p className="mt-1 text-sm text-gray-600">
            {verificationSent 
              ? `We sent a verification link to ${verificationEmail}`
              : mode === 'signin' 
                ? 'Sign in to access your vessels and cases' 
                : 'Sign up to save vessels and generate reports'}
          </p>
        </div>

        {/* Verification Screen */}
        {verificationSent ? (
          <div className="space-y-6">
            {/* Email Icon */}
            <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
              <svg className="w-10 h-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>

            {/* Error/Success messages */}
            {error && (
              <div className="rounded-lg bg-red-50 p-3 text-sm text-red-800">
                {error}
              </div>
            )}
            {message && (
              <div className="rounded-lg bg-green-50 p-3 text-sm text-green-800">
                {message}
              </div>
            )}

            {/* Instructions */}
            <div className="text-center space-y-2">
              <p className="text-sm text-gray-700">
                Click the link in the email to verify your account. Once verified, you can sign in.
              </p>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-2 mt-2">
                <p className="text-xs font-medium text-yellow-800">
                  ⚠️ Check your SPAM folder! Verification emails often land there.
                </p>
              </div>
            </div>

            {/* Resend button */}
            <button
              onClick={handleResendVerification}
              disabled={loading}
              className="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Sending...' : 'Resend verification email'}
            </button>

            {/* Back to sign in */}
            <button
              onClick={() => {
                setVerificationSent(false)
                setMode('signin')
              }}
              className="w-full text-sm text-blue-600 hover:text-blue-700 transition-colors"
            >
              ← Back to sign in
            </button>
          </div>
        ) : (
          <>
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
          </>
        )}
      </div>
    </div>
  )
}
