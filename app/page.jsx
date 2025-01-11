'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabaseClient'
import TransactionsTable from '@/components/TransactionsTable'
import TransactionsChart from '@/components/TransactionsChart'
export default function DashboardPage() {
  const [stats, setStats] = useState({ totalIncome: 0, totalExpenses: 0, totalBalance: 0 })
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
        
      </div>


      {/* Lista de Pulseras */}
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {wristbands.map((wristband) => (
          <Link
            key={wristband.id}
            href={`/wristbands/${wristband.id}`}
            className="block dark:bg-gray-800 rounded-lg shadow hover:shadow-md transition-shadow"
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
 <TransactionsChart />
 <br/>
 <TransactionsTable transactions={transactions} />
      {/* Transacciones en Tiempo Real */}
      
    </div>
  
  )
}