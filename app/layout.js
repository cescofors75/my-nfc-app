// app/layout.js
'use client'

import { useState } from 'react'
//import Link from 'next/link'
import './globals.css'
import { Providers } from './providers'
import Navbar from '@/components/Navbar'
import QuickScan from '@/components/QuickScan'

export default function RootLayout({children }) {
  const [isQuickScanOpen, setIsQuickScanOpen] = useState(false)

  return (
    <html lang="es" suppressHydrationWarning>
      <body className="min-h-screen bg-gray-100 dark:bg-gray-900">
        <Providers>
          {/* Navbar */}
          <Navbar setIsQuickScanOpen={setIsQuickScanOpen} />

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