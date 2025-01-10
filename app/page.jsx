'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabaseClient'

export default function DashboardPage() {
  const [wristbands, setWristbands] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadWristbands()

    // Suscribirse a cambios en tiempo real
    const channel = supabase
      .channel('realtime-wristbands')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'wristbands',
        },
        () => {
          loadWristbands()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const loadWristbands = async () => {
    try {
      const { data } = await supabase
        .from('wristbands')
        .select('*')
        .order('created_at', { ascending: false })
      
      setWristbands(data || [])
    } catch (error) {
      console.error('Error loading wristbands:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900" />
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Pulseras NFC</h1>
        <Link
          href="/wristbands/assign"
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Asignar Nueva Pulsera
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {wristbands.map((wristband) => (
          <Link
            key={wristband.id}
            href={`/wristbands/${wristband.id}`}
            className="block bg-white rounded-lg shadow hover:shadow-md transition-shadow"
          >
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-2">{wristband.owner_name}</h2>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">ID NFC:</span>
                  <span className="font-mono">{wristband.nfc_uid}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Saldo:</span>
                  <span className="font-bold text-green-600">
                    {wristband.balance.toFixed(2)}€
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Creada:</span>
                  <span>{new Date(wristband.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          </Link>
        ))}

        {wristbands.length === 0 && (
          <div className="col-span-full text-center py-12 bg-gray-50 rounded-lg">
            <p className="text-gray-500">No hay pulseras asignadas</p>
            <Link
              href="/wristbands/assign"
              className="text-blue-500 hover:text-blue-600 mt-2 inline-block"
            >
              Asignar tu primera pulsera
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}