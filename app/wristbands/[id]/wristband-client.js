/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable react-hooks/exhaustive-deps */
"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import NFCVerificationModal from "@/components/NFCVerificationModal";
import { toast } from "sonner";
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { AlertCircle, CheckCircle2, XCircle, Clock, Wallet, Download, ShoppingCart } from 'lucide-react';

export function WristbandClient({ initialData, id }) {
  const [wristband, setWristband] = useState(initialData.wristband);
  const [transactions, setTransactions] = useState(initialData.transactions);
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);
  const [lastTransactionTime, setLastTransactionTime] = useState(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [filter, setFilter] = useState('all'); 
  const [isProcessingTransaction, setIsProcessingTransaction] = useState(false);
  const [lastScanTime, setLastScanTime] = useState(Date.now());
 
  console.log('🔄 Montando componente para wristband:', id, 'tiempo:', Date.now());

  console.log('Estado inicial:', { initialData, id });
  const defaultInitialData = {
    wristband: {
      owner_name: '',
      nfc_uid: '',
      balance: 0,
    },
    transactions: []
  };
  const safeInitialData = initialData || defaultInitialData;

  const filteredTransactions = transactions.filter(transaction => {
    if (filter === 'deposits') return transaction.type === 'DEPOSIT';
    if (filter === 'purchases') return transaction.type === 'PURCHASE';
    return true;
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


  // Función para cargar el wristband
const loadWristband = async () => {
  console.log('⏳ Iniciando loadWristband');
  try {
    const { data } = await supabase
      .from("wristbands")
      .select("*")
      .eq("id", id)
      .single();

    console.log('✅ loadWristband resultado:', data);
    setWristband(data);
  } catch (err) {
    console.error('❌ Error en loadWristband:', err);
    setError(err.message);
  }
};

// Función para cargar y calcular transacciones
const loadTransactions = async () => {
  console.log('⏳ Iniciando loadTransactions');
  try {
    const { data, error } = await supabase
      .from("transactions")
      .select(`
        *,
        wristbands (
          owner_name,
          nfc_uid,
          balance
        )
      `)
      .eq("wristband_id", id)
      .order('created_at', { ascending: true });

    if (error) throw error;

    console.log('📊 Datos crudos de transacciones:', data);

    if (!data) {
      console.log('⚠️ No hay datos de transacciones');
      return;
    }

    let saldoActual = 0;
    const transactionsWithBalance = data.map((transaction) => {
      const prevSaldo = saldoActual;
      
      if (transaction.type === "DEPOSIT") {
        saldoActual += Number(transaction.amount);
        console.log('💰 DEPOSIT:', {
          id: transaction.id,
          amount: transaction.amount,
          saldoAntes: prevSaldo,
          saldoDespues: saldoActual
        });
      } else if (transaction.type === "PURCHASE") {
        saldoActual -= Number(transaction.amount);
        console.log('🛍️ PURCHASE:', {
          id: transaction.id,
          amount: transaction.amount,
          saldoAntes: prevSaldo,
          saldoDespues: saldoActual
        });
      }

      return {
        ...transaction,
        balanceAtMoment: saldoActual,
      };
    });

    console.log('✅ Transacciones procesadas:', transactionsWithBalance);
    setTransactions(transactionsWithBalance.reverse());
  } catch (err) {
    console.error('❌ Error en loadTransactions:', err);
    setError(err.message);
  }
};


  useEffect(() => {
    const currentScanTime = Date.now();
    console.log('📱 Nuevo escaneo detectado:', {
      previousScan: lastScanTime,
      currentScan: currentScanTime,
      timeDiff: currentScanTime - lastScanTime
    });

    // Si hay una transacción en proceso, cancelarla
    if (isProcessingTransaction) {
      console.log('⚠️ Transacción en proceso detectada durante nuevo escaneo');
      setIsProcessingTransaction(false);
      setPendingAction(null);
      setIsVerifying(false);
      toast.warning('Operación anterior cancelada por nuevo escaneo');
    }

    setLastScanTime(currentScanTime);
    
    // Limpiar estados si es un nuevo escaneo
    setAmount('');
    setDescription('');
    setError(null);
    
  }, [id]); // id cambiará con cada nuevo escaneo
// Efecto para la suscripción en tiempo real
useEffect(() => {
  let mounted = true;
  console.log('🔄 Iniciando efecto de suscripción');

  const channel = supabase
    .channel(`wristband-${id}`)
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "transactions",
        filter: `wristband_id=eq.${id}`,
      },
      async (payload) => {
        console.log('📡 Evento recibido:', payload);
        
        if (!mounted) {
          console.log('⚠️ Componente desmontado, ignorando evento');
          return;
        }

        if (payload.new.wristband_id !== id) {
          console.log('⚠️ ID no coincide, ignorando evento');
          return;
        }
        
        console.log('⏳ Esperando antes de actualizar...');
        await new Promise(resolve => setTimeout(resolve, 500));
        
        if (mounted) {
          console.log('🔄 Iniciando actualización tras evento');
          await loadWristband();
          await loadTransactions();
          console.log('✅ Actualización completada');
        }
      }
    )
    .subscribe();

  // Cargar datos iniciales
  loadWristband();
  loadTransactions();

  return () => {
    console.log('🔚 Limpiando efecto de suscripción');
    mounted = false;
    supabase.removeChannel(channel);
  };
}, [id]);
  const handleVerificationSuccess = async () => {
    console.log('🔐 Iniciando verificación:', pendingAction);
    
    if (isProcessingTransaction) {
      console.log('⚠️ Ya hay una transacción en proceso');
      return;
    }

    setIsVerifying(false);
    setError(null);
    setIsProcessingTransaction(true);

    const now = Date.now();
    const COOLDOWN_PERIOD = 10000;
    
    try {
      if (lastTransactionTime && now - lastTransactionTime < COOLDOWN_PERIOD) {
        const remainingSeconds = Math.ceil(
          (COOLDOWN_PERIOD - (now - lastTransactionTime)) / 1000
        );
        throw new Error(`Por seguridad, espera ${remainingSeconds} segundos`);
      }

      // Verificar que la pulsera no ha sido re-escaneada durante la preparación
      if (lastScanTime !== now) {
        throw new Error('La pulsera ha sido re-escaneada');
      }

      setLoading(true);

      let transactionData = {
        wristband_id: id,
        amount: Number(pendingAction.data.amount),
        transaction_id: `${id}-${Date.now()}`, // ID único para la transacción
      };

      if (pendingAction.type === "ADD_MONEY") {
        // Verificar transacciones recientes similares
        const { data: existingTransactions } = await supabase
          .from("transactions")
          .select("id")
          .eq("wristband_id", id)
          .eq("amount", Number(pendingAction.data.amount))
          .eq("type", "DEPOSIT")
          .gte("created_at", new Date(Date.now() - 30000).toISOString()); // Últimos 30 segundos

        if (existingTransactions?.length > 0) {
          console.log('🚫 Transacción duplicada detectada:', existingTransactions);
          throw new Error('Transacción duplicada detectada');
        }

        transactionData.type = "DEPOSIT";
      } else if (pendingAction.type === "SPEND_MONEY") {
        // Verificar saldo actual
        const { data: currentWristband } = await supabase
          .from("wristbands")
          .select("balance")
          .eq("id", id)
          .single();

        if (!currentWristband || currentWristband.balance < Number(pendingAction.data.amount)) {
          throw new Error("Saldo insuficiente");
        }

        transactionData.type = "PURCHASE";
        transactionData.description = pendingAction.data.description;
      }

      console.log('📤 Enviando transacción:', transactionData);
      
      const { error: insertError } = await supabase
        .from("transactions")
        .insert(transactionData);

      if (insertError) throw insertError;

      setAmount("");
      setDescription("");
      setLastTransactionTime(Date.now());
      toast.success('Transacción completada con éxito');
      
    } catch (err) {
      console.error('❌ Error en transacción:', err);
      setError(err.message);
      toast.error(err.message);
    } finally {
      setLoading(false);
      setPendingAction(null);
      setIsProcessingTransaction(false);
    }
  };
  const verifyAndExecute = (action, actionData) => {
    setPendingAction({ type: action, data: actionData });
    setIsVerifying(true);
  };
  const handleAddMoney = () => {
    if (!amount) return;
    verifyAndExecute("ADD_MONEY", { amount });
  };

  const handleSpendMoney = () => {
    if (!amount || !description) return;
    verifyAndExecute("SPEND_MONEY", { amount, description });
  };

  if (!wristband)
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 dark:border-white" />
      </div>
    );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow">
        <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Pulsera de {wristband?.owner_name}
              </h1>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                ID: {wristband?.nfc_uid}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500 dark:text-gray-400">Saldo actual</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
              ${(wristband?.balance || 0).toFixed(2)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Transaction Forms */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Add Money Form */}
          <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                Añadir dinero
              </h3>
              <div className="mt-5">
                <div className="rounded-md shadow-sm">
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="Cantidad"
                    className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700 dark:text-white"
                  />
                </div>
                <button
                  onClick={handleAddMoney}
                  disabled={!amount || loading}
                  className="mt-4 w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                >
                  Añadir Dinero
                </button>
              </div>
            </div>
          </div>

          {/* Spend Money Form */}
          <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                Realizar compra
              </h3>
              <div className="mt-5 space-y-4">
                <div>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="Cantidad"
                    className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700 dark:text-white"
                  />
                </div>
                <div>
                  <input
                    type="text"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Descripción"
                    className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700 dark:text-white"
                  />
                </div>
                <button
                  onClick={handleSpendMoney}
                  disabled={!amount || !description || loading}
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                >
                  Realizar Compra
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Transactions List */}
        <div className="mt-8">
        <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">
            Últimas transacciones
          </h3>
          
          {/* Filters */}
          <div className="mt-2 sm:mt-0 flex space-x-2 bg-white dark:bg-gray-800 p-1 rounded-lg shadow-sm">
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
        </div>

        <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-lg">
          {filteredTransactions.length > 0 ? (
            <ul className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredTransactions.map((transaction) => (
                <li key={transaction.id} className="px-4 py-4 sm:px-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3 flex-1">
                      <div className={`flex-shrink-0 rounded-full p-2 ${
                        transaction.type === "DEPOSIT"
                          ? "bg-green-100 dark:bg-green-900"
                          : "bg-red-100 dark:bg-red-900"
                      }`}>
                        {transaction.type === "DEPOSIT" ? (
                          <Download className="h-4 w-4 sm:mr-2" />
                          
                        ) : (
                          <ShoppingCart className="h-4 w-4 sm:mr-2" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {transaction.type === "DEPOSIT" ? "Depósito" : "Compra"}
                        </p>
                        {transaction.description && (
                          <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
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
              {filter === 'all' 
                ? 'No hay transacciones disponibles'
                : filter === 'deposits'
                  ? 'No hay depósitos disponibles'
                  : 'No hay compras disponibles'
              }
            </div>
          )}
      </div>
    </div>
 

      {/* Confirmation Modal */}
      {showConfirmation && pendingAction && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity">
          <div className="fixed inset-0 z-10 overflow-y-auto">
            <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
              <div className="relative transform overflow-hidden rounded-lg bg-white dark:bg-gray-800 px-4 pt-5 pb-4 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6">
                <div>
                  <div className={`mx-auto flex h-12 w-12 items-center justify-center rounded-full ${
                    pendingAction?.type === "ADD_MONEY" 
                      ? "bg-green-100" 
                      : "bg-red-100"
                  }`}>
                    {pendingAction?.type === "ADD_MONEY" ? (
                      <CheckCircle2 className="h-6 w-6 text-green-600" />
                    ) : (
                      <AlertCircle className="h-6 w-6 text-red-600" />
                    )}
                  </div>
                  <div className="mt-3 text-center sm:mt-5">
                    <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-white">
                      Confirmar {pendingAction?.type === "ADD_MONEY" ? "Depósito" : "Compra"}
                    </h3>
                    <div className="mt-2">
                      {pendingAction?.type === "ADD_MONEY" ? (
                        <div className="space-y-2">
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            ¿Confirmas que deseas realizar un depósito de:
                          </p>
                          <p className="text-3xl font-bold text-green-600">
                            ${Number(pendingAction.data.amount).toFixed(2)}
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            en la pulsera de {wristband.owner_name}?
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            ¿Confirmas que deseas realizar un cargo de:
                          </p>
                          <p className="text-3xl font-bold text-red-600">
                            ${Number(pendingAction.data.amount).toFixed(2)}
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            Concepto: {pendingAction.data.description}
                          </p>
                          <div className="mt-4 bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                            <div className="flex justify-between text-sm">
                              <span>Saldo actual:</span>
                              <span className="font-medium">
                                ${wristband.balance.toFixed(2)}
                              </span>
                            </div>
                            <div className="flex justify-between text-sm mt-1">
                              <span>Saldo resultante:</span>
                              <span className="font-medium">
                                ${(wristband.balance - Number(pendingAction.data.amount)).toFixed(2)}
                              </span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <div className="mt-5 sm:mt-6 sm:grid sm:grid-flow-row-dense sm:grid-cols-2 sm:gap-3">
                  <button
                    type="button"
                    className={`inline-flex w-full justify-center rounded-md border border-transparent px-4 py-2 text-base font-medium text-white shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 sm:col-start-2 sm:text-sm ${
                      pendingAction?.type === "ADD_MONEY"
                        ? "bg-green-600 hover:bg-green-700 focus:ring-green-500"
                        : "bg-red-600 hover:bg-red-700 focus:ring-red-500"
                    } disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200`}
                    onClick={handleTransaction}
                    disabled={loading}
                  >
                    {loading ? (
                      <div className="flex items-center justify-center">
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Procesando...
                      </div>
                    ) : (
                      "Confirmar"
                    )}
                  </button>
                  <button
                    type="button"
                    className="mt-3 inline-flex w-full justify-center rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2 text-base font-medium text-gray-700 dark:text-gray-200 shadow-sm hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 sm:col-start-1 sm:mt-0 sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                    onClick={() => setShowConfirmation(false)}
                    disabled={loading}
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
