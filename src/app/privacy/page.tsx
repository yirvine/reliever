import Header from '../components/Header'
import PageTransition from '../components/PageTransition'
import Link from 'next/link'

export default function PrivacyPolicy() {
  return (
    <PageTransition>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100">
        <Header />
        
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-16">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 sm:p-12">
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">Privacy Policy</h1>
            <p className="text-sm text-gray-500 mb-8">Last Updated: November 10, 2025</p>

            <div className="prose prose-slate max-w-none space-y-6">
              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mb-3">1. Introduction</h2>
                <p className="text-gray-700">
                  ReliefGuard ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy 
                  explains how we collect, use, and safeguard your information when you use our pressure relief 
                  sizing application.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mb-3">2. Information We Collect</h2>
                <h3 className="text-xl font-medium text-gray-800 mb-2">Account Information</h3>
                <p className="text-gray-700 mb-3">When you create an account, we collect:</p>
                <ul className="list-disc list-inside text-gray-700 space-y-1 mb-4">
                  <li>Email address</li>
                  <li>Name (if provided via Google OAuth)</li>
                  <li>Profile photo (if provided via Google OAuth)</li>
                </ul>

                <h3 className="text-xl font-medium text-gray-800 mb-2">Application Data</h3>
                <p className="text-gray-700 mb-3">When you use ReliefGuard, we store:</p>
                <ul className="list-disc list-inside text-gray-700 space-y-1">
                  <li>Vessel properties (MAWP, dimensions, design specifications)</li>
                  <li>Calculation cases and inputs</li>
                  <li>Generated reports</li>
                  <li>Usage data and timestamps</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mb-3">3. How We Use Your Information</h2>
                <p className="text-gray-700 mb-3">We use your information to:</p>
                <ul className="list-disc list-inside text-gray-700 space-y-1">
                  <li>Provide and maintain the ReliefGuard service</li>
                  <li>Save your vessel configurations and calculation history</li>
                  <li>Generate and store PDF reports</li>
                  <li>Authenticate your identity and secure your account</li>
                  <li>Improve our application and user experience</li>
                  <li>Communicate with you about service updates</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mb-3">4. Third-Party Services</h2>
                <p className="text-gray-700 mb-3">
                  ReliefGuard uses the following trusted third-party services to provide our application:
                </p>
                
                <div className="space-y-3">
                  <div>
                    <h3 className="text-lg font-medium text-gray-800">Firebase Authentication (Google)</h3>
                    <p className="text-gray-700">
                      Handles user authentication and sign-in (email/password and Google OAuth). 
                      See <a href="https://firebase.google.com/support/privacy" className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">Firebase Privacy Policy</a>.
                    </p>
                  </div>

                  <div>
                    <h3 className="text-lg font-medium text-gray-800">Supabase (PostgreSQL Database)</h3>
                    <p className="text-gray-700">
                      Stores your vessel data, calculation cases, and reports. 
                      See <a href="https://supabase.com/privacy" className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">Supabase Privacy Policy</a>.
                    </p>
                  </div>

                  <div>
                    <h3 className="text-lg font-medium text-gray-800">Vercel (Hosting)</h3>
                    <p className="text-gray-700">
                      Hosts and delivers the ReliefGuard application. 
                      See <a href="https://vercel.com/legal/privacy-policy" className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">Vercel Privacy Policy</a>.
                    </p>
                  </div>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mb-3">5. Data Security</h2>
                <p className="text-gray-700 mb-3">
                  We take data security seriously and implement industry-standard security measures:
                </p>
                <ul className="list-disc list-inside text-gray-700 space-y-1">
                  <li>All connections use HTTPS/TLS encryption</li>
                  <li>Passwords are hashed and never stored in plain text</li>
                  <li>Authentication tokens are securely managed by Firebase</li>
                  <li>Database access is restricted and authenticated</li>
                  <li>Regular security updates and monitoring</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mb-3">6. Data Retention</h2>
                <p className="text-gray-700">
                  We retain your account and application data for as long as your account is active. 
                  You may request deletion of your account and all associated data at any time by contacting us.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mb-3">7. Your Rights</h2>
                <p className="text-gray-700 mb-3">You have the right to:</p>
                <ul className="list-disc list-inside text-gray-700 space-y-1">
                  <li>Access your personal data</li>
                  <li>Correct inaccurate data</li>
                  <li>Request deletion of your data</li>
                  <li>Export your data</li>
                  <li>Opt-out of communications</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mb-3">8. Cookies and Tracking</h2>
                <p className="text-gray-700">
                  ReliefGuard uses essential cookies for authentication and session management. We do not use 
                  third-party advertising cookies or tracking pixels.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mb-3">9. Children's Privacy</h2>
                <p className="text-gray-700">
                  ReliefGuard is intended for professional use by engineers and is not directed to children 
                  under 13. We do not knowingly collect information from children.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mb-3">10. International Users</h2>
                <p className="text-gray-700">
                  ReliefGuard is hosted in the United States. By using our service, you consent to the transfer 
                  and processing of your data in the United States and other countries where our service providers operate.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mb-3">11. Changes to This Policy</h2>
                <p className="text-gray-700">
                  We may update this Privacy Policy from time to time. We will notify you of significant changes 
                  by posting the new policy on this page and updating the "Last Updated" date.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mb-3">12. Contact Us</h2>
                <p className="text-gray-700">
                  If you have questions about this Privacy Policy or your data, please contact us at:{' '}
                  <a href="mailto:support@reliefguard.ca" className="text-blue-600 hover:underline">
                    support@reliefguard.ca
                  </a>
                </p>
              </section>

              <div className="mt-8 pt-6 border-t border-gray-200">
                <Link href="/" className="text-blue-600 hover:underline">
                  ← Back to ReliefGuard
                </Link>
              </div>
            </div>
          </div>
        </main>
      </div>
    </PageTransition>
  )
}

