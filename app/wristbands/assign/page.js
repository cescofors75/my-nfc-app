'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import NFCReader from '@/components/NFCReader'
import { assignWristband } from '@/lib/supabaseClient'

export default function AssignPage() {
  const router = useRouter()
  const [ownerName, setOwnerName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleNFCRead = async (nfcUid) => {
    if (!ownerName.trim()) {
      setError('Por favor, ingresa el nombre del propietario')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const wristband = await assignWristband(nfcUid, ownerName)
      router.push(`/wristbands/${wristband.id}`)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-md mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Asignar Nueva Pulsera</h1>

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Nombre del Propietario
          </label>
          <input
            type="text"
            value={ownerName}
            onChange={(e) => setOwnerName(e.target.value)}
            className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Ej: Juan Pérez"
          />
        </div>

        <NFCReader onRead={handleNFCRead} />

        {error && (
          <div className="bg-red-50 text-red-500 p-4 rounded">
            {error}
          </div>
        )}

        {loading && (
          <div className="text-center text-gray-500">
            Asignando pulsera...
          </div>
        )}
      </div>
    </div>
  )
}