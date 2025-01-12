'use client'

import { useState } from 'react'
import './globals.css'
import { Providers } from './providers'
import Navbar from '@/components/Navbar'
import QuickScan from '@/components/QuickScan'
//import ConfigSettings from '@/components/ConfigSettings'
import { Toaster } from 'sonner'

export default function RootLayout({ children }) {
  const [isQuickScanOpen, setIsQuickScanOpen] = useState(false)

  return (
    <html lang="es" suppressHydrationWarning>
      <body className="min-h-screen bg-gray-100 dark:bg-gray-900">
        <Providers>
          <div className="sticky top-0 z-50 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between items-center h-16">
                <Navbar setIsQuickScanOpen={setIsQuickScanOpen} />
                
              </div>
            </div>
          </div>

          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            {children}
            <Toaster richColors position="top-right" />
          </main>

          <QuickScan
            isOpen={isQuickScanOpen}
            onClose={() => setIsQuickScanOpen(false)}
          />
        </Providers>
      </body>
    </html>
  )
}