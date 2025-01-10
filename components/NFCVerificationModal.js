// components/NFCVerificationModal.js
'use client'

import { useState } from 'react'
import NFCReader from './NFCReader'

export default function NFCVerificationModal({ 
  isOpen, 
  onClose, 
  onVerify, 
  expectedNfcUid,
  action 
}) {
  const [verificationStatus, setVerificationStatus] = useState('idle') // idle, verifying, success, error
  const [error, setError] = useState(null)

  const handleNFCRead = (nfcUid) => {
    if (nfcUid === expectedNfcUid) {
      setVerificationStatus('success')
      setTimeout(() => {
        onVerify()
      }, 1000)
    } else {
      setVerificationStatus('error')
      setError('La pulsera no coincide con la esperada')
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className=" dark:bg-gray-800 rounded-lg max-w-md w-full p-6">
        <div className="text-center mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Verificación de Pulsera
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Para {action}, acerca la pulsera al lector
          </p>
        </div>

        {verificationStatus === 'error' && (
          <div className="bg-red-50 dark:bg-red-900/50 text-red-500 dark:text-red-200 p-4 rounded mb-4">
            {error}
          </div>
        )}

        <div className="mb-6">
          <NFCReader onRead={handleNFCRead} />
        </div>

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