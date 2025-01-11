// components/ErrorBoundary.js
'use client'

export default function ErrorBoundary({ error }) {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 max-w-lg w-full">
        <div className="flex items-center justify-center text-red-500 mb-4">
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className="h-12 w-12" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" 
            />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white text-center mb-2">
          Ha ocurrido un error
        </h2>
        <p className="text-gray-600 dark:text-gray-400 text-center mb-6">
          {error.message}
        </p>
        <div className="flex justify-center">
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Reintentar
          </button>
        </div>
      </div>
    </div>
  )
}