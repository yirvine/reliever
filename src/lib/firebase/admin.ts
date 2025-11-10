/**
 * Firebase Admin SDK Configuration
 * 
 * This file initializes the Firebase Admin SDK for server-side token verification.
 * 
 * Required environment variables:
 * - FIREBASE_PROJECT_ID
 * - FIREBASE_CLIENT_EMAIL
 * - FIREBASE_PRIVATE_KEY (must be base64 encoded or properly escaped)
 * 
 * The private key should be stored in .env.local as a base64-encoded string
 * or with proper newline characters escaped.
 */

import { initializeApp, getApps, cert, App } from 'firebase-admin/app'
import { getAuth, Auth } from 'firebase-admin/auth'

let app: App
let adminAuth: Auth

if (!getApps().length) {
  app = initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      // Handle private key - it may be base64 encoded or have escaped newlines
      privateKey: process.env.FIREBASE_PRIVATE_KEY
        ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
        : undefined,
    }),
  })
  adminAuth = getAuth(app)
} else {
  app = getApps()[0]
  adminAuth = getAuth(app)
}

export { app as adminApp, adminAuth }

