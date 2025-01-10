'use client'

import { useState, useEffect } from 'react'
import { getWristband, addMoney, spendMoney, getTransactions, supabase } from '@/lib/supabaseClient'

export default function WristbandPage({ params }) {
  const { id } = params
  const [wristband, setWristband] = useState(null)
  const [transactions, setTransactions] = useState([])
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    loadWristband()
    loadTransactions()

    // Suscribirse a cambios en tiempo real
    const channel = supabase
      .channel('realtime-updates')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'transactions',
          filter: `wristband_id=eq.${id}`,
        },
        () => {
          loadWristband()
          loadTransactions()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [id])

  const loadWristband = async () => {
    try {
      const data = await getWristband(id)
      setWristband(data)
    } catch (err) {
      setError(err.message)
    }
  }

  const loadTransactions = async () => {
    try {
      const data = await getTransactions(id)
      setTransactions(data)
    } catch (err) {
      setError(err.message)
    }
  }

  const handleAddMoney = async () => {
    if (!amount) return
    
    setLoading(true)
    setError(null)
    
    try {
      await addMoney(id, Number(amount))
      setAmount('')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleSpendMoney = async () => {
    if (!amount || !description) return
    
    setLoading(true)
    setError(null)
    
    try {
      await spendMoney(id, Number(amount), description)
      setAmount('')
      setDescription('')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (!wristband) return <div className="p-8 text-center">Cargando...</div>

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Información de la pulsera */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h1 className="text-2xl font-bold mb-4">Pulsera de {wristband.owner_name}</h1>
        <div className="flex items-center justify-between">
          <span className="text-gray-600">ID NFC:</span>
          <span className="font-mono">{wristband.nfc_uid}</span>
        </div>
        <div className="flex items-center justify-between mt-2">
          <span className="text-gray-600">Saldo actual:</span>
          <span className="text-2xl font-bold text-green-600">
            {wristband.balance.toFixed(2)}€
          </span>
        </div>
      </div>

      {/* Acciones */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Añadir dinero */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Añadir Dinero</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Cantidad (€)
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button
              onClick={handleAddMoney}
              disabled={loading}
              className="w-full bg-green-500 text-white py-2 px-4 rounded hover:bg-green-600 disabled:opacity-50"
            >
              {loading ? 'Procesando...' : 'Añadir Saldo'}
            </button>
          </div>
        </div>

        {/* Realizar gasto */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Realizar Gasto</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Cantidad (€)
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Descripción
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
                placeholder="Ej: Consumición en bar"
              />
            </div>
            <button
              onClick={handleSpendMoney}
              disabled={loading}
              className="w-full bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 disabled:opacity-50"
            >
              {loading ? 'Procesando...' : 'Realizar Gasto'}
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-500 p-4 rounded mb-6">
          {error}
        </div>
      )}

      {/* Historial de transacciones */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6">
          <h2 className="text-lg font-semibold mb-4">Historial de Transacciones</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Fecha
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Tipo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Cantidad
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Descripción
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {transactions.map((transaction) => (
                  <tr key={transaction.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(transaction.created_at).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          transaction.type === 'DEPOSIT'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {transaction.type === 'DEPOSIT' ? 'Ingreso' : 'Gasto'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span
                        className={transaction.type === 'DEPOSIT' ? 'text-green-600' : 'text-red-600'}
                      >
                        {transaction.type === 'DEPOSIT' ? '+' : '-'}
                        {transaction.amount.toFixed(2)}€
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {transaction.description || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
    )
}
