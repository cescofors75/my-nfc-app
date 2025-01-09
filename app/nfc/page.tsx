/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState } from 'react';

export default function NFCPage() {
  const [nfcData, setNfcData] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const readNFC = async () => {
    try {
      setError(null); // Limpia errores previos
      setNfcData([]); // Limpia datos previos

      if ('NDEFReader' in window) {
        const ndef = new (window as any).NDEFReader();
        console.log('Escaneando NFC...');
        await ndef.scan();
        

        ndef.onreading = (event: any) => {
          const decoder = new TextDecoder();
          const data = event.message.records.map((record: any) =>
            decoder.decode(record.data)
          );
          setNfcData(data);
          console.log('Datos leídos:', data);
        };

        ndef.onreadingerror = () => {
          setError('Error leyendo NFC. Intenta nuevamente.');
        };
      } else {
        setError('Tu navegador no soporta NFC.');
      }
    } catch (err: any) {
      setError('No se pudo iniciar la lectura NFC: ' + err.message);
    }
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial' }}>
      <h1 style={{ textAlign: 'center' }}>Lector NFC</h1>
      <p style={{ textAlign: 'center' }}>
        Haz clic en el botón para iniciar la lectura de un chip NFC.
      </p>
      <div style={{ textAlign: 'center', marginTop: '20px' }}>
        <button
          onClick={readNFC}
          style={{
            padding: '10px 20px',
            backgroundColor: '#0070f3',
            color: '#fff',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
          }}
        >
          Leer NFC
        </button>
      </div>
      {nfcData.length > 0 && (
        <div style={{ marginTop: '20px', textAlign: 'center' }}>
          <h3>Datos leídos:</h3>
          <pre style={{ background: '#f4f4f4', padding: '10px', borderRadius: '5px' }}>
            {JSON.stringify(nfcData, null, 2)}
          </pre>
        </div>
      )}
      {error && (
        <p style={{ color: 'red', textAlign: 'center', marginTop: '20px' }}>{error}</p>
      )}
    </div>
  );
}
