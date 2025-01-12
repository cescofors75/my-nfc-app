'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts'
import _ from 'lodash'
import { ShoppingCart } from 'lucide-react'
import { supabase } from '@/lib/supabaseClient'

const TIME_RANGES = {
  '24H': '24 horas',
  '7D': '7 días',
  '30D': '30 días',
  'ALL': 'Todo'
}

const COLORS = [
  '#EF4444', // red-500
  '#F87171', // red-400
  '#FCA5A5', // red-300
  '#FECACA', // red-200
  '#FEE2E2', // red-100
]

export default function TransactionsDonut() {
  const [timeRange, setTimeRange] = useState('24H')
  const [transactions, setTransactions] = useState([])
  const [chartData, setChartData] = useState([])
  const [stats, setStats] = useState({
    totalPurchases: 0,
    totalCategories: 0,
    averageAmount: 0
  })
  
  const channelRef = useRef(null)

  const fetchTransactions = useCallback(async () => {
    console.log('🔄 Obteniendo transacciones para:', timeRange)
    try {
      let query = supabase
        .from('transactions')
        .select('*')
        .order('created_at', { ascending: true })

      const now = new Date()
      let startTime

      switch (timeRange) {
        case '24H':
          startTime = new Date(now - 24 * 60 * 60 * 1000)
          break
        case '7D':
          startTime = new Date(now - 7 * 24 * 60 * 60 * 1000)
          break
        case '30D':
          startTime = new Date(now - 30 * 24 * 60 * 60 * 1000)
          break
      }

      if (startTime) {
        query = query.gte('created_at', startTime.toISOString())
      }

      const { data, error } = await query
      
      if (error) {
        console.error('❌ Error obteniendo transacciones:', error)
        return []
      }

      console.log('✅ Transacciones obtenidas:', data?.length)
      return data || []
    } catch (error) {
      console.error('❌ Error inesperado:', error)
      return []
    }
  }, [timeRange])

  const processTransactions = useCallback((transactions) => {
    const filteredTransactions = transactions.filter(t => t.type !== 'DEPOSIT')
    
    const groupedData = _(filteredTransactions)
      .groupBy('description')
      .map((group, name) => ({
        name: name || 'Sin categoría',
        value: _.sumBy(group, 'amount'),
        count: group.length,
        lastTransaction: _.maxBy(group, 'created_at')?.created_at
      }))
      .value()

    const totalAmount = _.sumBy(filteredTransactions, 'amount')

    setStats({
      totalPurchases: filteredTransactions.length,
      totalCategories: groupedData.length,
      averageAmount: filteredTransactions.length > 0 
        ? totalAmount / filteredTransactions.length 
        : 0
    })

    setChartData(groupedData)
  }, [])

  const handleRealtimeTransaction = useCallback((payload) => {
    console.log('🔔 Evento realtime recibido:', payload)
    
    setTransactions(currentTransactions => {
      const { eventType, new: newTransaction, old: oldTransaction } = payload
      let updatedTransactions = [...currentTransactions]

      switch (eventType) {
        case 'INSERT':
          console.log('➕ Nueva transacción insertada:', newTransaction)
          updatedTransactions = [...updatedTransactions, newTransaction]
          break

        case 'UPDATE':
          console.log('✏️ Transacción actualizada:', newTransaction)
          updatedTransactions = updatedTransactions.map(t => 
            t.id === newTransaction.id ? newTransaction : t
          )
          break

        case 'DELETE':
          console.log('❌ Transacción eliminada:', oldTransaction)
          updatedTransactions = updatedTransactions.filter(t => 
            t.id !== oldTransaction.id
          )
          break
      }

      return updatedTransactions
    })
  }, [])

  // Efecto para inicialización y suscripción realtime
  useEffect(() => {
    console.log('🔄 Inicializando componente')
    
    const loadInitialData = async () => {
      const transactions = await fetchTransactions()
      setTransactions(transactions)
    }

    // Configurar canal realtime
    channelRef.current = supabase
      .channel('transactions-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'transactions' },
        handleRealtimeTransaction
      )
      .subscribe((status) => {
        console.log('📡 Estado de la suscripción:', status)
      })

    loadInitialData()

    return () => {
      if (channelRef.current) {
        console.log('🔌 Desconectando canal realtime')
        supabase.removeChannel(channelRef.current)
      }
    }
  }, [fetchTransactions, handleRealtimeTransaction])

  // Efecto para procesar transacciones cuando cambian
  useEffect(() => {
    if (transactions.length) {
      processTransactions(transactions)
    }
  }, [transactions, processTransactions])

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-white dark:bg-gray-800 p-4 shadow-lg rounded-lg border border-gray-200 dark:border-gray-700">
          <p className="text-sm font-medium text-gray-900 dark:text-white">
            {data.name}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Total: {data.value.toFixed(2)}€
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Cantidad: {data.count}
          </p>
          {data.lastTransaction && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Última: {new Date(data.lastTransaction).toLocaleString()}
            </p>
          )}
        </div>
      )
    }
    return null
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
      <div className="flex flex-col gap-6 mb-6">
        {/* Estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <div className="text-sm text-gray-500 dark:text-gray-400">Total Compras</div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {stats.totalPurchases}
            </div>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <div className="text-sm text-gray-500 dark:text-gray-400">Categorías</div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {stats.totalCategories}
            </div>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <div className="text-sm text-gray-500 dark:text-gray-400">Promedio</div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {stats.averageAmount.toFixed(2)}€
            </div>
          </div>
        </div>

        {/* Controles */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-4">
            <ShoppingCart className="h-5 w-5 text-gray-500 dark:text-gray-400" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Distribución de Compras
            </h2>
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
      {chartData.length > 0 ? (
        <div className="h-96">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius="60%"
                outerRadius="80%"
                fill="#8884d8"
                dataKey="value"
                label={({ name, percent }) => 
                  `${name} (${(percent * 100).toFixed(0)}%)`
                }
                animationDuration={300}
                animationBegin={0}
              >
                {chartData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={COLORS[index % COLORS.length]}
                    className="stroke-white dark:stroke-gray-800"
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend 
                verticalAlign="bottom" 
                height={36}
                formatter={(value) => (
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    {value}
                  </span>
                )}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="h-96 flex items-center justify-center text-gray-500 dark:text-gray-400">
          No hay compras disponibles para mostrar
        </div>
      )}
    </div>
  )
}