'use client'
import React, { useState } from 'react';

export default function NFCReader() {
  const [message, setMessage] = useState('');
  const [debug, setDebug] = useState('');

  const readNFC = async () => {
    try {
      if (!('NDEFReader' in window)) {
        setMessage('NFC no está soportado en este dispositivo');
        return;
      }

      const ndef = new NDEFReader();
      setMessage('Acerca tu tarjeta o pulsera NFC...');
      
      await ndef.scan();

      ndef.onreading = (event) => {
        // Logging completo del evento para debug
        console.log('Evento NFC completo:', event);
        console.log('Registros:', event.message.records);

        const records = event.message.records;
        let nfcData = [];

        records.forEach((record, index) => {
          // Logging detallado de cada registro
          console.log(`Registro ${index}:`, {
            recordType: record.recordType,
            mediaType: record.mediaType,
            id: record.id,
            encoding: record.encoding,
            lang: record.lang
          });

          try {
            if (record.data === null) {
              console.log(`Registro ${index}: datos nulos`);
              nfcData.push({
                type: record.recordType,
                value: 'null'
              });
              return;
            }

            let value = '';
            const decoder = new TextDecoder(record.encoding || 'utf-8');

            if (record.data instanceof ArrayBuffer) {
              value = decoder.decode(record.data);
            } else if (record.data instanceof Uint8Array) {
              value = decoder.decode(record.data.buffer);
            } else if (typeof record.data === 'string') {
              value = record.data;
            } else {
              value = `Tipo de dato no reconocido: ${typeof record.data}`;
            }

            nfcData.push({
              type: record.recordType,
              value: value
            });

            // Debug info
            setDebug(prev => prev + `\nRegistro ${index}:\n` +
              `Tipo: ${record.recordType}\n` +
              `Valor: ${value}\n` +
              `Encoding: ${record.encoding}\n` +
              `Lang: ${record.lang}\n` +
              '-------------------');

          } catch (error) {
            console.error(`Error procesando registro ${index}:`, error);
            nfcData.push({
              type: record.recordType,
              value: `Error: ${error.message}`
            });
          }
        });

        setMessage('Datos leídos: ' + JSON.stringify(nfcData, null, 2));
      };

      ndef.onreadingerror = (error) => {
        console.error('Error de lectura:', error);
        setMessage('Error al leer la tarjeta NFC');
      };

    } catch (error) {
      console.error('Error de inicialización:', error);
      setMessage('Error: ' + error.message);
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <h1>Lector NFC</h1>
      <button 
        onClick={readNFC}
        style={{
          padding: '10px 20px',
          fontSize: '16px',
          margin: '20px 0'
        }}
      >
        Iniciar Lectura NFC
      </button>
      <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
        {message}
      </pre>
      <details>
        <summary>Información de Debug</summary>
        <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
          {debug}
        </pre>
      </details>
    </div>
  );
}