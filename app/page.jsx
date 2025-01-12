'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabaseClient'
import TransactionsTable from '@/components/TransactionsTable'
//import TransactionsChart from '@/components/TransactionsChart'
import { CreditCard, Loader2 } from 'lucide-react'
//import TransactionsAnalysis from '@/components/TransactionsAnalysis'
import TransactionsVisualization from '@/components/TransactionsVisualization'

export default function DashboardPage() {
  const [stats, setStats] = useState({ totalIncome: 0, totalExpenses: 0, totalBalance: 0 })
  const [wristbands, setWristbands] = useState([])
  const [transactions, setTransactions] = useState([])
  const [transactionFilter, setTransactionFilter] = useState('ALL')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    console.log('🔄 Iniciando carga de datos y suscripciones realtime')
    
    const loadInitialData = async () => {
      await Promise.all([loadWristbands(), loadTransactions()])
      setLoading(false)
    }

    const wristbandsChannel = supabase
      .channel('realtime-wristbands')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'wristbands' },
        (payload) => {
          console.log('🔔 Cambio en pulseras detectado:', payload)
          loadWristbands()
        }
      )
      .subscribe((status) => {
        console.log('📡 Estado de suscripción wristbands:', status)
      })

    const transactionsChannel = supabase
      .channel('realtime-transactions')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'transactions' },
        (payload) => {
          console.log('🔔 Nueva transacción detectada:', payload)
          loadTransactions()
        }
      )
      .subscribe((status) => {
        console.log('📡 Estado de suscripción transactions:', status)
      })

    loadInitialData()

    return () => {
      console.log('🔌 Limpiando suscripciones')
      supabase.removeChannel(wristbandsChannel)
      supabase.removeChannel(transactionsChannel)
    }
  }, [])

  const loadWristbands = async () => {
    console.log('📍 Cargando pulseras...')
    try {
      const { data, error } = await supabase
        .from('wristbands')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (error) throw error
      console.log('✅ Pulseras cargadas:', data?.length)
      setWristbands(data || [])
    } catch (error) {
      console.error('❌ Error cargando pulseras:', error)
    }
  }

  const loadTransactions = async () => {
    console.log('📍 Cargando transacciones...')
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

      const { data, error } = await query
      if (error) throw error
      
      console.log('✅ Transacciones cargadas:', data?.length)
      setTransactions(data || [])
      
      const totals = (data || []).reduce((acc, transaction) => {
        const amount = Number(transaction.amount) || 0
        if (transaction.type === 'DEPOSIT') {
          acc.totalIncome += amount
        } else {
          acc.totalExpenses += amount
        }
        acc.totalBalance = acc.totalIncome - acc.totalExpenses
        return acc
      }, { totalIncome: 0, totalExpenses: 0, totalBalance: 0 })

      setStats(totals)
    } catch (error) {
      console.error('❌ Error cargando transacciones:', error)
    }
  }

  useEffect(() => {
    loadTransactions()
  }, [transactionFilter])

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500 mb-4" />
        <p className="text-gray-600 dark:text-gray-400">Cargando dashboard...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Dashboard NFC
              </h1>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {wristbands.length} pulseras activas
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Contenido principal */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Grid de pulseras */}
        <div className="mb-8">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            Pulseras Activas
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {wristbands.map((wristband) => (
              <Link
                key={wristband.id}
                href={"/wristbands/" + wristband.id}
              >
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-md transition-all duration-200 p-6 border border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-500">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
                      {wristband.owner_name}
                    </h3>
                    <CreditCard className="w-5 h-5 text-gray-400" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-500 dark:text-gray-400">ID NFC:</span>
                      <span className="text-sm font-mono text-gray-900 dark:text-gray-100">
                        {wristband.nfc_uid}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-500 dark:text-gray-400">Saldo:</span>
                      <span className={`text-sm font-semibold ${
                        wristband.balance >= 0 
                          ? 'text-green-600 dark:text-green-400' 
                          : 'text-red-600 dark:text-red-400'
                      }`}>
                        {wristband.balance.toFixed(2)}€
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
        <div className="container">
    <TransactionsVisualization />
  </div>

        {/* Tabla de transacciones */}
        <div>
          <TransactionsTable transactions={transactions} />
        </div>
      </div>
    </div>
  )
}