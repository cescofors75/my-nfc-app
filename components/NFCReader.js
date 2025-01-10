'use client'

import { useState } from 'react'

export default function NFCReader({ onRead }) {
  const [status, setStatus] = useState('idle') // idle, scanning, success, error
  const [error, setError] = useState(null)

  const startScanning = async () => {
    if (!('NDEFReader' in window)) {
      setError('NFC no soportado en este dispositivo')
      setStatus('error')
      return
    }

    try {
      setStatus('scanning')
      setError(null)

      const ndef = new NDEFReader()
      await ndef.scan()

      ndef.onreading = (event) => {
        const { serialNumber } = event
        setStatus('success')
        onRead?.(serialNumber)
      }

      ndef.onreadingerror = () => {
        setError('Error al leer la tarjeta')
        setStatus('error')
      }

    } catch (error) {
      setError(error.message)
      setStatus('error')
    }
  }

  return (
    <div className="p-4 bg-white rounded-lg shadow">
      <div className="text-center space-y-4">
        {status === 'idle' && (
          <button
            onClick={startScanning}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition"
          >
            Iniciar Lectura NFC
          </button>
        )}

        {status === 'scanning' && (
          <div className="text-blue-500">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2" />
            <p>Acerca la pulsera al lector...</p>
          </div>
        )}

        {status === 'success' && (
          <div className="text-green-500">
            <svg
              className="h-8 w-8 mx-auto mb-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
            <p>¡Lectura exitosa!</p>
            <button
              onClick={() => {
                setStatus('idle')
                setError(null)
              }}
              className="mt-2 text-sm text-blue-500 hover:text-blue-600"
            >
              Leer otra pulsera
            </button>
          </div>
        )}

        {status === 'error' && (
          <div className="text-red-500">
            <svg
              className="h-8 w-8 mx-auto mb-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <p>{error}</p>
            <button
              onClick={startScanning}
              className="mt-2 text-sm text-blue-500 hover:text-blue-600"
            >
              Reintentar
            </button>
          </div>
        )}
      </div>
    </div>
  )
}