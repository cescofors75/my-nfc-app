// app/layout.js
'use client'

import { useState } from 'react'
import Link from 'next/link'
import './globals.css'
import { Providers } from './providers'
import ThemeToggle from '@/components/ThemeToggle'
import QuickScan from '@/components/QuickScan'

export default function RootLayout({children }) {
  const [isQuickScanOpen, setIsQuickScanOpen] = useState(false)

  return (
    <html lang="es" suppressHydrationWarning>
      <body className="min-h-screen bg-gray-100 dark:bg-gray-900">
        <Providers>
          {/* Navbar */}
          <nav className=" dark:bg-gray-800 shadow">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between h-16">
                <div className="flex items-center">
                  <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                    VisitTech NFC
                  </h1>
                  <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                    <Link href="/"
className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"   >         
            Dashboard
                      
                    </Link>
                    <Link
          href="/wristbands/assign"
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Nueva Pulsera
        </Link>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  {/* Botón de escaneo rápido */}
                  <button
                    onClick={() => setIsQuickScanOpen(true)}
                    className="flex items-center px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
                  >
                    <svg 
                      xmlns="http://www.w3.org/2000/svg" 
                      fill="none" 
                      viewBox="0 0 24 24" 
                      strokeWidth={1.5} 
                      stroke="currentColor" 
                      className="w-5 h-5 mr-2"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                    </svg>
                    Leer Pulsera
                  </button>
                  <ThemeToggle />
                </div>
              </div>
            </div>
          </nav>

          {/* Main content */}
          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            {children}
          </main>

          {/* Modal de lectura rápida */}
          <QuickScan 
            isOpen={isQuickScanOpen} 
            onClose={() => setIsQuickScanOpen(false)} 
          />
        </Providers>
      </body>
    </html>
  )
}