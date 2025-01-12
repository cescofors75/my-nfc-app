/* eslint-disable @typescript-eslint/no-unused-vars */

"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabaseClient";
import SimpleVerificationModal from "@/components/SimpleVerificationModal";
import { Wallet, Download, ShoppingCart, Clock } from "lucide-react";
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export function WristbandClient({ initialData, id }) {
  const [wristband, setWristband] = useState(initialData.wristband);
  const [transactions, setTransactions] = useState(initialData.transactions);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [addAmount, setAddAmount] = useState("");
  const [spendAmount, setSpendAmount] = useState("");
  const [description, setDescription] = useState("");
  const [pendingAction, setPendingAction] = useState(null);
  const [filter, setFilter] = useState('all');

  const defaultInitialData = {
    wristband: {
      owner_name: '',
      nfc_uid: '',
      balance: 0,
    },
    transactions: []
  };

  const safeInitialData = initialData || defaultInitialData;

  const loadWristband = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('wristbands')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      setWristband(data);
    } catch (err) {
      setError(err.message);
    }
  }, [id]);

  const loadTransactions = useCallback(async () => {
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
        .order("created_at", { ascending: false });

      if (error) throw error;

      if (!data) return;

      let saldoAcumulado = 0;
      const transactionsWithBalance = data.reverse().map((transaction) => {
        if (transaction.type === "DEPOSIT") {
          saldoAcumulado += Number(transaction.amount);
        } else if (transaction.type === "PURCHASE") {
          saldoAcumulado -= Number(transaction.amount);
        }

        return {
          ...transaction,
          balanceAtMoment: saldoAcumulado,
        };
      });

      setTransactions(transactionsWithBalance.reverse());
    } catch (err) {
      console.error('Error en loadTransactions:', err);
      setError(err.message);
    }
  }, [id]);

  useEffect(() => {
    loadWristband();
    loadTransactions();
  }, [loadWristband, loadTransactions]);

  useEffect(() => {
    const channel = supabase
      .channel('realtime-wristband')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'transactions',
          filter: `wristband_id=eq.${id}`,
        },
        (payload) => {
          console.log('Cambio en tiempo real detectado:', payload);
          loadWristband();
          loadTransactions();
        }
      )
      .subscribe((status) => {
        console.log('Status de suscripción:', status);
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [id, loadWristband, loadTransactions]);

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

  const verifyAndExecute = (action, actionData) => {
    setPendingAction({ type: action, data: actionData });
    setIsVerifying(true);
  };

  const handleVerificationSuccess = async () => {
    setIsVerifying(false);
    setLoading(true);
    setError(null);

    try {
      if (pendingAction.type === 'ADD_MONEY') {
        const { error } = await supabase
          .from('transactions')
          .insert({
            wristband_id: id,
            type: 'DEPOSIT',
            amount: Number(pendingAction.data.amount)
          });

        if (error) throw error;
        setAddAmount('');
      } else if (pendingAction.type === 'SPEND_MONEY') {
        if (wristband.balance < Number(pendingAction.data.amount)) {
          throw new Error('Saldo insuficiente');
        }

        const { error } = await supabase
          .from('transactions')
          .insert({
            wristband_id: id,
            type: 'PURCHASE',
            amount: Number(pendingAction.data.amount),
            description: pendingAction.data.description
          });

        if (error) throw error;
        setSpendAmount('');
        setDescription('');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
      setPendingAction(null);
    }
  };

  const handleAddMoney = () => {
    if (!addAmount) return;
    verifyAndExecute("ADD_MONEY", { amount: addAmount });
  };

  const handleSpendMoney = () => {
    if (!spendAmount || !description) return;
    verifyAndExecute("SPEND_MONEY", { amount: spendAmount, description });
  };

  if (!wristband)
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 dark:border-white" />
      </div>
    );

  return  (
  
  <>
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
          {(wristband?.balance || 0).toFixed(2)} €
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
                Depósito - Añadir dinero
              </h3>
              <div className="mt-5">
                <div className="rounded-md shadow-sm">
                  <input
                    type="number"
                    value={addAmount}
                    onChange={(e) => setAddAmount(e.target.value)}
                    placeholder="Cantidad"
                    className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700 dark:text-white"
                  />
                </div>
                <button
                  onClick={handleAddMoney}
                  disabled={!addAmount || loading}
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
                    value={spendAmount}
                    onChange={(e) => setSpendAmount(e.target.value)}
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
                  disabled={!spendAmount || !description || loading}
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
</div>

  <SimpleVerificationModal
        isOpen={isVerifying}
        onClose={() => {
          setIsVerifying(false)
          setPendingAction(null)
        }}
        onConfirm={handleVerificationSuccess}
        
        action={pendingAction} 
        wristband={wristband}
        amount={pendingAction?.data.amount}
        description={pendingAction?.data.description}
        loading={loading}
      />

      </>
);
}


 
/*
  useEffect(() => {
    console.log('🔄 Iniciando efecto principal');
    let mounted = true;

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

    console.log('📡 Canal suscrito:', `wristband-${id}`);

    // Cargar datos iniciales
    loadWristband();
    loadTransactions();

    return () => {
      console.log('🔚 Limpiando efecto');
      mounted = false;
      supabase.removeChannel(channel);
    };
  }, [id]);*/
 /*const handleVerificationSuccess = async () => {
    console.log('🔐 Iniciando verificación:', pendingAction);
    setIsVerifying(false);
    setError(null);

    const now = Date.now();
    const COOLDOWN_PERIOD = 10000;

    if (lastTransactionTime && now - lastTransactionTime < COOLDOWN_PERIOD) {
      const remainingSeconds = Math.ceil(
        (COOLDOWN_PERIOD - (now - lastTransactionTime)) / 1000
      );
      console.log('⏳ Cooldown activo:', remainingSeconds);
      toast.error(
        `Por seguridad, espera ${remainingSeconds} segundos para realizar otra transacción`
      );
      setPendingAction(null);
      return;
    }

    setLoading(true);

    try {
      let transactionData = {
        wristband_id: id,
        amount: Number(pendingAction.data.amount),
      };

      console.log('📝 Preparando transacción:', transactionData);

      if (pendingAction.type === "ADD_MONEY") {
        console.log('💰 Verificando depósito duplicado');
        const { data: existingTransactions } = await supabase
          .from("transactions")
          .select("id")
          .eq("wristband_id", id)
          .eq("amount", Number(pendingAction.data.amount))
          .eq("type", "DEPOSIT")
          .gte("created_at", new Date(Date.now() - 60000).toISOString());

        if (existingTransactions?.length > 0) {
          console.log('⚠️ Depósito duplicado detectado:', existingTransactions);
          return;
        }

        transactionData.type = "DEPOSIT";
      } else if (pendingAction.type === "SPEND_MONEY") {
        console.log('🛍️ Verificando saldo para compra');
        const { data: currentWristband } = await supabase
          .from("wristbands")
          .select("balance")
          .eq("id", id)
          .single();

        console.log('💳 Saldo actual:', currentWristband?.balance);

        if (!currentWristband || currentWristband.balance < Number(pendingAction.data.amount)) {
          throw new Error("Saldo insuficiente");
        }

        transactionData.type = "PURCHASE";
        transactionData.description = pendingAction.data.description;
      }

      console.log('📤 Enviando transacción:', transactionData);
      const { data: insertedData, error: insertError } = await supabase
        .from("transactions")
        .insert(transactionData)
        .select();

      if (insertError) throw insertError;

      console.log('✅ Transacción completada:', insertedData);

      setAmount("");
      setDescription("");
      setLastTransactionTime(Date.now());
    } catch (err) {
      console.error('❌ Error en transacción:', err);
      setError(err.message);
      toast.error(err.message);
    } finally {
      setLoading(false);
      setPendingAction(null);
    }
  };*/
