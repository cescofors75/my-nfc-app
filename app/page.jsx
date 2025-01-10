'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabaseClient'

export default function DashboardPage() {
  const [wristbands, setWristbands] = useState([])
  const [transactions, setTransactions] = useState([])
  const [transactionFilter, setTransactionFilter] = useState('ALL') // 'ALL', 'DEPOSIT', 'PURCHASE'
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadWristbands()
    loadTransactions()

    // Suscribirse a cambios en tiempo real de pulseras
    const wristbandsChannel = supabase
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

    // Suscribirse a cambios en tiempo real de transacciones
    const transactionsChannel = supabase
      .channel('realtime-transactions')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'transactions',
        },
        () => {
          loadTransactions()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(wristbandsChannel)
      supabase.removeChannel(transactionsChannel)
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

  const loadTransactions = async () => {
    try {
      let query = supabase
        .from('transactions')
        .select(`
          *,
          wristbands (
            owner_name,
            nfc_uid
          )
        `)
        .order('created_at', { ascending: false })
        .limit(50)

      if (transactionFilter !== 'ALL') {
        query = query.eq('type', transactionFilter)
      }

      const { data } = await query
      setTransactions(data || [])
    } catch (error) {
      console.error('Error loading transactions:', error)
    }
  }

  useEffect(() => {
    loadTransactions()
  }, [transactionFilter])

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900" />
      </div>
    )
  }

  // Calcular totales
  const totals = transactions.reduce((acc, transaction) => {
    if (transaction.type === 'DEPOSIT') {
      acc.deposits += transaction.amount
    } else {
      acc.purchases += transaction.amount
    }
    return acc
  }, { deposits: 0, purchases: 0 })

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Resumen y Acciones */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Dashboard NFC</h1>
          <p className="text-gray-600">
            {wristbands.length} pulseras activas
          </p>
        </div>
        <Link
          href="/wristbands/assign"
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Asignar Nueva Pulsera
        </Link>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-gray-500 text-sm uppercase">Total Ingresos (24h)</h3>
          <p className="text-2xl font-bold text-green-600">+{totals.deposits.toFixed(2)}€</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-gray-500 text-sm uppercase">Total Gastos (24h)</h3>
          <p className="text-2xl font-bold text-red-600">-{totals.purchases.toFixed(2)}€</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-gray-500 text-sm uppercase">Balance Total</h3>
          <p className="text-2xl font-bold text-blue-600">
            {(totals.deposits - totals.purchases).toFixed(2)}€
          </p>
        </div>
      </div>

      {/* Lista de Pulseras */}
      <h2 className="text-xl font-semibold mb-4">Pulseras Activas</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
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
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Transacciones en Tiempo Real */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold">Últimas Transacciones</h2>
            <div className="flex space-x-2">
              <button
                onClick={() => setTransactionFilter('ALL')}
                className={`px-3 py-1 rounded ${
                  transactionFilter === 'ALL'
                    ? 'bg-gray-200 text-gray-800'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                Todas
              </button>
              <button
                onClick={() => setTransactionFilter('DEPOSIT')}
                className={`px-3 py-1 rounded ${
                  transactionFilter === 'DEPOSIT'
                    ? 'bg-green-100 text-green-800'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                Ingresos
              </button>
              <button
                onClick={() => setTransactionFilter('PURCHASE')}
                className={`px-3 py-1 rounded ${
                  transactionFilter === 'PURCHASE'
                    ? 'bg-red-100 text-red-800'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                Gastos
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Fecha/Hora
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Usuario
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
                  <tr key={transaction.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(transaction.created_at).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {transaction.wristbands?.owner_name}
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
                    <td className="px-6 py-4 text-sm text-gray-500">
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