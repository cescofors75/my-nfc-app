import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import _ from 'lodash';
import { ShoppingCart } from 'lucide-react';

const TransactionsDonut = ({ transactions }) => {
  // Filtrar solo las compras y agruparlas por descripción
  const purchasesByDescription = _(transactions)
    .filter(t => t.type !== 'DEPOSIT')
    .groupBy('description')
    .map((group, description) => ({
      name: description || 'Sin descripción',
      value: _.sumBy(group, 'amount'),
      count: group.length
    }))
    .value();

  // Colores que coinciden con el tema
  const COLORS = [
    'rgb(239, 68, 68)',   // red-500
    'rgb(248, 113, 113)', // red-400
    'rgb(252, 165, 165)', // red-300
    'rgb(254, 202, 202)', // red-200
    'rgb(254, 226, 226)'  // red-100
  ];

  // Formatear el valor para el tooltip
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white dark:bg-gray-800 p-4 shadow-lg rounded-lg border border-gray-200 dark:border-gray-700">
          <p className="text-sm font-medium text-gray-900 dark:text-white">
            {data.name}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Cantidad: {data.value.toFixed(2)}€
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Transacciones: {data.count}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-lg p-4">
      <div className="flex items-center space-x-2 mb-4">
        <ShoppingCart className="h-5 w-5 text-gray-500 dark:text-gray-400" />
        <h2 className="text-lg font-medium text-gray-900 dark:text-white">
          Distribución de Compras
        </h2>
      </div>
      
      {purchasesByDescription.length > 0 ? (
        <div className="h-96">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={purchasesByDescription}
                cx="50%"
                cy="50%"
                innerRadius="60%"
                outerRadius="80%"
                fill="#8884d8"
                dataKey="value"
                label={({ name, percent }) => 
                  `${name} (${(percent * 100).toFixed(0)}%)`
                }
              >
                {purchasesByDescription.map((entry, index) => (
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
        <div className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
          No hay compras disponibles para mostrar
        </div>
      )}
    </div>
  );
};

export default TransactionsDonut;