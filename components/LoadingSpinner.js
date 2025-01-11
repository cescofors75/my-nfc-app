// components/LoadingSpinner.js
export default function LoadingSpinner() {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="relative">
          <div className="h-24 w-24 rounded-full border-t-4 border-b-4 border-blue-500 animate-spin"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-gray-600 dark:text-gray-300">
            Cargando...
          </div>
        </div>
      </div>
    )
  }