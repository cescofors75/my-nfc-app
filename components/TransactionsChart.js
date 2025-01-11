/* eslint-disable react-hooks/exhaustive-deps */
'use client'

import { useState, useEffect, useRef } from 'react'
import { createChart } from 'lightweight-charts'
import { supabase } from '@/lib/supabaseClient'

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

  const processTransactions = (transactions) => {
    const timeMap = new Map()
    let accumulatedIncomes = 0
    let accumulatedExpenses = 0
    let totalAccumulated = 0
    
    transactions.forEach(t => {
      const timestamp = new Date(t.created_at).getTime() / 1000
      if (!timeMap.has(timestamp)) {
        timeMap.set(timestamp, { 
          incomes: 0, 
          expenses: 0, 
          accumulated: 0 
        })
      }
      
      if (t.type === 'DEPOSIT') {
        timeMap.get(timestamp).incomes += t.amount
        accumulatedIncomes += t.amount
      } else {
        timeMap.get(timestamp).expenses += t.amount
        accumulatedExpenses += t.amount
      }

      totalAccumulated = accumulatedIncomes - accumulatedExpenses
      timeMap.get(timestamp).accumulated = totalAccumulated
    })

    setStats({
      totalIncomes: accumulatedIncomes,
      totalExpenses: accumulatedExpenses,
      accumulated: totalAccumulated
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

    // Aplicar filtro de tiempo
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

    const { data: transactions } = await query
    return transactions || []
  }

  useEffect(() => {
    if (!chartContainerRef.current) return

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
        vertLine: {
          color: '#9CA3AF',
          width: 1,
          style: 1,
        },
        horzLine: {
          color: '#9CA3AF',
          width: 1,
          style: 1,
        },
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

    const loadData = async () => {
      const transactions = await fetchTransactions()
      const { incomes, expenses, accumulated } = processTransactions(transactions)
      
      incomesSeriesRef.current.setData(incomes)
      expensesSeriesRef.current.setData(expenses)
      accumulatedSeriesRef.current.setData(accumulated)
    }

    loadData()

    const channel = supabase
      .channel('realtime-charts')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'transactions',
        },
        async () => {
          await loadData()
        }
      )
      .subscribe()

    const handleResize = () => {
      chartRef.current.applyOptions({
        width: chartContainerRef.current.clientWidth,
      })
    }

    window.addEventListener('resize', handleResize)
    handleResize()

    return () => {
      window.removeEventListener('resize', handleResize)
      chartRef.current.remove()
      supabase.removeChannel(channel)
    }
  }, [timeRange, showAccumulated])

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
              className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                showAccumulated
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              {showAccumulated ? 'Ver Individual' : 'Ver Acumulado'}
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