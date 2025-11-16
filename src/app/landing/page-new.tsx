'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import Header from '../components/Header'

export default function LandingNew() {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true)
    }, 100)
    return () => clearTimeout(timer)
  }, [])

  const scrollToHowItWorks = () => {
    const element = document.getElementById('how-it-works')
    if (element) {
      const elementPosition = element.getBoundingClientRect().top + window.pageYOffset
      const offsetPosition = elementPosition - 100 // Scroll to 100px above the section
      
      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      })
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 relative overflow-hidden">
      <Header />

      {/* Full-screen Hero Section with Background Image */}
      <section className="relative h-screen flex items-center justify-center bg-black">
        {/* Background Image */}
        <div className="absolute inset-0 z-0">
          <Image 
            src="/pressure_vessel_bw.jpeg" 
            alt="" 
            fill
            className="object-cover object-center opacity-60"
            priority
            unoptimized
          />
          {/* Dark overlay for better text contrast */}
          <div className="absolute inset-0 bg-black/40" />
        </div>

        {/* Content */}
        <div className="relative z-10 w-full max-w-7xl mx-auto px-8 sm:px-12 lg:px-16 -mt-24">
          <div className={`max-w-4xl mx-auto text-center transition-all duration-1000 ease-out ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}>
            {/* Main Heading */}
            <h1 className="text-white font-figtree text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold mb-8 leading-tight">
              Relief sizing<br />
              made simple.
            </h1>

            {/* Subtitle */}
            <p className="text-white/90 font-figtree text-lg sm:text-xl mb-12">
              A fast, reliable tool for relief-flow calculations in overpressure scenarios.
            </p>

            {/* Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {/* Get Started Button - White */}
              <Link 
                href="/cases"
                className="group inline-flex items-center justify-between bg-white text-black px-8 py-4 rounded-full font-figtree font-semibold text-lg hover:bg-gray-100 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                <span>Get Started</span>
                <div className="ml-4 w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center group-hover:bg-slate-800 transition-colors">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </div>
              </Link>

              {/* Learn More Button - Navy with white circle and black arrow */}
              <button 
                onClick={scrollToHowItWorks}
                className="group inline-flex items-center justify-between bg-slate-700 text-white px-8 py-4 rounded-full font-figtree font-semibold text-lg hover:bg-slate-800 transition-all duration-300 shadow-lg"
              >
                <span>Learn More</span>
                <div className="ml-4 w-10 h-10 rounded-full bg-white flex items-center justify-center transition-colors">
                  <svg className="w-5 h-5 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </div>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="relative bg-gray-50 pt-12 pb-12">
        <div className="max-w-7xl mx-auto px-8 sm:px-12 lg:px-16">
          <div className="grid lg:grid-cols-[1.5fr_3fr] gap-6 lg:gap-8 items-start mb-4">
            {/* Image */}
            <div className="order-2 lg:order-1">
              <div className="relative aspect-[3/4] rounded-3xl overflow-hidden shadow-xl">
                <Image 
                  src="/PressureReliefValves3.png" 
                  alt="Industrial pressure relief valves system" 
                  fill
                  className="object-cover"
                  unoptimized
                />
              </div>
            </div>

            {/* Content */}
            <div className="order-1 lg:order-2">
              <h2 className="text-4xl sm:text-5xl lg:text-[3rem] font-bold text-black mb-4 font-figtree">
                How it Works
              </h2>

              <div className="space-y-3">
                {/* Step 1 */}
                <div className="bg-white rounded-2xl p-5 hover:shadow-md transition-shadow">
                  <h3 className="text-xl font-bold text-black mb-2 font-figtree">
                    1. Select Your Cases
                  </h3>
                  <p className="text-lg text-gray-800 font-figtree leading-relaxed">
                    Based on your system design and operating environment, choose applicable overpressure scenarios, such as external fire exposure, control-valve failure, or blocked outlet discharge.
                  </p>
                </div>

                {/* Step 2 */}
                <div className="bg-white rounded-2xl p-5 hover:shadow-md transition-shadow">
                  <h3 className="text-xl font-bold text-black mb-2 font-figtree">
                    2. Determine Design Flow
                  </h3>
                  <p className="text-lg text-gray-800 font-figtree leading-relaxed">
                    Enter vessel properties, operating conditions, and fluid data. NFPA, API, and ASME standards are applied to calculate the relieving flow rate for each selected overpressure scenario.
                  </p>
                </div>

                {/* Step 3 */}
                <div className="bg-white rounded-2xl p-5 hover:shadow-md transition-shadow">
                  <h3 className="text-xl font-bold text-black mb-2 font-figtree">
                    3. Size & Document
                  </h3>
                  <p className="text-lg text-gray-800 font-figtree leading-relaxed">
                    Use the design-basis flow identified by ReliefGuard (the most severe relieving case) to size your relief device in your preferred hydraulic simulation tool. Then record the selected valve or rupture disc to generate a standards-compliant report.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Get Started Button - Centered below everything */}
          <div className="flex justify-center">
            <Link 
              href="/cases"
              className="group inline-flex items-center justify-between bg-white text-black px-8 py-4 rounded-full font-figtree font-semibold text-lg hover:bg-gray-100 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 border-2 border-gray-200"
            >
              <span>Get Started</span>
              <div className="ml-4 w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center group-hover:bg-slate-800 transition-colors">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-50 py-4">
        <div className="max-w-7xl mx-auto px-8 sm:px-12 lg:px-16 text-center">
          <div className="flex justify-center gap-4 text-sm text-gray-600 font-figtree">
            <Link href="/privacy" className="hover:text-blue-600 transition-colors">
              Privacy Policy
            </Link>
            <span>•</span>
            <Link href="/terms" className="hover:text-blue-600 transition-colors">
              Terms of Service
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}

