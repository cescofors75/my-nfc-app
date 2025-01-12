import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine
} from 'recharts';
import { LineChart as LineChartIcon, BarChart3 } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';

const TIME_RANGES = {
  '30MIN': '30 minutos',
  '1H': '1 hora',
  '24H': '24 horas',
  '7D': '7 días',
  '30D': '30 días'
};

const formatValue = (value) => {
  if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M €`;
  if (value >= 1000) return `${(value / 1000).toFixed(1)}K €`;
  return `${value.toFixed(2)} €`;
};

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload || !payload.length) return null;
  
  return (
    <div className="bg-white/90 dark:bg-slate-800 p-3 rounded-lg border border-gray-200 dark:border-slate-700 shadow-lg">
      <p className="text-gray-600 dark:text-gray-400 mb-2">{label}</p>
      {payload.map((entry, index) => (
        <p key={index} className="flex items-center gap-2" style={{ color: entry.color }}>
          <span className="font-semibold">{entry.name}:</span>
          <span>{entry.value.toFixed(2)}€</span>
        </p>
      ))}
    </div>
  );
};

const TransactionAnalysis = () => {
  const [timeRange, setTimeRange] = useState('24H');
  const [showAccumulated, setShowAccumulated] = useState(false);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    totalIncomes: 0,
    totalExpenses: 0,
    accumulated: 0
  });

  const shouldIncludeTransaction = useCallback((transaction) => {
    const now = new Date();
    const transactionDate = new Date(transaction.created_at);
    let timeLimit;

    switch (timeRange) {
      case '30MIN':
        timeLimit = 30 * 60 * 1000; // 30 minutes in milliseconds
        break;
      case '1H':
        timeLimit = 60 * 60 * 1000; // 1 hour in milliseconds
        break;
      case '24H':
        timeLimit = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
        break;
      case '7D':
        timeLimit = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds
        break;
      case '30D':
        timeLimit = 30 * 24 * 60 * 60 * 1000; // 30 days in milliseconds
        break;
      default:
        return true;
    }

    return (now.getTime() - transactionDate.getTime()) <= timeLimit;
  }, [timeRange]);

  const fetchTransactions = useCallback(async () => {
    try {
      let query = supabase
        .from('transactions')
        .select('*')
        .order('created_at', { ascending: true });

      const now = new Date();
      let startTime;

      switch (timeRange) {
        case '30MIN':
          startTime = new Date(now - 30 * 60 * 1000);
          break;
        case '1H':
          startTime = new Date(now - 60 * 60 * 1000);
          break;
        case '24H':
          startTime = new Date(now - 24 * 60 * 60 * 1000);
          break;
        case '7D':
          startTime = new Date(now - 7 * 24 * 60 * 60 * 1000);
          break;
        case '30D':
          startTime = new Date(now - 30 * 24 * 60 * 60 * 1000);
          break;
      }

      if (startTime) {
        query = query.gte('created_at', startTime.toISOString());
      }

      const { data, error: supabaseError } = await query;

      if (supabaseError) throw supabaseError;

      return data || [];
    } catch (error) {
      console.error('Error fetching transactions:', error);
      throw error;
    }
  }, [timeRange]);

  const handleRealtimeTransaction = useCallback((payload) => {
    console.log('🔔 Realtime event received:', payload);
    
    setTransactions(currentTransactions => {
      const { eventType, new: newTransaction, old: oldTransaction } = payload;
      let updatedTransactions = [...currentTransactions];

      switch (eventType) {
        case 'INSERT':
          if (shouldIncludeTransaction(newTransaction)) {
            console.log('➕ New transaction inserted:', newTransaction);
            updatedTransactions = [...updatedTransactions, newTransaction];
          }
          break;

        case 'UPDATE':
          console.log('✏️ Transaction updated:', newTransaction);
          updatedTransactions = updatedTransactions.map(t => 
            t.id === newTransaction.id ? newTransaction : t
          );
          break;

        case 'DELETE':
          console.log('❌ Transaction deleted:', oldTransaction);
          updatedTransactions = updatedTransactions.filter(t => 
            t.id !== oldTransaction.id
          );
          break;
      }

      return updatedTransactions.sort((a, b) => 
        new Date(a.created_at) - new Date(b.created_at)
      );
    });
  }, [shouldIncludeTransaction]);

  const processTransactions = useCallback((transactions) => {
    const timeMap = new Map();
    let runningIncomes = 0;
    let runningExpenses = 0;

    transactions.forEach(t => {
      const date = new Date(t.created_at);
      let timeKey;
      
      switch (timeRange) {
        case '30MIN':
        case '1H':
          timeKey = `${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`;
          break;
        case '24H':
          timeKey = `${date.getHours()}:00`;
          break;
        case '7D':
        case '30D':
          timeKey = `${date.getDate()}/${date.getMonth() + 1}`;
          break;
        default:
          timeKey = `${date.getHours()}:00`;
      }

      if (!timeMap.has(timeKey)) {
        timeMap.set(timeKey, { time: timeKey, deposits: 0, purchases: 0 });
      }

      const amount = Number(t.amount || 0);
      if (t.type === 'DEPOSIT') {
        timeMap.get(timeKey).deposits += amount;
        runningIncomes += amount;
      } else {
        timeMap.get(timeKey).purchases += amount;
        runningExpenses += amount;
      }
    });

    setStats({
      totalIncomes: runningIncomes,
      totalExpenses: runningExpenses,
      accumulated: runningIncomes - runningExpenses
    });

    let chartData = Array.from(timeMap.values());

    if (showAccumulated) {
      let accumulatedDeposits = 0;
      let accumulatedPurchases = 0;
      chartData = chartData.map(item => ({
        ...item,
        deposits: (accumulatedDeposits += item.deposits),
        purchases: (accumulatedPurchases += item.purchases)
      }));
    }

    return chartData;
  }, [timeRange, showAccumulated]);

  useEffect(() => {
    let subscription;

    const initializeData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Fetch initial data
        const data = await fetchTransactions();
        setTransactions(data);
        
        // Setup realtime subscription
        subscription = supabase
          .channel('transactions-channel')
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'transactions'
            },
            handleRealtimeTransaction
          )
          .subscribe((status) => {
            console.log('🔌 Subscription status:', status);
          });

      } catch (err) {
        console.error('Error initializing data:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    initializeData();

    return () => {
      if (subscription) {
        console.log('🔌 Unsubscribing from realtime channel');
        supabase.removeChannel(subscription);
      }
    };
  }, [fetchTransactions, handleRealtimeTransaction]);

  const data = useMemo(() => {
    return processTransactions(transactions);
  }, [transactions, processTransactions]);

  return (
    <div className="w-full p-2 sm:p-4 bg-white dark:bg-slate-900 text-gray-900 dark:text-white min-h-[500px] transition-colors">
      {error && (
        <div className="mb-4 p-4 bg-red-50 dark:bg-red-500/10 border border-red-500 rounded-lg text-red-500">
          Error: {error}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-gray-50 dark:bg-slate-800 p-4 rounded-lg transition-colors">
          <div className="text-gray-500 dark:text-gray-400 text-sm mb-2">Total Depósitos</div>
          <div className="text-2xl font-bold text-green-600 dark:text-green-500">
            +{formatValue(stats.totalIncomes)}
          </div>
        </div>
        <div className="bg-gray-50 dark:bg-slate-800 p-4 rounded-lg transition-colors">
          <div className="text-gray-500 dark:text-gray-400 text-sm mb-2">Total Compras</div>
          <div className="text-2xl font-bold text-red-600 dark:text-red-500">
            -{formatValue(stats.totalExpenses)}
          </div>
        </div>
        <div className="bg-gray-50 dark:bg-slate-800 p-4 rounded-lg transition-colors">
          <div className="text-gray-500 dark:text-gray-400 text-sm mb-2">Balance Total</div>
          <div className={`text-2xl font-bold ${
            stats.accumulated >= 0 
              ? 'text-green-600 dark:text-green-500' 
              : 'text-red-600 dark:text-red-500'
          }`}>
            {stats.accumulated >= 0 ? '+' : ''}{formatValue(stats.accumulated)}
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-2 relative">
          <h2 className="text-lg font-semibold">Análisis de Transacciones</h2>
          <button 
            onClick={() => setShowAccumulated(!showAccumulated)}
            className={`flex items-center gap-2 px-3 py-1 rounded-md text-sm transition-colors
              ${showAccumulated 
                ? 'bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400' 
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800'
              }`}
          >
            {showAccumulated ? (
              <>
                <BarChart3 className="w-4 h-4" />
                <span>Ver Individual</span>
              </>
            ) : (
              <>
                <LineChartIcon className="w-4 h-4" />
                <span>Ver Acumulado</span>
              </>
            )}
          </button>
        </div>
        
        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          {Object.entries(TIME_RANGES).map(([key, label]) => (
            <button
              key={key}
              className={`px-3 py-1 rounded-md text-sm transition-colors flex-1 sm:flex-none
                ${timeRange === key 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-slate-700'
                }`}
              onClick={() => setTimeRange(key)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="h-[400px] sm:h-[500px]">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart 
              data={data} 
              margin={{ top: 20, right: 30, left: 0, bottom: 20 }}
            >
              <CartesianGrid 
                strokeDasharray="3 3" 
                stroke="rgba(148, 163, 184, 0.1)" 
                className="dark:opacity-20"
              />
              <XAxis
                dataKey="time"
                stroke="rgb(148, 163, 184)"
                tick={{ fill: 'currentColor' }}
                tickLine={{ stroke: 'currentColor' }}
                className="text-gray-600 dark:text-gray-400"
                reversed={true}
              />
              <YAxis
                stroke="rgb(148, 163, 184)"
                tick={{ fill: 'currentColor' }}
                tickLine={{ stroke: 'currentColor' }}
                className="text-gray-600 dark:text-gray-400"
                domain={[0, 'auto']}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend 
                verticalAlign="top"
                height={36}
                iconType="circle"
              />
              <ReferenceLine y={0} stroke="rgb(148, 163, 184)" className="opacity-20" />
              <Line
                type="monotone"
                dataKey="deposits"
                name="Depósitos"
                stroke="#10b981"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 6, strokeWidth: 2 }}
              />
              <Line
                type="monotone"
                dataKey="purchases"
                name="Compras"
                stroke="#ef4444"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 6, strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
};

export default TransactionAnalysis;