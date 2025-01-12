import React, { useState } from 'react';
import { Wallet, Download, ShoppingCart, Clock, Search } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const TransactionsTable = ({ transactions = [] }) => {
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredTransactions = transactions.filter(transaction => {
    const matchesFilter = 
      filter === 'all' ? true : 
      filter === 'deposits' ? transaction.type === 'DEPOSIT' : 
      transaction.type === 'PURCHASE';

    const searchMatch = searchTerm.trim() === '' ? true : (
      (transaction.description?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (transaction.wristbands?.owner_name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (transaction.amount?.toString() || '').includes(searchTerm.toLowerCase())
    );

    return matchesFilter && searchMatch;
  });

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return `Hoy ${format(date, 'HH:mm')}`;
    } else if (date.toDateString() === yesterday.toDateString()) {
      return `Ayer ${format(date, 'HH:mm')}`;
    } else {
      return format(date, "d MMM yyyy HH:mm", { locale: es });
    }
  };

  return (
    <div className="mt-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4">
        <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white mb-4 sm:mb-0">
          Últimas transacciones
        </h3>

        {/* Barra de búsqueda */}
        <div className="relative w-full sm:w-64">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-gray-400" />
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar transacciones..."
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white transition-colors duration-200"
          />
        </div>
      </div>
      
      {/* Filtros */}
      <div className="mt-2 sm:mt-0 flex space-x-2 bg-white dark:bg-gray-800 p-1 rounded-lg shadow-sm mb-4">
        <button
          onClick={() => setFilter('all')}
          className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200
            ${filter === 'all' 
              ? 'bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-100' 
              : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
        >
          <Wallet className="h-4 w-4 sm:mr-2" />
          <span className="hidden sm:inline">Todas</span>
        </button>
        <button
          onClick={() => setFilter('deposits')}
          className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200
            ${filter === 'deposits' 
              ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-100' 
              : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
        >
          <Download className="h-4 w-4 sm:mr-2" />
          <span className="hidden sm:inline">Depósitos</span>
        </button>
        <button
          onClick={() => setFilter('purchases')}
          className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200
            ${filter === 'purchases' 
              ? 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-100' 
              : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
        >
          <ShoppingCart className="h-4 w-4 sm:mr-2" />
          <span className="hidden sm:inline">Compras</span>
        </button>
      </div>

      {/* Lista de Transacciones */}
      <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-lg">
        {filteredTransactions.length > 0 ? (
          <ul className="divide-y divide-gray-200 dark:divide-gray-700">
            {filteredTransactions.map((transaction) => (
              <li key={transaction.id} className="px-4 py-4 sm:px-6 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-150">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3 flex-1">
                    <div className={`flex-shrink-0 rounded-full p-2 ${
                      transaction.type === "DEPOSIT"
                        ? "bg-green-100 dark:bg-green-900"
                        : "bg-red-100 dark:bg-red-900"
                    }`}>
                      {transaction.type === "DEPOSIT" ? (
                        <Download className="h-4 w-4" />
                      ) : (
                        <ShoppingCart className="h-4 w-4" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {transaction.type === "DEPOSIT" ? "Depósito" : "Compra"}
                        </p>
                        {transaction.wristbands?.owner_name && (
                          <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">
                            • {transaction.wristbands.owner_name}
                          </span>
                        )}
                      </div>
                      {transaction.description && (
                        <p className="text-sm text-gray-500 dark:text-gray-400 truncate mt-0.5">
                          {transaction.description}
                        </p>
                      )}
                      <div className="flex items-center mt-1 text-xs text-gray-500 dark:text-gray-400">
                        <Clock className="h-3 w-3 mr-1" />
                        {formatDate(transaction.created_at)}
                      </div>
                    </div>
                  </div>
                  <div className="text-right ml-4">
                    <p className={`text-sm font-medium ${
                      transaction.type === "DEPOSIT" 
                        ? "text-green-600 dark:text-green-400" 
                        : "text-red-600 dark:text-red-400"
                    }`}>
                      {transaction.type === "DEPOSIT" ? "+" : "-"}
                      {(transaction.amount || 0).toFixed(2)}€ 
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Saldo: {(transaction.balanceAtMoment || 0).toFixed(2)}€
                    </p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
            {searchTerm ? (
              <p>No se encontraron transacciones que coincidan con tu búsqueda.</p>
            ) : filter === 'all' 
              ? 'No hay transacciones disponibles'
              : filter === 'deposits'
                ? 'No hay depósitos disponibles'
                : 'No hay compras disponibles'
            }
          </div>
        )}
      </div>
    </div>
  );
};

export default TransactionsTable;