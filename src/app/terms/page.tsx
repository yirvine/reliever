import Header from '../components/Header'
import PageTransition from '../components/PageTransition'
import Link from 'next/link'

export default function TermsOfService() {
  return (
    <PageTransition>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100">
        <Header />
        
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-16">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 sm:p-12">
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">Terms of Service</h1>
            <p className="text-sm text-gray-500 mb-8">Last Updated: November 10, 2025</p>

            <div className="prose prose-slate max-w-none space-y-6">
              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mb-3">1. Acceptance of Terms</h2>
                <p className="text-gray-700">
                  By accessing and using ReliefGuard, you accept and agree to be bound by these Terms of Service. 
                  If you do not agree to these terms, please do not use our service.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mb-3">2. Description of Service</h2>
                <p className="text-gray-700">
                  ReliefGuard is a web-based pressure relief sizing tool that helps chemical and process engineers 
                  calculate relief device requirements for pressure vessels under various overpressure scenarios 
                  according to API-521, ASME Section VIII, and related standards.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mb-3">3. Professional Use and Disclaimer</h2>
                
                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
                  <p className="text-yellow-800 font-semibold">IMPORTANT ENGINEERING NOTICE</p>
                </div>

                <p className="text-gray-700 mb-3">
                  ReliefGuard is a calculation tool intended for use by qualified professional engineers. 
                  By using this service, you acknowledge that:
                </p>
                <ul className="list-disc list-inside text-gray-700 space-y-2">
                  <li>
                    <strong>Professional Responsibility:</strong> All calculations and designs must be reviewed 
                    and approved by a licensed Professional Engineer (P.E.) or equivalent qualified professional.
                  </li>
                  <li>
                    <strong>No Warranty:</strong> ReliefGuard is provided &quot;as-is&quot; without warranties of any kind. 
                    We do not guarantee the accuracy, completeness, or reliability of any calculations.
                  </li>
                  <li>
                    <strong>User Verification:</strong> You are solely responsible for verifying all inputs, 
                    outputs, and calculations produced by ReliefGuard.
                  </li>
                  <li>
                    <strong>Code Compliance:</strong> You are responsible for ensuring compliance with all 
                    applicable codes, standards, and regulations in your jurisdiction.
                  </li>
                  <li>
                    <strong>Independent Judgment:</strong> ReliefGuard is a tool to assist engineering calculations, 
                    not a replacement for professional engineering judgment.
                  </li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mb-3">4. Limitation of Liability</h2>
                <p className="text-gray-700 mb-3">
                  TO THE MAXIMUM EXTENT PERMITTED BY LAW:
                </p>
                <ul className="list-disc list-inside text-gray-700 space-y-1">
                  <li>
                    ReliefGuard and its operators shall not be liable for any direct, indirect, incidental, 
                    special, consequential, or punitive damages arising from your use of the service.
                  </li>
                  <li>
                    We are not responsible for any losses, damages, or injuries resulting from calculations, 
                    designs, or decisions made using ReliefGuard.
                  </li>
                  <li>
                    We do not assume any liability for equipment failures, safety incidents, or regulatory 
                    non-compliance related to the use of our calculations.
                  </li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mb-3">5. User Accounts</h2>
                <p className="text-gray-700 mb-3">To use certain features of ReliefGuard, you must create an account. You agree to:</p>
                <ul className="list-disc list-inside text-gray-700 space-y-1">
                  <li>Provide accurate and complete information</li>
                  <li>Maintain the security of your account credentials</li>
                  <li>Notify us immediately of any unauthorized access</li>
                  <li>Accept responsibility for all activities under your account</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mb-3">6. Acceptable Use</h2>
                <p className="text-gray-700 mb-3">You agree not to:</p>
                <ul className="list-disc list-inside text-gray-700 space-y-1">
                  <li>Use ReliefGuard for any illegal or unauthorized purpose</li>
                  <li>Attempt to gain unauthorized access to our systems</li>
                  <li>Interfere with or disrupt the service</li>
                  <li>Reverse engineer or copy any part of the application</li>
                  <li>Share your account credentials with others</li>
                  <li>Use automated systems to access the service without permission</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mb-3">7. Intellectual Property</h2>
                <p className="text-gray-700 mb-3">
                  ReliefGuard and its original content, features, and functionality are owned by ReliefGuard 
                  and are protected by international copyright, trademark, and other intellectual property laws.
                </p>
                <p className="text-gray-700">
                  Your calculation inputs and results remain your property. We do not claim ownership of your data.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mb-3">8. Data Storage and Security</h2>
                <p className="text-gray-700 mb-3">
                  We use industry-standard security measures to protect your data:
                </p>
                <ul className="list-disc list-inside text-gray-700 space-y-1">
                  <li>Authentication via Firebase (Google Cloud Platform)</li>
                  <li>Secure database storage via Supabase (PostgreSQL)</li>
                  <li>All connections encrypted with HTTPS/TLS</li>
                  <li>Regular security updates and monitoring</li>
                </ul>
                <p className="text-gray-700 mt-3">
                  However, no method of transmission over the internet is 100% secure. You acknowledge that 
                  you use ReliefGuard at your own risk.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mb-3">9. Service Availability</h2>
                <p className="text-gray-700">
                  We strive to provide reliable service but do not guarantee uninterrupted access. We reserve 
                  the right to modify, suspend, or discontinue the service at any time without notice.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mb-3">10. Standards and References</h2>
                <p className="text-gray-700">
                  ReliefGuard implements calculations based on API-521, ASME Section VIII, NFPA 30, and other 
                  industry standards. Users are responsible for obtaining and referencing the current versions 
                  of these standards. We are not liable for any errors or omissions in our implementation.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mb-3">11. Termination</h2>
                <p className="text-gray-700">
                  We reserve the right to terminate or suspend your account at any time for violations of these 
                  Terms of Service. You may terminate your account at any time by contacting us. Upon termination, 
                  your right to use ReliefGuard will immediately cease.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mb-3">12. Changes to Terms</h2>
                <p className="text-gray-700">
                  We may modify these Terms of Service at any time. Significant changes will be posted on this 
                  page with an updated &quot;Last Updated&quot; date. Continued use of ReliefGuard after changes constitutes 
                  acceptance of the new terms.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mb-3">13. Governing Law</h2>
                <p className="text-gray-700">
                  These Terms shall be governed by and construed in accordance with the laws of the jurisdiction 
                  in which ReliefGuard operates, without regard to its conflict of law provisions.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mb-3">14. Contact Information</h2>
                <p className="text-gray-700">
                  For questions about these Terms of Service, please contact us at:{' '}
                  <a href="mailto:support@reliefguard.ca" className="text-blue-600 hover:underline">
                    support@reliefguard.ca
                  </a>
                </p>
              </section>

              <div className="mt-8 pt-6 border-t border-gray-200 flex items-center justify-between">
                <Link href="/" className="text-blue-600 hover:underline">
                  ← Back to ReliefGuard
                </Link>
                <Link href="/privacy" className="text-blue-600 hover:underline">
                  Privacy Policy →
                </Link>
              </div>
            </div>
          </div>
        </main>
      </div>
    </PageTransition>
  )
}

