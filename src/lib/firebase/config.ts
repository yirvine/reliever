/**
 * Firebase Client Configuration
 * 
 * This file initializes the Firebase SDK for client-side authentication.
 * Environment variables must be set in .env.local:
 * - NEXT_PUBLIC_FIREBASE_API_KEY
 * - NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
 * - NEXT_PUBLIC_FIREBASE_PROJECT_ID
 * - NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
 * - NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
 * - NEXT_PUBLIC_FIREBASE_APP_ID
 */

import { initializeApp, getApps, FirebaseApp } from 'firebase/app'
import { getAuth, Auth } from 'firebase/auth'

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

// Initialize Firebase (singleton pattern)
let app: FirebaseApp
let auth: Auth

if (!getApps().length) {
  console.log('🔧 Initializing Firebase with config:', {
    apiKey: firebaseConfig.apiKey?.substring(0, 10) + '...',
    authDomain: firebaseConfig.authDomain,
    projectId: firebaseConfig.projectId,
    storageBucket: firebaseConfig.storageBucket,
    messagingSenderId: firebaseConfig.messagingSenderId,
    appId: firebaseConfig.appId?.substring(0, 20) + '...',
  })
  
  app = initializeApp(firebaseConfig)
  auth = getAuth(app)
  
  // Debug: Log auth domain being used
  console.log('✅ Firebase initialized successfully')
  console.log('🔧 Auth domain:', firebaseConfig.authDomain)
  console.log('🔧 Project ID:', firebaseConfig.projectId)
  console.log('🔧 Auth instance:', {
    currentUser: auth.currentUser,
    name: auth.name,
    config: {
      apiKey: auth.config.apiKey?.substring(0, 10) + '...',
      authDomain: auth.config.authDomain,
    }
  })
  
  if (!firebaseConfig.authDomain?.includes('firebaseapp.com')) {
    console.warn('⚠️ WARNING: authDomain should be *.firebaseapp.com for email verification to work!')
    console.warn('⚠️ Current authDomain:', firebaseConfig.authDomain)
    console.warn('⚠️ Expected: reliefguard-c1a3c.firebaseapp.com')
  }
  
  // Verify project ID
  if (firebaseConfig.projectId !== 'reliefguard-c1a3c') {
    console.error('❌ WRONG PROJECT ID! Expected: reliefguard-c1a3c, Got:', firebaseConfig.projectId)
  }
} else {
  app = getApps()[0]
  auth = getAuth(app)
  console.log('🔄 Firebase already initialized, reusing instance')
}

export { app, auth }

