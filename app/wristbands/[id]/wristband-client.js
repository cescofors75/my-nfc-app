/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable react-hooks/exhaustive-deps */
"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import NFCVerificationModal from "@/components/NFCVerificationModal";
import { toast } from "sonner";

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
  

  const [isProcessingTransaction, setIsProcessingTransaction] = useState(false);
  const [lastScanTime, setLastScanTime] = useState(Date.now());
  
  console.log('🔄 Montando componente para wristband:', id, 'tiempo:', Date.now());

  console.log('Estado inicial:', { initialData, id });
/*
  async function loadWristband() {
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
    }
  }

  async function loadTransactions() {
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
        .order("created_at", { ascending: true });

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
    }
  }*/

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
    <>
       <div>
      {isProcessingTransaction && (
        <div className="fixed top-0 left-0 right-0 bg-yellow-400 text-black p-2 text-center">
          Procesando transacción... Por favor, no escanee nuevamente la pulsera.
        </div>
      )}
      <div className="max-w-4xl mx-auto p-6">
        {/* Información de la pulsera */}
        <div className="dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
          <h1 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
            Pulsera de {wristband.owner_name}
          </h1>
          <div className="flex items-center justify-between">
            <span className="text-gray-600 dark:text-gray-400">ID NFC:</span>
            <span className="font-mono text-gray-900 dark:text-white">
              {wristband.nfc_uid}
            </span>
          </div>
          <div className="flex items-center justify-between mt-2">
            <span className="text-gray-600 dark:text-gray-400">
              Saldo actual:
            </span>
            <span className="text-2xl font-bold text-green-600 dark:text-green-400">
              {wristband.balance.toFixed(2)}€
            </span>
          </div>
        </div>

        {/* Acciones */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Añadir dinero */}
          <div className="dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
              Añadir Dinero
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Cantidad (€)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>
              <button
                onClick={handleAddMoney}
                disabled={loading}
                className="w-full bg-green-500 text-white py-2 px-4 rounded hover:bg-green-600 disabled:opacity-50 transition-colors"
              >
                {loading ? "Procesando..." : "Añadir Saldo"}
              </button>
            </div>
          </div>

          {/* Realizar gasto */}
          <div className="dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
              Realizar Gasto
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Cantidad (€)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Descripción
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  placeholder="Ej: Consumición en bar"
                />
              </div>
              <button
                onClick={handleSpendMoney}
                disabled={loading}
                className="w-full bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 disabled:opacity-50 transition-colors"
              >
                {loading ? "Procesando..." : "Realizar Gasto"}
              </button>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/50 text-red-500 dark:text-red-200 p-4 rounded mb-6">
            {error}
          </div>
        )}

        {/* Lista de Transacciones */}
        <div className="dark:bg-gray-800 rounded-lg shadow">
          <div className="p-6">
            <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
              Historial de Transacciones
            </h2>

            {/* Vista de escritorio */}
            <div className="hidden md:block overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead>
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Fecha/Hora
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Tipo
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Cantidad
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Saldo
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Descripción
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {transactions.map((transaction) => (
                    <tr
                      key={transaction.id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {new Date(transaction.created_at).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            transaction.type === "DEPOSIT"
                              ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100"
                              : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100"
                          }`}
                        >
                          {transaction.type === "DEPOSIT" ? "Ingreso" : "Gasto"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span
                          className={
                            transaction.type === "DEPOSIT"
                              ? "text-green-600 dark:text-green-400"
                              : "text-red-600 dark:text-red-400"
                          }
                        >
                          {transaction.type === "DEPOSIT" ? "+" : "-"}
                          {transaction.amount.toFixed(2)}€
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                        {typeof transaction.balanceAtMoment === "number"
                          ? `${transaction.balanceAtMoment.toFixed(2)}€`
                          : "-"}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                        {transaction.description || "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Vista móvil */}
            <div className="md:hidden space-y-4">
              {transactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 space-y-2"
                >
                  <div className="flex justify-between items-start">
                    <span
                      className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        transaction.type === "DEPOSIT"
                          ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100"
                          : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100"
                      }`}
                    >
                      {transaction.type === "DEPOSIT" ? "Ingreso" : "Gasto"}
                    </span>
                    <span
                      className={`text-lg font-bold ${
                        transaction.type === "DEPOSIT"
                          ? "text-green-600 dark:text-green-400"
                          : "text-red-600 dark:text-red-400"
                      }`}
                    >
                      {transaction.type === "DEPOSIT" ? "+" : "-"}
                      {transaction.amount.toFixed(2)}€
                    </span>
                  </div>

                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-500 dark:text-gray-400">
                      {new Date(transaction.created_at).toLocaleString()}
                    </span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      Saldo:{" "}
                      {typeof transaction.balanceAtMoment === "number"
                        ? `${transaction.balanceAtMoment.toFixed(2)}€`
                        : "-"}
                    </span>
                  </div>

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
      </div>

      <NFCVerificationModal
        isOpen={isVerifying}
        onClose={() => {
          setIsVerifying(false);
          setPendingAction(null);
        }}
        onVerify={handleVerificationSuccess}
        expectedNfcUid={wristband.nfc_uid}
        action={
          pendingAction?.type === "ADD_MONEY"
            ? "añadir saldo"
            : "realizar el gasto"
        }
      />
    </div>
    </>
  );
}
