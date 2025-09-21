'use client'

import Link from 'next/link'
import Header from './components/Header'
import PageTransition from './components/PageTransition'

export default function Home() {
  const scrollToHowItWorks = () => {
    const element = document.getElementById('how-it-works')
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' })
    }
  }

  return (
    <PageTransition>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100">
        <Header />

        {/* Hero Section */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6 font-inter">
              Relief Valve Sizing Made Easy
            </h1>
            <p className="text-lg md:text-xl text-gray-600 max-w-4xl mx-auto mb-12 font-inter leading-relaxed">
              Calculate the required vessel relieving rate for common scenarios in accordance with NFPA 30, API 521, and ASME VIII standards to properly size your relief device.
            </p>
            
            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-20">
              <Link 
                href="/calc"
                className="bg-gradient-to-r from-slate-600 to-slate-700 hover:from-slate-700 hover:to-slate-800 text-white px-8 py-4 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5 flex items-center space-x-2 text-lg"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <span>Get Started</span>
              </Link>
              
              <button 
                onClick={scrollToHowItWorks}
                className="bg-white border-2 border-gray-300 hover:border-gray-400 text-gray-700 hover:text-gray-900 px-8 py-4 rounded-xl font-semibold shadow-sm hover:shadow-md transition-all duration-300 flex items-center space-x-2 text-lg"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Learn More</span>
              </button>
            </div>
          </div>
        </main>

        {/* How It Works Section */}
        <section id="how-it-works" className="bg-white py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4 font-inter">
                How It Works
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto font-inter">
                Three simple steps to calculate your relief valve requirements
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 lg:gap-12">
              {/* Step 1 */}
              <div className="text-center">
                <div className="bg-slate-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-6">
                  <span className="text-2xl font-bold text-slate-700 font-inter">1</span>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4 font-inter">
                  Select Relevant Cases
                </h3>
                <p className="text-gray-600 font-inter">
                  Choose from common vessel relieving scenarios such as external fire, control valve failure, blocked discharge, and more, based on both your system design and environmental conditions.
                </p>
              </div>

              {/* Step 2 */}
              <div className="text-center">
                <div className="bg-slate-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-6">
                  <span className="text-2xl font-bold text-slate-700 font-inter">2</span>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4 font-inter">
                  Calculate Design Flow
                </h3>
                <p className="text-gray-600 font-inter">
                  Enter vessel properties, operating conditions, and fluid data. ReliefGuard applies NFPA 30, API 521, and ASME VIII methodology to calculate the required relieving flow rate.
                </p>
              </div>

              {/* Step 3 */}
              <div className="text-center">
                <div className="bg-slate-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-6">
                  <span className="text-2xl font-bold text-slate-700 font-inter">3</span>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4 font-inter">
                  Document & Size
                </h3>
                <p className="text-gray-600 font-inter">
                  Use the calculated flow to size a relief valve or rupture disc in FluidFlow (or similar software), then return to ReliefGuard to record the selected device and generate a final, standards-compliant report.
                </p>
              </div>
            </div>

            {/* CTA at bottom of How It Works */}
            <div className="text-center mt-16">
              <Link 
                href="/calc"
                className="bg-gradient-to-r from-slate-600 to-slate-700 hover:from-slate-700 hover:to-slate-800 text-white px-8 py-4 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5 inline-flex items-center space-x-2"
              >
                <span>Start Calculating</span>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="bg-gray-50 py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <p className="text-gray-500 font-inter">
              Built for engineers, by engineers. Following NFPA 30, API 521, and ASME VIII standards.
            </p>
          </div>
        </footer>
      </div>
    </PageTransition>
  )
}