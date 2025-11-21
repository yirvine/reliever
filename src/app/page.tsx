'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import Header from './components/Header'
import { ContactForm } from './components/ContactForm'

export default function Home() {
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

  const scrollToContact = () => {
    const element = document.getElementById('contact')
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
          {/* Gradient fade to gray-100 at the bottom */}
          <div className="absolute inset-x-0 bottom-0 h-70 bg-gradient-to-b from-transparent to-gray-100" />
        </div>

        {/* Content */}
        <div className="relative z-10 w-full max-w-7xl mx-auto px-8 sm:px-12 lg:px-16 -mt-24">
          <div className={`max-w-4xl mx-auto text-center transition-all duration-1000 ease-out ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}>
            {/* Main Heading */}
            <h1
              className="text-white font-figtree text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold mb-8 leading-tight"
              style={{ textShadow: '0 10px 16px rgba(0,0,0,0.6)' }}
            >
              Relief sizing<br />
              made simple.
            </h1>


            {/* Subtitle */}
            <p className="text-white/100 font-figtree text-lg sm:text-xl mb-12">
              A fast, reliable tool for relief-flow calculations in overpressure scenarios.
            </p>

            {/* Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {/* Get Started Button - White */}
              <Link 
                href="/cases"
                className="group inline-flex items-center justify-between bg-white text-black px-8 py-4 rounded-full font-figtree font-semibold text-lg hover:bg-gray-100 transition-all duration-300 shadow-[0_8px_16px_rgba(0,0,0,0.3)] hover:shadow-[0_12px_24px_rgba(0,0,0,0.4)] transform hover:-translate-y-0.5 border-2 border-gray-200"
              >
                <span>Get Started</span>
                <div className="ml-4 w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center group-hover:bg-slate-800 transition-colors">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </div>
              </Link>

              {/* Learn More Button - Navy with white circle and arrow that rotates on click */}
              <button 
                onClick={scrollToHowItWorks}
                className="group inline-flex items-center justify-between bg-slate-800 text-white px-8 py-4 rounded-full font-figtree font-semibold text-lg hover:bg-slate-900 transition-all duration-300 shadow-[0_8px_16px_rgba(0,0,0,0.3)] hover:shadow-[0_12px_24px_rgba(0,0,0,0.4)] transform hover:-translate-y-0.5 cursor-pointer border-2 border-slate-700"
              >
                <span>Learn More</span>
                <div className="ml-4 w-10 h-10 rounded-full bg-white flex items-center justify-center transition-colors">
                  <svg className="w-5 h-5 text-black transition-transform duration-300 group-hover:rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </div>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="relative pt-12 pb-12" style={{ background: 'linear-gradient(to bottom, rgb(243, 244, 246) 0%, rgb(243, 244, 246) 70%, rgb(51, 65, 85) 100%)' }}>
        <div className="max-w-7xl mx-auto px-8 sm:px-12 lg:px-16">
          <div className="grid lg:grid-cols-[4fr_1.2fr] gap-4 lg:gap-6 items-center mb-12">
            {/* Content */}
            <div className="order-1 lg:order-1">
              <h2 className="text-3Grxl sm:text-5xl lg:text-6xl font-bold text-black mb-6 font-figtree">
                How it works...
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

            {/* Animated Valve */}
            <div className="order-2 lg:order-2">
              <div className="relative aspect-[3/4] flex items-center justify-center">
                <svg width="100%" height="100%" viewBox="60 95 100 105" stroke="#475569" strokeWidth="2" fill="none" className="w-full h-full p-4">
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
            </div>
          </div>

          {/* Buttons - Centered below everything */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mt-4 mb-8">
            {/* Get Started Button */}
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

            {/* Contact Us Button - Navy with white circle and arrow */}
            <button 
              onClick={scrollToContact}
              className="group inline-flex items-center justify-between bg-slate-800 text-white px-8 py-4 rounded-full font-figtree font-semibold text-lg hover:bg-slate-900 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 cursor-pointer border-2 border-slate-700"
            >
              <span>Contact Us</span>
              <div className="ml-4 w-10 h-10 rounded-full bg-white flex items-center justify-center transition-colors">
                <svg className="w-5 h-5 text-black transition-transform duration-300 group-hover:rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </div>
            </button>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="relative bg-slate-700 pt-20 pb-10">
          <div className="max-w-7xl mx-auto px-8 sm:px-12 lg:px-16">
          <div className="text-center mb-8">
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-4 font-figtree" style={{ textShadow: '0 2px 8px rgba(0,0,0,0.3)' }}>
              Get in touch
            </h2>
              <p className="text-lg text-white/90 font-figtree max-w-3xl mx-auto">
                Have questions or feedback? Send a message and we&apos;ll respond as soon as possible.
              </p>
            </div>
            
            <ContactForm />
          </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-700 py-6">
        <div className="max-w-7xl mx-auto px-8 sm:px-12 lg:px-16 text-center">
          <div className="flex justify-center gap-4 text-sm text-white/70 font-figtree">
            <Link href="/privacy" className="hover:text-white transition-colors">
              Privacy Policy
            </Link>
            <span>•</span>
            <Link href="/terms" className="hover:text-white transition-colors">
              Terms of Service
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
