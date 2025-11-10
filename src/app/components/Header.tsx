'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useState } from 'react'
import NavDropdown from './NavDropdown'
import AuthModal from './AuthModal'
import { useSidebar } from './SidebarLayout'
import { useAuth } from '../context/AuthContext'

export default function Header() {
  const { isExpanded } = useSidebar()
  const { user, unverifiedUser, signOut } = useAuth()
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)
  
  return (
    <>
      {/* Email Verification Alert */}
      {unverifiedUser && (
        <div className="fixed top-0 left-0 right-0 z-[60] bg-yellow-500 text-white py-3 px-4 text-center text-sm font-medium">
          <div className="max-w-7xl mx-auto flex items-center justify-center gap-2">
            <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <span>Please verify your email address. Check your inbox for the verification link.</span>
            <button
              onClick={() => signOut()}
              className="ml-4 underline hover:no-underline"
            >
              Sign out
            </button>
          </div>
        </div>
      )}
      
      <header className={`bg-white shadow-sm border-b border-gray-200 fixed top-0 left-0 right-0 z-50 transition-all duration-300 ease-in-out ${
        unverifiedUser ? 'mt-12' : ''
      } ${
      isExpanded ? 'lg:!left-60' : 'lg:!left-12'
    }`}>
      <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8">
        <div className="flex justify-between items-center py-3 sm:py-6">
          <div className="flex items-center min-w-0 flex-1">
            <Link href="/" className="hover:opacity-80 transition-opacity">
              <div className="logo-container">
                <Image 
                  src="/ReliefGuardBannerTransparent.png" 
                  alt="ReliefGuard" 
                  width={320} 
                  height={80} 
                  className="h-8 sm:h-12 lg:h-16 w-auto"
                  priority
                  sizes="(max-width: 640px) 160px, (max-width: 1024px) 240px, 320px"
                />
              </div>
            </Link>
          </div>
          <div className="flex items-center space-x-0 sm:space-x-1">
            <NavDropdown 
              title="Cases" 
              href="/cases"
              items={[
                { 
                  label: 'External Fire', 
                  href: '/cases/external-fire',
                  icon: <div className="w-2 h-2 rounded-full bg-gray-400" />
                },
                { 
                  label: 'Control Valve Failure', 
                  href: '/cases/control-valve-failure',
                  icon: <div className="w-2 h-2 rounded-full bg-gray-400" />
                },
                { 
                  label: 'Liquid Overfill', 
                  href: '/cases/liquid-overfill',
                  icon: <div className="w-2 h-2 rounded-full bg-gray-400" />
                },
                { 
                  label: 'Blocked Outlet', 
                  href: '/cases/blocked-outlet',
                  icon: <div className="w-2 h-2 rounded-full bg-gray-400" />
                },
                { 
                  label: 'Cooling/Reflux Failure', 
                  href: '/cases/cooling-reflux-failure',
                  icon: <div className="w-2 h-2 rounded-full bg-gray-400" />
                },
                { 
                  label: 'Hydraulic Expansion', 
                  href: '/cases/hydraulic-expansion',
                  icon: <div className="w-2 h-2 rounded-full bg-gray-400" />
                },
                { 
                  label: 'Heat Exchanger Tube Rupture', 
                  href: '/cases/heat-exchanger-tube-rupture',
                  icon: <div className="w-2 h-2 rounded-full bg-gray-400" />
                }
              ]} 
            />
            {/* Temporarily hidden About button - keeping logic for future use */}
            {/* <Link 
              href="/#how-it-works" 
              className="px-1 sm:px-3 py-2 text-xs sm:text-lg lg:text-xl font-medium text-gray-700 hover:text-blue-600 transition-colors duration-200 font-inter navbar-text"
            >
              About
            </Link> */}
            <NavDropdown 
              title="Datasets" 
              href="/datasets"
              items={[
                { 
                  label: 'Fluid Properties', 
                  href: '/datasets/fluids',
                  icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
                },
                { 
                  label: 'Gas Properties', 
                  href: '/datasets/gas-properties',
                  icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" /></svg>
                },
                { 
                  label: 'Vessel Head Areas', 
                  href: '/datasets/vessel-head-areas',
                  icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
                }
              ]} 
            />

            {/* Auth Button / User Menu */}
            {user ? (
              <div className="relative ml-3">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors border border-gray-200 h-10"
                >
                  {/* Google Avatar (only show for OAuth) - fixed size */}
                  {user.photoURL && (
                    <Image 
                      src={user.photoURL} 
                      alt="Avatar"
                      width={24}
                      height={24}
                      className="w-6 h-6 rounded-full flex-shrink-0"
                      unoptimized
                    />
                  )}
                  
                  {/* Display name (Google) or email - different sizes */}
                  {user.displayName ? (
                    <span className="hidden sm:block text-xs sm:text-lg lg:text-xl font-medium text-gray-700 truncate max-w-40 font-inter leading-none">
                      {user.displayName.split(' ')[0]}
                    </span>
                  ) : (
                    <span className="hidden sm:block text-xs sm:text-sm lg:text-base font-medium text-gray-700 truncate max-w-40 font-inter leading-none">
                      {user.email}
                    </span>
                  )}
                  
                  <svg className="w-4 h-4 text-gray-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                
                {showUserMenu && (
                  <>
                    <div 
                      className="fixed inset-0 z-10" 
                      onClick={() => setShowUserMenu(false)}
                    />
                    <div className="absolute right-0 mt-2 w-64 rounded-lg bg-white shadow-lg ring-1 ring-black/5 z-20 overflow-hidden">
                      {/* User Info Header */}
                      <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
                        <div className="flex items-center gap-3">
                          {user.photoURL ? (
                            <Image 
                              src={user.photoURL} 
                              alt="Avatar"
                              width={40}
                              height={40}
                              className="w-10 h-10 rounded-full"
                              unoptimized
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-green-600 flex items-center justify-center text-white font-semibold">
                              {(user.displayName?.[0] || user.email?.[0] || 'U').toUpperCase()}
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-gray-900 truncate">
                              {user.displayName || user.email?.split('@')[0]}
                            </p>
                            <p className="text-xs text-gray-500 truncate">{user.email}</p>
                          </div>
                        </div>
                      </div>

                      {/* Menu Items */}
                      <div className="py-2">
                        <button
                          onClick={() => setShowUserMenu(false)}
                          className="w-full px-4 py-3 text-left text-base text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors flex items-center gap-3 font-inter"
                        >
                          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          <span>Account Settings</span>
                        </button>

                        <button
                          onClick={() => setShowUserMenu(false)}
                          className="w-full px-4 py-3 text-left text-base text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors flex items-center gap-3 font-inter"
                        >
                          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                          </svg>
                          <span>My Vessels</span>
                        </button>

                        <button
                          onClick={() => setShowUserMenu(false)}
                          className="w-full px-4 py-3 text-left text-base text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors flex items-center gap-3 font-inter"
                        >
                          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          <span>Saved Reports</span>
                        </button>
                      </div>

                      {/* Divider */}
                      <div className="border-t border-gray-100"></div>

                      {/* Sign Out */}
                      <button
                        onClick={() => {
                          signOut()
                          setShowUserMenu(false)
                        }}
                        className="w-full px-4 py-3 text-left text-base font-medium text-red-600 hover:bg-red-50 transition-colors flex items-center gap-3 font-inter"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <button
                onClick={() => setShowAuthModal(true)}
                className="px-1 sm:px-3 py-2 text-xs sm:text-lg lg:text-xl font-medium text-gray-700 hover:text-blue-600 transition-colors duration-200 font-inter navbar-text"
              >
                Login
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Auth Modal */}
      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
    </header>
    </>
  )
}
