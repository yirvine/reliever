'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import Header from './components/Header'
import PageTransition from './components/PageTransition'

export default function Home() {
  const [isVisible, setIsVisible] = useState(false)
  const [isFromHashLink, setIsFromHashLink] = useState(false)

  useEffect(() => {
    const hash = window.location.hash
    
    if (hash === '#how-it-works' || hash === '#about-reliefguard') {
      // Coming from hash link - show everything immediately
      setIsVisible(true)
      setIsFromHashLink(true)
    } else {
      // Normal page load - do the fade-in animation
      const timer = setTimeout(() => {
        setIsVisible(true)
      }, 100)
      return () => clearTimeout(timer)
    }
  }, [])

  const scrollToHowItWorks = () => {
    const element = document.getElementById('how-it-works')
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' })
    }
  }

  const scrollToAbout = () => {
    const element = document.getElementById('about-reliefguard')
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' })
    }
  }

  return (
    <PageTransition>
      <div className="min-h-screen bg-white relative">
        {/* Subtle background image spanning entire page */}
        <div className={`absolute inset-0 pointer-events-none z-0 transition-all duration-1000 ease-out ${
          isVisible ? 'opacity-10' : 'opacity-0'
        }`}>
          <Image 
            src="/pressure_vessel_bw.jpeg" 
            alt="" 
            fill
            className="object-cover object-center opacity-100"
            priority
            unoptimized
          />
        </div>
        <Header />

        {/* Valve Animation */}
        <div className={`flex justify-center pt-2 pb-1 transition-all duration-1000 ease-out ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
        }`}>
          <svg width="100mm" height="100mm" viewBox="60 95 100 105" stroke="#475569" strokeWidth="2" fill="none" className="w-40 h-40 mt-4">
            {/* Soft drop shadow filter with animated pulse */}
            <defs>
              <filter id="softShadow" x="-20%" y="-20%" width="140%" height="140%">
                <feDropShadow dx="0" dy="2" stdDeviation="1" floodOpacity="0.1">
                  <animate attributeName="flood-opacity" values="0.1;0.25;0.1" dur="6s" repeatCount="indefinite"/>
                </feDropShadow>
              </filter>
            </defs>
            
            {/* Valve group with shadow */}
            <g filter="url(#softShadow)">
              {/* Base */}
              <line x1="75" y1="183" x2="135" y2="183" />
              <rect x="85" y="120" width="30" height="50" />
              <rect x="90" y="170" width="20" height="13" />
              <rect x="115" y="135" width="20" height="10" />

            {/* Stem - extends vertically from valve body to cap */}
            <g id="valveStem">
              <line x1="94" y1="120" x2="94" y2="105">
                <animate attributeName="y2"
                  values="105;100;100;105"
                  keyTimes="0;0.25;0.5;0.75;1"
                  dur="6s" repeatCount="indefinite"
                  calcMode="spline"
                  keySplines=".25,.1,.25,1;0,0,1,1;.25,.1,.25,1;0,0,1,1"/>
              </line>
              <line x1="106" y1="120" x2="106" y2="105">
                <animate attributeName="y2"
                  values="105;100;100;105"
                  keyTimes="0;0.25;0.5;0.75;1"
                  dur="6s" repeatCount="indefinite"
                  calcMode="spline"
                  keySplines=".25,.1,.25,1;0,0,1,1;.25,.1,.25,1;0,0,1,1"/>
              </line>
            </g>

            {/* Cap - moves with stem */}
            <g id="valveCap" transform="translate(0,0)">
              <animateTransform attributeName="transform" type="translate"
                values="0 0;0 -5;0 -5;0 0;0 0"
                keyTimes="0;0.25;0.5;0.75;1"
                dur="6s" repeatCount="indefinite"
                calcMode="spline"
                keySplines=".25,.1,.25,1;0,0,1,1;.25,.1,.25,1;0,0,1,1"/>
              <rect x="85" y="105" width="30" height="10" fill="white"/>
            </g>
            </g>

            {/* Steam lines: faster extend/retract with hold */}
            <g>
              <line x1="140" y1="136" x2="140" y2="136">
                <animate attributeName="x2"
                  values="140;160;160;140;140"
                  keyTimes="0;0.292;0.458;0.75;1"
                  dur="6s"
                  calcMode="spline"
                  keySplines=".42,0,.58,1;0,0,1,1;.42,0,.58,1;0,0,1,1"
                  repeatCount="indefinite"/>
              </line>
              <line x1="140" y1="140" x2="140" y2="140">
                <animate attributeName="x2"
                  values="140;160;160;140;140"
                  keyTimes="0;0.292;0.458;0.75;1"
                  dur="6s"
                  calcMode="spline"
                  keySplines=".42,0,.58,1;0,0,1,1;.42,0,.58,1;0,0,1,1"
                  repeatCount="indefinite"/>
              </line>
              <line x1="140" y1="144" x2="140" y2="144">
                <animate attributeName="x2"
                  values="140;160;160;140;140"
                  keyTimes="0;0.292;0.458;0.75;1"
                  dur="6s"
                  calcMode="spline"
                  keySplines=".42,0,.58,1;0,0,1,1;.42,0,.58,1;0,0,1,1"
                  repeatCount="indefinite"/>
              </line>
            </g>
          </svg>
        </div>

        {/* Hero Section */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-0 pb-16 relative">
          <div className={`text-center transition-all duration-1000 ease-out relative z-10 ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}>
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6 font-inter drop-shadow-sm">
              Relief sizing made simple.
            </h1>
            <p className="text-lg md:text-xl text-gray-800 max-w-4xl mx-auto mb-12 font-inter leading-relaxed drop-shadow-xs">
              Calculate required relieving flow rates for pressure vessels confidently and efficiently.
            </p>
            
            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
              <Link 
                href="/cases"
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
        <section id="how-it-works" className={`bg-white/80 py-12 sm:py-16 lg:py-20 pt-20 sm:pt-24 lg:pt-32 transition-all duration-1000 ease-out delay-300 relative z-10 ${
          isVisible ? 'opacity-100' : 'opacity-0'
        }`}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-left mb-8 sm:mb-12 lg:mb-16">
              <h2 className="text-3xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-3 sm:mb-4 font-inter">
                How It Works
              </h2>
            </div>

            <div className="grid md:grid-cols-3 gap-6 sm:gap-8 lg:gap-12">
              {/* Step 1 */}
              <div className="text-left">
                <div className="bg-slate-100 rounded-full w-16 h-16 items-center justify-center mb-6 hidden sm:flex">
                  <span className="text-2xl font-bold text-slate-700 font-inter">1</span>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-6 font-inter text-left">
                  <span className="sm:hidden">1. </span>Select Relevant Cases
                </h3>
                <p className="text-base sm:text-lg text-gray-900 font-inter text-left">
                Based on your system design and operating environment, choose applicable overpressure scenarios, such as
                 external fire exposure, control-valve failure, or blocked outlet discharge.
                </p>
              </div>

              {/* Step 2 */}
              <div className="text-left">
                <div className="bg-slate-100 rounded-full w-16 h-16 items-center justify-center mb-6 hidden sm:flex">
                  <span className="text-2xl font-bold text-slate-700 font-inter">2</span>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-6 font-inter text-left">
                  <span className="sm:hidden">2. </span>Determine Design Flow
                </h3>
                <p className="text-base sm:text-lg text-gray-900 font-inter text-left">
                  Enter vessel properties, operating conditions, and fluid data. 
                  NFPA 30, API 521, and ASME VIII standards are applied to calculate
                  the required relieving flow rate for each applicable overpressure scenario.
                </p>
              </div>

              {/* Step 3 */}
              <div className="text-left">
                <div className="bg-slate-100 rounded-full w-16 h-16 items-center justify-center mb-6 hidden sm:flex">
                  <span className="text-2xl font-bold text-slate-700 font-inter">3</span>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-6 font-inter text-left">
                  <span className="sm:hidden">3. </span>Size & Document
                </h3>
                <p className="text-base sm:text-lg text-gray-900 font-inter text-left">
                Use the design-basis flow identified by ReliefGuard (the most severe relieving case)
                to size your relief device in your preferred hydraulic tool (e.g., FluidFlow or Aspen HYSYS).
                Then record the selected valve or rupture disc to generate a standards-compliant report.
                </p>
              </div>
            </div>

            {/* CTA buttons at bottom of How It Works */}
            <div className="text-center mt-16">
              <div className="flex flex-row gap-4 justify-center items-center">
                <Link
                  href="/cases"
                  className="bg-gradient-to-r from-slate-600 to-slate-700 hover:from-slate-700 hover:to-slate-800 text-white px-8 py-4 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5 inline-flex items-center space-x-2 text-lg"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  <span>Get Started</span>
                </Link>

                <button
                  onClick={scrollToAbout}
                  className="bg-white border-2 border-gray-300 hover:border-gray-400 text-gray-700 hover:text-gray-900 px-8 py-4 rounded-xl font-semibold shadow-sm hover:shadow-md transition-all duration-300 inline-flex items-center space-x-2 text-lg"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>Learn More</span>
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* About ReliefGuard Section */}
        <section id="about-reliefguard" className={`bg-gray-50/80 py-12 sm:py-16 lg:py-20 pt-20 sm:pt-24 lg:pt-32 transition-all duration-1000 ease-out ${isFromHashLink ? '' : 'delay-400'} ${
          isVisible ? 'opacity-100' : 'opacity-0'
        }`}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mb-12">
              <h2 className="text-3xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-4 font-inter">
                More about ReliefGuard
              </h2>
            </div>
            
            <div className="prose prose-lg max-w-none text-black font-inter leading-relaxed">
                <p className="text-xl mb-6">
                  ReliefGuard streamlines relief-rate determination and documentation for pressure vessels,
                  replacing legacy spreadsheet workflows and minimizing manual error.
                </p>

                <p className="text-xl mb-6">
                  It supports key scenarios including external fire, control-valve failure, blocked discharge,
                  thermal expansion, and liquid overfill. Engineers can input vessel geometry, design data,
                  and fluid properties to instantly calculate the relieving flow in accordance with
                  NFPA&nbsp;30, API&nbsp;521, and ASME&nbsp;VIII.
                </p>

                <p className="text-xl">
                  Built as a modern web application with automatic saving and consistent formatting,
                  ReliefGuard reduces engineering effort, improves traceability, and keeps results aligned
                  with current industry standards.
                </p>
              </div>
          </div>
        </section>

        {/* Footer */}
        <footer className={`bg-gray-50/80 py-12 transition-all duration-1000 ease-out delay-500 ${
          isVisible ? 'opacity-100' : 'opacity-0'
        }`}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-3">
            <div className="flex justify-center gap-4 text-sm text-gray-600 font-inter">
              <Link href="/privacy" className="hover:text-blue-600 transition-colors">
                Privacy Policy
              </Link>
              <span>•</span>
              <Link href="/terms" className="hover:text-blue-600 transition-colors">
                Terms of Service
              </Link>
            </div>
            <p className="text-gray-500 font-inter">
              Prototype build ©2025 ReliefGuard
            </p>
          </div>
        </footer>
      </div>
    </PageTransition>
  )
}

