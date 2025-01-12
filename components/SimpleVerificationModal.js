import React from 'react';
import { Download, ShoppingCart } from 'lucide-react';

const SimpleVerificationModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  action,
  wristband,
  amount,
  description,
  loading 
}) => {
  if (!isOpen) return null;
  console.log('action', action);
  console.log('wristband', wristband);
  console.log('amount', amount);
  console.log('description', description);
  console.log('loading', loading);
  console.log('isDeposit', action?.type === "ADD_MONEY"); 
  console.log('isOpen', isOpen);
  console.log('onClose', onClose);
  console.log('onConfirm', onConfirm);
  const isDeposit = action?.type === "ADD_MONEY";

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-md relative">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-white">
            {isDeposit ? (
              <>
                <Download className="h-5 w-5 text-green-500" />
                Confirmar Depósito
              </>
            ) : (
              <>
                <ShoppingCart className="h-5 w-5 text-red-500" />
                Confirmar Compra
              </>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <div className="text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {isDeposit ? 
                '¿Confirmas que deseas realizar un depósito de:' : 
                '¿Confirmas que deseas realizar un cargo de:'}
            </p>
            <p className={`text-3xl font-bold mt-2 ${
              isDeposit ? 'text-green-600' : 'text-red-600'
            }`}>
              ${Number(amount).toFixed(2)}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
              {isDeposit 
                ? `en la pulsera de ${wristband.owner_name}`
                : `Concepto: ${description}`
              }
            </p>
          </div>

          {!isDeposit && (
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mt-4">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Saldo actual:</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  ${wristband.balance.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between text-sm mt-1">
                <span className="text-gray-600 dark:text-gray-400">Saldo resultante:</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  ${(wristband.balance - Number(amount)).toFixed(2)}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex gap-3 justify-end">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={`px-4 py-2 text-sm font-medium text-white rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 ${
              isDeposit 
                ? 'bg-green-600 hover:bg-green-700 focus:ring-green-500' 
                : 'bg-red-600 hover:bg-red-700 focus:ring-red-500'
            }`}
          >
            {loading ? (
              <div className="flex items-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Procesando...
              </div>
            ) : (
              'Confirmar'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SimpleVerificationModal;