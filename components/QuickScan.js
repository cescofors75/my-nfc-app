// components/QuickScan.js
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import NFCReader from './NFCReader'
import { supabase } from '@/lib/supabaseClient'

export default function QuickScan({ isOpen, onClose }) {
  const router = useRouter()
  const [error, setError] = useState(null)
  const [status, setStatus] = useState('idle') // idle, scanning, success, error

  const handleNFCRead = async (nfcUid) => {
    try {
      setStatus('scanning')
      // Buscar si la pulsera existe
      const { data: wristband, error } = await supabase
        .from('wristbands')
        .select('id')
        .eq('nfc_uid', nfcUid)
        .single()

      if (error && error.code !== 'PGRST116') { // Error diferente a "no encontrado"
        throw error
      }

      if (wristband) {
        // Si existe, ir a la página de la pulsera
        setStatus('success')
        setTimeout(() => {
          router.push(`/wristbands/${wristband.id}`)
          onClose()
        }, 1000)
      } else {
        // Si no existe, ir a la página de asignación con el UID preestablecido
        setStatus('success')
        setTimeout(() => {
          router.push(`/wristbands/assign?nfc_uid=${nfcUid}`)
          onClose()
        }, 1000)
      }
    } catch (err) {
      setStatus('error')
      setError(err.message)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center p-4 z-50">
      <div className=" bg-gray-200 dark:bg-gray-800 rounded-lg max-w-md w-full p-6 shadow-xl">
        <div className="text-center mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Leer Pulsera
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Acerca la pulsera al lector para identificarla
          </p>
        </div>

        <div className="mb-6">
          <NFCReader onRead={handleNFCRead} />
        </div>

        {status === 'success' && (
          <div className="mb-4 bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 p-4 rounded">
            Pulsera leída correctamente. Redirigiendo...
          </div>
        )}

        {error && (
          <div className="mb-4 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 p-4 rounded">
            {error}
          </div>
        )}

        <div className="flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  )
}