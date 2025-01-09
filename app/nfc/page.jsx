'use client'
import React, { useState, useEffect } from 'react';

// Componentes de iconos inline para no depender de librerías externas
const Icons = {
  Wifi: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12.55a11 11 0 0 1 14.08 0" />
      <path d="M1.42 9a16 16 0 0 1 21.16 0" />
      <path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
      <line x1="12" y1="20" x2="12" y2="20" />
    </svg>
  ),
  Loader: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="animate-spin">
      <line x1="12" y1="2" x2="12" y2="6" />
      <line x1="12" y1="18" x2="12" y2="22" />
      <line x1="4.93" y1="4.93" x2="7.76" y2="7.76" />
      <line x1="16.24" y1="16.24" x2="19.07" y2="19.07" />
      <line x1="2" y1="12" x2="6" y2="12" />
      <line x1="18" y1="12" x2="22" y2="12" />
      <line x1="4.93" y1="19.07" x2="7.76" y2="16.24" />
      <line x1="16.24" y1="7.76" x2="19.07" y2="4.93" />
    </svg>
  ),
  Check: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  ),
  Alert: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  )
};

export default function NFCReader() {
  const [status, setStatus] = useState('idle'); // idle, scanning, success, error
  const [nfcData, setNfcData] = useState(null);
  const [error, setError] = useState(null);
  const [scanTime, setScanTime] = useState(null); // Tiempo de escaneo en milisegundos
  const [isScanning, setIsScanning] = useState(false); // Para controlar el escaneo
  const [expandedRecord, setExpandedRecord] = useState(null); // Controlar el acordeón de detalles del payload

  const formatUID = (uid) => {
    return uid.toUpperCase().split(':').join(' : ');
  };

  const readNFC = async () => {
    if (isScanning) return; // Si ya está escaneando, no hacer nada más.
    
    setIsScanning(true); // Activar el escaneo
    setStatus('scanning');
    setError(null);
    setNfcData(null);

    try {
      if (!('NDEFReader' in window)) {
        setError('NFC no soportado en este dispositivo');
        setStatus('error');
        setIsScanning(false);
        return;
      }

      const startTime = Date.now();

      const ndef = new NDEFReader();
      await ndef.scan();

      ndef.onreading = (event) => {
        const endTime = Date.now();
        setScanTime(endTime - startTime); // Tiempo de escaneo en milisegundos

        const { serialNumber, message: ndefMessage } = event;
        
        const nfcInfo = {
          uid: formatUID(serialNumber),
          timestamp: new Date().toLocaleTimeString(),
          records: ndefMessage.records.map((record, index) => ({
            id: index + 1,
            type: record.recordType,
            status: record.recordType === 'empty' ? 'Formateada' : 'Con datos',
            mediaType: record.mediaType || 'N/A',
            lang: record.lang || 'N/A',
            data: record.data ? new TextDecoder().decode(record.data) : 'N/A' // Mostrar payload si existe
          }))
        };

        setNfcData(nfcInfo);
        setStatus('success');
        setIsScanning(false); // Detener el escaneo después de leer
      };

      ndef.onreadingerror = () => {
        setError('Error al leer la tarjeta');
        setStatus('error');
        setIsScanning(false); // Detener el escaneo en caso de error
      };

    } catch (error) {
      setError(error.message);
      setStatus('error');
      setIsScanning(false); // Detener el escaneo en caso de error
    }
  };

  useEffect(() => {
    if (status === 'success' || status === 'error') {
      const timer = setTimeout(() => {
        setStatus('idle'); // Reiniciar el estado después de unos segundos
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [status]);

  const toggleRecordDetails = (recordId) => {
    setExpandedRecord((prev) => (prev === recordId ? null : recordId));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-8 font-sans">
      <div className="max-w-2xl mx-auto bg-white/80 backdrop-blur rounded-xl shadow-lg">
        <div className="p-6">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">
              VisitTech WaterWorld
            </h1>
            <h2 className="text-3xl font-bold text-gray-800 mb-2">
              Lector NFC Profesional
            </h2>
            <p className="text-gray-600">
              Sistema de lectura de alta precisión
            </p>
          </div>

          {/* Status Display */}
          <div className="flex justify-center mb-8">
            {status === 'idle' && (
              <button
                onClick={readNFC}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg
                          hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                <Icons.Wifi />
                Iniciar Lectura
              </button>
            )}
            
            {status === 'scanning' && (
              <div className="flex flex-col items-center text-blue-600">
                <div className="mb-2">
                  <Icons.Loader />
                </div>
                <p className="text-lg font-medium">Escaneando...</p>
                <p className="text-sm text-gray-600">
                  Acerque la tarjeta al lector
                </p>
              </div>
            )}
          </div>

          {/* Success State */}
          {status === 'success' && nfcData && (
            <div className="space-y-6">
              <div className="flex items-center justify-center text-green-600 mb-4">
                <Icons.Check />
              </div>
              
              <div className="bg-gray-50 rounded-xl p-6 space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">UID</span>
                  <span className="font-mono text-lg font-bold text-blue-600">
                    {nfcData.uid}
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Tiempo de Escaneo</span>
                  <span className="font-medium">{scanTime} ms</span>
                </div>

                <div className="border-t pt-4">
                  <h3 className="text-lg font-semibold mb-3">
                    Información de Registros
                  </h3>
                  {nfcData.records.map((record) => (
                    <div key={record.id} 
                         className="bg-white p-4 rounded-lg shadow-sm mb-2">
                      <div className="grid grid-cols-2 gap-2">
                        <span className="text-gray-600">Tipo</span>
                        <span className="font-medium">{record.type}</span>
                        <span className="text-gray-600">Estado</span>
                        <span className="font-medium">{record.status}</span>
                        <span className="text-gray-600">MediaType</span>
                        <span className="font-medium">{record.mediaType}</span>
                        <span className="text-gray-600">Lenguaje</span>
                        <span className="font-medium">{record.lang}</span>
                        <span className="text-gray-600">Payload</span>
                        <button
                          onClick={() => toggleRecordDetails(record.id)}
                          className="text-blue-600 text-sm mt-2"
                        >
                          {expandedRecord === record.id ? 'Ocultar Detalles' : 'Ver Detalles'}
                        </button>
                        {expandedRecord === record.id && (
                          <pre className="mt-2 text-sm text-gray-600">{record.data}</pre>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Error State */}
          {status === 'error' && (
            <div className="bg-red-100 p-6 rounded-lg space-y-4">
              <div className="text-center text-red-600">
                <Icons.Alert />
              </div>
              <p className="text-red-600 font-medium text-lg">{error}</p>
              <button
                onClick={readNFC}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg
                          hover:bg-blue-700 transition-colors w-full"
              >
                Reintentar
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
