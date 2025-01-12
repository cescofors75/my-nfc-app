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
import {  LineChart as LineChartIcon, BarChart3 } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';

const TIME_RANGES = {
  '30MIN': '30 minutos',
  '1H': '1 hora',
  '24H': '24 horas',
  '7D': '7 días',
  '30D': '30 días'
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

  // Función mejorada para obtener transacciones
  const fetchTransactions = useCallback(async () => {
    setError(null);
    console.log('🔄 Obteniendo transacciones para:', timeRange);
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
        const formattedDate = startTime.toISOString();
        console.log('🕒 Fecha de inicio:', formattedDate);
        query = query.gte('created_at', formattedDate);
      }

      const { data, error: supabaseError } = await query;

      if (supabaseError) {
        console.error('❌ Error obteniendo transacciones:', supabaseError);
        setError(supabaseError.message);
        return [];
      }

      console.log('✅ Transacciones obtenidas:', data?.length);
      return data || [];
    } catch (error) {
      console.error('❌ Error inesperado:', error);
      setError(error.message);
      return [];
    }
  }, [timeRange]);

  // Función para procesar las transacciones
  const processTransactions = useCallback((transactions) => {
    console.log('📊 Procesando transacciones:', transactions.length);
    const timeMap = new Map();
    let runningIncomes = 0;
    let runningExpenses = 0;

    transactions.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));

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

    // Aplicar acumulado si está activado
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

  // Efecto para cargar datos iniciales
  useEffect(() => {
    setLoading(true);
    fetchTransactions()
      .then(data => {
        setTransactions(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error en fetchTransactions:', err);
        setError(err.message);
        setLoading(false);
      });
  }, [fetchTransactions]);

  // Procesar datos para el gráfico
  const data = useMemo(() => {
    return processTransactions(transactions);
  }, [transactions, processTransactions]);

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload || !payload.length) return null;
    
    return (
      <div className="bg-slate-800 p-3 rounded-lg border border-slate-700 shadow-lg">
        <p className="text-gray-400 mb-2">{label}</p>
        {payload.map((entry, index) => (
          <p key={index} className="flex items-center gap-2" style={{ color: entry.color }}>
            <span className="font-semibold">{entry.name}:</span>
            <span>{entry.value.toFixed(2)}€</span>
          </p>
        ))}
      </div>
    );
  };

  const formatValue = (value) => {
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M €`;
    if (value >= 1000) return `${(value / 1000).toFixed(1)}K €`;
    return `${value.toFixed(2)} €`;
  };

  return (
    <div className="w-full p-2 sm:p-4 bg-slate-900 text-white min-h-[500px]">
      {error && (
        <div className="mb-4 p-4 bg-red-500/10 border border-red-500 rounded-lg text-red-500">
          Error: {error}
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-slate-800 p-4 rounded-lg">
          <div className="text-gray-400 text-sm mb-2">Total Depósitos</div>
          <div className="text-2xl font-bold text-green-500">
            +{formatValue(stats.totalIncomes)}
          </div>
        </div>
        <div className="bg-slate-800 p-4 rounded-lg">
          <div className="text-gray-400 text-sm mb-2">Total Compras</div>
          <div className="text-2xl font-bold text-red-500">
            -{formatValue(stats.totalExpenses)}
          </div>
        </div>
        <div className="bg-slate-800 p-4 rounded-lg">
          <div className="text-gray-400 text-sm mb-2">Balance Total</div>
          <div className={`text-2xl font-bold ${stats.accumulated >= 0 ? 'text-green-500' : 'text-red-500'}`}>
            {stats.accumulated >= 0 ? '+' : ''}{formatValue(stats.accumulated)}
          </div>
        </div>
      </div>

      {/* Header y Controles */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-2 relative">
          <h2 className="text-lg font-semibold">Análisis de Transacciones</h2>
          <button 
            onClick={() => setShowAccumulated(!showAccumulated)}
            className={`flex items-center gap-2 px-3 py-1 rounded-md text-sm transition-colors
              ${showAccumulated ? 'bg-blue-500/20 text-blue-400' : 'text-gray-400 hover:bg-slate-800'}`}
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
        
        {/* Controles de tiempo responsive */}
        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          {Object.entries(TIME_RANGES).map(([key, label]) => (
            <button
              key={key}
              className={`px-3 py-1 rounded-md text-sm transition-colors flex-1 sm:flex-none
                ${timeRange === key 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-slate-800 text-gray-400 hover:bg-slate-700'}`}
              onClick={() => setTimeRange(key)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Chart Container */}
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
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis
                dataKey="time"
                stroke="#94a3b8"
                tick={{ fill: '#94a3b8' }}
                tickLine={{ stroke: '#94a3b8' }}
                reversed={true}
              />
              <YAxis
                stroke="#94a3b8"
                tick={{ fill: '#94a3b8' }}
                tickLine={{ stroke: '#94a3b8' }}
                domain={[0, 'auto']}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend 
                verticalAlign="top"
                height={36}
                iconType="circle"
              />
              <ReferenceLine y={0} stroke="#475569" />
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