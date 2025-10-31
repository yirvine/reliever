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
            <div className="text-center mb-8 sm:mb-12 lg:mb-16">
              <h2 className="text-3xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-3 sm:mb-4 font-inter">
                How It Works
              </h2>
              <p className="text-base sm:text-lg text-gray-600 max-w-2xl mx-auto font-inter">
                {/* Three simple steps to calculate your relief valve requirements */}
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6 sm:gap-8 lg:gap-12">
              {/* Step 1 */}
              <div className="text-center">
                <div className="bg-slate-100 rounded-full w-16 h-16 items-center justify-center mx-auto mb-6 hidden sm:flex">
                  <span className="text-2xl font-bold text-slate-700 font-inter">1</span>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4 font-inter">
                  <span className="sm:hidden">1. </span>Select Relevant Cases
                </h3>
                <p className="text-gray-600 font-inter">
                  Choose from common vessel relieving scenarios such as external fire, control valve failure, blocked discharge, and more, based on both your system design and environmental conditions.
                </p>
              </div>

              {/* Step 2 */}
              <div className="text-center">
                <div className="bg-slate-100 rounded-full w-16 h-16 items-center justify-center mx-auto mb-6 hidden sm:flex">
                  <span className="text-2xl font-bold text-slate-700 font-inter">2</span>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4 font-inter">
                  <span className="sm:hidden">2. </span>Calculate Design Flow
                </h3>
                <p className="text-gray-600 font-inter">
                  Enter vessel properties, operating conditions, and fluid data. ReliefGuard applies NFPA 30, API 521, and ASME VIII methodology to calculate the required relieving flow rate.
                </p>
              </div>

              {/* Step 3 */}
              <div className="text-center">
                <div className="bg-slate-100 rounded-full w-16 h-16 items-center justify-center mx-auto mb-6 hidden sm:flex">
                  <span className="text-2xl font-bold text-slate-700 font-inter">3</span>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4 font-inter">
                  <span className="sm:hidden">3. </span>Document & Size
                </h3>
                <p className="text-gray-600 font-inter">
                  Use the calculated flow to size a relief valve or rupture disc in FluidFlow (or similar software), then return to ReliefGuard to record the selected device and generate a final, standards-compliant report.
                </p>
              </div>
            </div>

            {/* CTA buttons at bottom of How It Works */}
            <div className="text-center mt-16">
              <div className="flex flex-row gap-4 justify-center items-center">
                <Link 
                  href="/cases"
                  className="bg-gradient-to-r from-slate-600 to-slate-700 hover:from-slate-700 hover:to-slate-800 text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5 inline-flex items-center space-x-2"
                >
                  <span>Get Started</span>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
                
                <button 
                  onClick={scrollToAbout}
                  className="bg-white border-2 border-gray-300 hover:border-gray-400 text-gray-700 hover:text-gray-900 px-6 py-3 rounded-xl font-semibold shadow-sm hover:shadow-md transition-all duration-300 inline-flex items-center space-x-2"
                >
                  <span>Learn More</span>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
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
            <div className="max-w-4xl">
              <div className="mb-12">
                <h2 className="text-3xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-4 font-inter">
                  More about ReliefGuard
                </h2>
              </div>
              
              <div className="prose prose-lg max-w-none text-gray-900 font-inter leading-relaxed">
                <p className="text-lg mb-6">
                  <strong>ReliefGuard</strong> is a web application that streamlines the process of determining required 
                  <strong> relieving rates for pressure vessels</strong> and documenting <strong>relief scenarios</strong> in a consistent, 
                  standards-compliant way. It replaces legacy <strong>spreadsheet workflows</strong>, reduces manual error, and provides a reliable 
                  foundation for <strong>pressure relief system design</strong>.
                </p>
                
                <p className="text-lg mb-6">
                  ReliefGuard supports calculations for scenarios such as <strong>external fire</strong>, <strong>control valve failure</strong>, 
                  <strong> blocked discharge</strong>, <strong>thermal expansion</strong>, and <strong>liquid overfill</strong>. Engineers can input 
                  vessel geometry, design conditions, and fluid data, and instantly obtain the required <strong>relieving flow rate</strong> in accordance 
                  with <strong>NFPA 30</strong>, <strong>API 521</strong>, and <strong>ASME Section VIII</strong>.
                </p>
                
                <p className="text-lg">
                  By consolidating calculations into a modern, browser-based interface with <strong>automatic saving</strong> and 
                  <strong> consistent formatting</strong>, ReliefGuard reduces <strong>engineering effort</strong>, improves <strong>traceability</strong>, 
                  and ensures results remain aligned with the latest <strong>industry standards</strong>.
                </p>
              </div>

            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className={`bg-gray-50/80 py-12 transition-all duration-1000 ease-out delay-500 ${
          isVisible ? 'opacity-100' : 'opacity-0'
        }`}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <p className="text-gray-500 font-inter">
              Prototype build ©2025 ReliefGuard
            </p>
          </div>
        </footer>
      </div>
    </PageTransition>
  )
}