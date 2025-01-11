/* eslint-disable react-hooks/exhaustive-deps */
'use client'

import { useState, useEffect, useRef } from 'react'
import { createChart } from 'lightweight-charts'
import { supabase } from '@/lib/supabaseClient'
import { LineChart, BarChart3 } from 'lucide-react'
const TIME_RANGES = {
  '30MIN': '30 minutos',
  '1H': '1 hora',
  '24H': '24 horas',
  '7D': '7 días',
  '30D': '30 días',
  'ALL': 'Todo'
}

export default function TransactionsChart() {
  const [timeRange, setTimeRange] = useState('24H')
  const [showAccumulated, setShowAccumulated] = useState(false)
  const [transactions, setTransactions] = useState([])
  const [stats, setStats] = useState({
    totalIncomes: 0,
    totalExpenses: 0,
    accumulated: 0
  })

  const chartContainerRef = useRef(null)
  const chartRef = useRef(null)
  const incomesSeriesRef = useRef(null)
  const expensesSeriesRef = useRef(null)
  const accumulatedSeriesRef = useRef(null)
  const channelRef = useRef(null)

  const processTransactions = (transactions) => {
    const timeMap = new Map()
    let runningIncomes = 0
    let runningExpenses = 0
    
    // Filtrar las transacciones según el rango de tiempo actual
    const filteredTransactions = transactions.filter(shouldIncludeTransaction)
    
    // Ordenar las transacciones por fecha
    filteredTransactions.sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
    
    filteredTransactions.forEach(t => {
      const timestamp = new Date(t.created_at).getTime() / 1000
      if (!timeMap.has(timestamp)) {
        timeMap.set(timestamp, { 
          incomes: 0, 
          expenses: 0, 
          accumulated: 0 
        })
      }
      
      const amount = Number(t.amount)
      if (t.type === 'DEPOSIT') {
        timeMap.get(timestamp).incomes += amount
        runningIncomes += amount
      } else {
        timeMap.get(timestamp).expenses += amount
        runningExpenses += amount
      }
      
      // Actualizar el valor acumulado para este punto en el tiempo
      timeMap.get(timestamp).accumulated = runningIncomes - runningExpenses
    })

    // Actualizar las estadísticas con los totales
    setStats({
      totalIncomes: runningIncomes,
      totalExpenses: runningExpenses,
      accumulated: runningIncomes - runningExpenses
    })

    const sortedTimes = Array.from(timeMap.entries()).sort((a, b) => a[0] - b[0])
    
    return {
      incomes: sortedTimes.map(([time, data]) => ({
        time,
        value: data.incomes
      })),
      expenses: sortedTimes.map(([time, data]) => ({
        time,
        value: data.expenses
      })),
      accumulated: sortedTimes.map(([time, data]) => ({
        time,
        value: data.accumulated
      }))
    }
  }

  const fetchTransactions = async () => {
    let query = supabase
      .from('transactions')
      .select('*')
      .order('created_at', { ascending: true })

    const now = new Date()
    let startTime

    switch (timeRange) {
      case '30MIN':
        startTime = new Date(now - 30 * 60 * 1000)
        break
      case '1H':
        startTime = new Date(now - 60 * 60 * 1000)
        break
      case '24H':
        startTime = new Date(now - 24 * 60 * 60 * 1000)
        break
      case '7D':
        startTime = new Date(now - 7 * 24 * 60 * 60 * 1000)
        break
      case '30D':
        startTime = new Date(now - 30 * 24 * 60 * 60 * 1000)
        break
      default:
        break
    }

    if (startTime) {
      query = query.gte('created_at', startTime.toISOString())
    }

    const { data } = await query
    return data || []
  }

  const initializeChart = () => {
    if (!chartContainerRef.current) return

    // Limpiar el gráfico anterior si existe
    if (chartRef.current) {
      chartRef.current.remove()
    }

    chartRef.current = createChart(chartContainerRef.current, {
      height: 400,
      layout: {
        background: { type: 'solid', color: 'transparent' },
        textColor: '#9CA3AF',
      },
      grid: {
        vertLines: { color: 'rgba(156, 163, 175, 0.1)' },
        horzLines: { color: 'rgba(156, 163, 175, 0.1)' },
      },
      rightPriceScale: {
        borderColor: 'rgba(156, 163, 175, 0.1)',
        scaleMargins: {
          top: 0.1,
          bottom: 0.1,
        },
      },
      timeScale: {
        borderColor: 'rgba(156, 163, 175, 0.1)',
        timeVisible: true,
        secondsVisible: timeRange === '30MIN' || timeRange === '1H',
      },
      crosshair: {
        mode: 1,
      },
    })

    incomesSeriesRef.current = chartRef.current.addLineSeries({
      color: '#10B981',
      lineWidth: 2,
      title: 'Ingresos',
      visible: !showAccumulated
    })

    expensesSeriesRef.current = chartRef.current.addLineSeries({
      color: '#EF4444',
      lineWidth: 2,
      title: 'Ventas',
      visible: !showAccumulated
    })

    accumulatedSeriesRef.current = chartRef.current.addAreaSeries({
      lineColor: '#3B82F6',
      topColor: 'rgba(59, 130, 246, 0.4)',
      bottomColor: 'rgba(59, 130, 246, 0.1)',
      lineWidth: 2,
      title: 'Balance Acumulado',
      visible: showAccumulated
    })

    const handleResize = () => {
      chartRef.current.applyOptions({
        width: chartContainerRef.current.clientWidth,
      })
    }

    window.addEventListener('resize', handleResize)
    handleResize()

    return () => {
      window.removeEventListener('resize', handleResize)
    }
  }

  const updateChart = (transactions) => {
    if (!transactions.length || !incomesSeriesRef.current || !expensesSeriesRef.current || !accumulatedSeriesRef.current) return
    
    const { incomes, expenses, accumulated } = processTransactions(transactions)
    
    incomesSeriesRef.current.setData(incomes)
    expensesSeriesRef.current.setData(expenses)
    accumulatedSeriesRef.current.setData(accumulated)

    // Actualizar la visibilidad de las series
    incomesSeriesRef.current.applyOptions({ visible: !showAccumulated })
    expensesSeriesRef.current.applyOptions({ visible: !showAccumulated })
    accumulatedSeriesRef.current.applyOptions({ visible: showAccumulated })
  }

  const handleRealtimeTransaction = (payload) => {
    const { eventType, new: newTransaction, old: oldTransaction } = payload
    
    setTransactions(currentTransactions => {
      let updatedTransactions = [...currentTransactions]

      switch (eventType) {
        case 'INSERT':
          if (shouldIncludeTransaction(newTransaction)) {
            updatedTransactions = [...updatedTransactions, newTransaction]
          }
          break

        case 'UPDATE':
          updatedTransactions = updatedTransactions.map(t => 
            t.id === newTransaction.id ? newTransaction : t
          )
          break

        case 'DELETE':
          updatedTransactions = updatedTransactions.filter(t => 
            t.id !== oldTransaction.id
          )
          break
      }

      updatedTransactions.sort((a, b) => 
        new Date(a.created_at) - new Date(b.created_at)
      )

      return updatedTransactions
    })
  }

  const shouldIncludeTransaction = (transaction) => {
    if (timeRange === 'ALL') return true

    const transactionDate = new Date(transaction.created_at)
    const now = new Date()
    
    switch (timeRange) {
      case '30MIN':
        return now - transactionDate <= 30 * 60 * 1000
      case '1H':
        return now - transactionDate <= 60 * 60 * 1000
      case '24H':
        return now - transactionDate <= 24 * 60 * 60 * 1000
      case '7D':
        return now - transactionDate <= 7 * 24 * 60 * 60 * 1000
      case '30D':
        return now - transactionDate <= 30 * 24 * 60 * 60 * 1000
      default:
        return true
    }
  }

  // Efecto para inicializar el gráfico y manejar la suscripción a tiempo real
  useEffect(() => {
    const cleanup = initializeChart()
    
    const loadInitialData = async () => {
      const transactions = await fetchTransactions()
      setTransactions(transactions)
    }

    channelRef.current = supabase
      .channel('transactions-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'transactions',
        },
        handleRealtimeTransaction
      )
      .subscribe()

    loadInitialData()

    return () => {
      cleanup?.()
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
      }
    }
  }, [timeRange, showAccumulated])

  // Efecto para actualizar el gráfico cuando cambian las transacciones o el timeRange
  useEffect(() => {
    if (transactions.length) {
      updateChart(transactions)
    }
  }, [transactions, showAccumulated, timeRange])

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
      <div className="flex flex-col gap-6 mb-6">
        {/* Estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <div className="text-sm text-gray-500 dark:text-gray-400">Total Ingresos</div>
            <div className="text-2xl font-bold text-green-500">
              +{stats.totalIncomes.toFixed(2)}€
            </div>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <div className="text-sm text-gray-500 dark:text-gray-400">Total Ventas</div>
            <div className="text-2xl font-bold text-red-500">
              -{stats.totalExpenses.toFixed(2)}€
            </div>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <div className="text-sm text-gray-500 dark:text-gray-400">Balance Total</div>
            <div className={`text-2xl font-bold ${stats.accumulated >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {stats.accumulated >= 0 ? '+' : ''}{stats.accumulated.toFixed(2)}€
            </div>
          </div>
        </div>

        {/* Controles */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Análisis de Transacciones
            </h2>
            <button
  onClick={() => setShowAccumulated(!showAccumulated)}
  className={`px-3 py-1 rounded-lg text-sm transition-colors flex items-center gap-2 ${
    showAccumulated
      ? 'bg-blue-500 text-white'
      : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
  }`}
>
  {showAccumulated ? (
    <>
      <BarChart3 className="w-4 h-4" />
      <span className="hidden sm:inline">Ver Individual</span>
    </>
  ) : (
    <>
      <LineChart className="w-4 h-4" />
      <span className="hidden sm:inline">Ver Acumulado</span>
    </>
  )}
</button>
          </div>
          
          <div className="flex flex-wrap gap-2">
            {Object.entries(TIME_RANGES).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setTimeRange(key)}
                className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                  timeRange === key
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Gráfico */}
      <div ref={chartContainerRef} />
    </div>
  )
}