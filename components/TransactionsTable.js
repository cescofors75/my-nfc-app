import React, { useState } from 'react';
import { ListFilter, ArrowDownCircle, ArrowUpCircle } from 'lucide-react'
const TransactionsTable = ({ transactions }) => {
  const [transactionFilter, setTransactionFilter] = useState('ALL');
  
  const filteredTransactions = transactions.filter(transaction => 
    transactionFilter === 'ALL' ? true : transaction.type === transactionFilter
  );

  return (
    <div className="rounded-lg shadow dark:bg-gray-800">
      <div className="p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 sm:mb-0">
            Últimas Transacciones
          </h2>
          
          <div className="flex space-x-2 w-full sm:w-auto">
  <button
    onClick={() => setTransactionFilter('ALL')}
    className={`flex-1 sm:flex-none px-3 py-1 rounded flex items-center justify-center gap-2 ${
      transactionFilter === 'ALL'
        ? 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-100'
        : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
    }`}
  >
    <ListFilter className="w-4 h-4" />
    <span className="hidden sm:inline">Todas</span>
  </button>
  
  <button
    onClick={() => setTransactionFilter('DEPOSIT')}
    className={`flex-1 sm:flex-none px-3 py-1 rounded flex items-center justify-center gap-2 ${
      transactionFilter === 'DEPOSIT'
        ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-100'
        : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
    }`}
  >
    <ArrowUpCircle className="w-4 h-4" />
    <span className="hidden sm:inline">Ingresos</span>
  </button>
  
  <button
    onClick={() => setTransactionFilter('PURCHASE')}
    className={`flex-1 sm:flex-none px-3 py-1 rounded flex items-center justify-center gap-2 ${
      transactionFilter === 'PURCHASE'
        ? 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-100'
        : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
    }`}
  >
    <ArrowDownCircle className="w-4 h-4" />
    <span className="hidden sm:inline">Ventas</span>
  </button>
</div>


        </div>

        {/* Vista de escritorio */}
        <div className="hidden md:block overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead>
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Fecha/Hora
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Usuario
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Tipo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Cantidad
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Descripción
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredTransactions.map((transaction) => (
                <tr key={transaction.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {new Date(transaction.created_at).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {transaction.wristbands?.owner_name || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        transaction.type === 'DEPOSIT'
                          ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-100'
                          : 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-100'
                      }`}
                    >
                      {transaction.type === 'DEPOSIT' ? 'Ingreso' : 'Gasto'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span
                      className={transaction.type === 'DEPOSIT' 
                        ? 'text-green-600 dark:text-green-400' 
                        : 'text-red-600 dark:text-red-400'
                      }
                    >
                      {transaction.type === 'DEPOSIT' ? '+' : '-'}
                      {transaction.amount.toFixed(2)}€
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                    {transaction.description || '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Vista móvil */}
        <div className="md:hidden space-y-4">
          {filteredTransactions.map((transaction) => (
            <div
              key={transaction.id}
              className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 space-y-2"
            >
              <div className="flex justify-between items-start">
                <span
                  className={`px-2 py-1 text-xs font-semibold rounded-full ${
                    transaction.type === 'DEPOSIT'
                      ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-100'
                      : 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-100'
                  }`}
                >
                  {transaction.type === 'DEPOSIT' ? 'Ingreso' : 'Gasto'}
                </span>
                <span
                  className={`text-lg font-bold ${
                    transaction.type === 'DEPOSIT'
                      ? 'text-green-600 dark:text-green-400'
                      : 'text-red-600 dark:text-red-400'
                  }`}
                >
                  {transaction.type === 'DEPOSIT' ? '+' : '-'}
                  {transaction.amount.toFixed(2)}€
                </span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {new Date(transaction.created_at).toLocaleString()}
                </span>
              </div>

              {transaction.wristbands?.owner_name && (
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  Usuario: {transaction.wristbands.owner_name}
                </div>
              )}

              {transaction.description && (
                <div className="text-sm text-gray-500 dark:text-gray-400 border-t border-gray-200 dark:border-gray-600 pt-2 mt-2">
                  {transaction.description}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TransactionsTable;