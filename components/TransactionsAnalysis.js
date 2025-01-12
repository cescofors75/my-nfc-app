import React, { useState, useMemo } from 'react';
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
import { ArrowDownRight, ArrowUpRight } from 'lucide-react';

const TransactionAnalysis = () => {
  const [timeRange, setTimeRange] = useState('24h');
  const [showAccumulated, setShowAccumulated] = useState(false);

  // Generar datos que reflejen el comportamiento real
  const rawData = useMemo(() => {
    const now = new Date();
    let dataPoints;
    let format;
    
    switch(timeRange) {
      case '30m':
        dataPoints = 30;
        format = (i) => `${29-i}m`;
        break;
      case '1h':
        dataPoints = 60;
        format = (i) => `${59-i}m`;
        break;
      case '24h':
        dataPoints = 24;
        format = (i) => `${23-i}h`;
        break;
      case '7d':
        dataPoints = 7;
        format = (i) => `D${6-i}`;
        break;
      case '30d':
        dataPoints = 30;
        format = (i) => `D${29-i}`;
        break;
      case 'all':
        dataPoints = 90;
        format = (i) => `D${89-i}`;
        break;
      default:
        dataPoints = 24;
        format = (i) => `${23-i}h`;
    }

    // Simulamos que no hay transacciones en la última hora
    return Array.from({ length: dataPoints }, (_, i) => {
      const isLastHour = timeRange === '24h' ? i === 0 : 
                        timeRange === '1h' || timeRange === '30m' ? true : false;
      
      // Si estamos en la última hora, los valores son 0
      const value = isLastHour ? 0 : Math.floor(20 + Math.random() * 130);
      const purchaseValue = isLastHour ? 0 : Math.floor(15 + Math.random() * 85);

      return {
        time: format(i),
        deposits: value,
        purchases: purchaseValue,
      };
    });
  }, [timeRange]);

  // Calcular datos acumulados si es necesario
  const data = useMemo(() => {
    if (!showAccumulated) return rawData;
    
    let accumulatedDeposits = 0;
    let accumulatedPurchases = 0;
    
    return rawData.map(item => ({
      ...item,
      deposits: accumulatedDeposits += item.deposits,
      purchases: accumulatedPurchases += item.purchases,
    }));
  }, [rawData, showAccumulated]);

  // Cálculo de estadísticas excluyendo la última hora
  const stats = useMemo(() => {
    const relevantData = timeRange === '1h' || timeRange === '30m' ? 
      data.slice(-10) : // Para rangos cortos, usamos los últimos 10 puntos
      data.slice(1);    // Para otros rangos, excluimos la última hora

    const totalDeposits = relevantData.reduce((sum, item) => sum + item.deposits, 0);
    const totalPurchases = relevantData.reduce((sum, item) => sum + item.purchases, 0);
    
    const firstValues = relevantData[0];
    const lastValues = relevantData[relevantData.length - 1];
    
    const depositChange = firstValues.deposits ? 
      ((lastValues.deposits - firstValues.deposits) / firstValues.deposits) * 100 : 0;
    const purchaseChange = firstValues.purchases ? 
      ((lastValues.purchases - firstValues.purchases) / firstValues.purchases) * 100 : 0;
    
    return {
      totalDeposits,
      totalPurchases,
      depositChange: !isNaN(depositChange) ? depositChange : 0,
      purchaseChange: !isNaN(purchaseChange) ? purchaseChange : 0,
    };
  }, [data, timeRange]);

  const timeRanges = [
    { label: '30 min', value: '30m' },
    { label: '1h', value: '1h' },
    { label: '24h', value: '24h' },
    { label: '7d', value: '7d' },
    { label: '30d', value: '30d' },
    { label: 'Todo', value: 'all' },
  ];

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload || !payload.length) return null;
    
    return (
      <div className="bg-slate-800 p-3 rounded-lg border border-slate-700 shadow-lg">
        <p className="text-gray-400 mb-2">{label}</p>
        {payload.map((entry, index) => (
          <p key={index} className="flex items-center gap-2" style={{ color: entry.color }}>
            <span className="font-semibold">{entry.name}:</span>
            <span>{entry.value.toFixed(2)}</span>
          </p>
        ))}
      </div>
    );
  };

  const formatValue = (value) => {
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
    return value.toFixed(2);
  };

  return (
    <div className="w-full p-2 sm:p-4 bg-slate-900 text-white min-h-[500px]">
      {/* Header y Controles */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-2 relative">
          <h2 className="text-lg font-semibold">Análisis de Transacciones</h2>
          <button 
            onClick={() => setShowAccumulated(!showAccumulated)}
            className={`flex items-center gap-1 px-3 py-1 rounded-md text-sm transition-colors
              ${showAccumulated ? 'bg-blue-500/20 text-blue-400' : 'text-gray-400 hover:bg-slate-800'}`}
          >
            Ver Acumulado
          </button>
        </div>
        
        {/* Controles de tiempo responsive */}
        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          {timeRanges.map(({ label, value }) => (
            <button
              key={value}
              className={`px-3 py-1 rounded-md text-sm transition-colors flex-1 sm:flex-none
                ${timeRange === value 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-slate-800 text-gray-400 hover:bg-slate-700'}`}
              onClick={() => setTimeRange(value)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-slate-800 p-4 rounded-lg">
          <div className="text-gray-400 text-sm mb-2">Total Depósitos</div>
          <div className="flex items-center gap-2">
            <span className="text-xl font-bold">{formatValue(stats.totalDeposits)}</span>
            <span className={`flex items-center text-sm ${stats.depositChange >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {stats.depositChange >= 0 ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
              {Math.abs(stats.depositChange).toFixed(1)}%
            </span>
          </div>
        </div>
        <div className="bg-slate-800 p-4 rounded-lg">
          <div className="text-gray-400 text-sm mb-2">Total Compras</div>
          <div className="flex items-center gap-2">
            <span className="text-xl font-bold">{formatValue(stats.totalPurchases)}</span>
            <span className={`flex items-center text-sm ${stats.purchaseChange >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {stats.purchaseChange >= 0 ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
              {Math.abs(stats.purchaseChange).toFixed(1)}%
            </span>
          </div>
        </div>
      </div>

      {/* Chart Container */}
      <div className="h-[400px] sm:h-[500px]">
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
      </div>
    </div>
  );
};

export default TransactionAnalysis;