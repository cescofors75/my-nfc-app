import React, { useState } from 'react';

export default function NFCReader() {
  const [message, setMessage] = useState('');

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
        const { serialNumber, message: ndefMessage } = event;
        
        let outputMessage = `Serie: ${serialNumber}\n`;
        outputMessage += '------------------------\n';

        if (ndefMessage.records.length === 0) {
          outputMessage += 'Tarjeta sin registros NDEF';
        } else {
          ndefMessage.records.forEach((record, index) => {
            outputMessage += `Registro ${index + 1}:\n`;
            outputMessage += `Tipo: ${record.recordType}\n`;
            
            if (record.recordType === 'empty') {
              outputMessage += 'Estado: Tarjeta formateada sin datos\n';
            } else if (record.data === null) {
              outputMessage += 'Datos: Vacío\n';
            } else {
              try {
                const decoder = new TextDecoder(record.encoding || 'utf-8');
                const data = record.data instanceof ArrayBuffer ? 
                  decoder.decode(record.data) : 
                  record.data;
                outputMessage += `Datos: ${data}\n`;
              } catch (error) {
                outputMessage += `Error al leer datos: ${error.message}\n`;
              }
            }
            
            if (record.mediaType) outputMessage += `Tipo de medio: ${record.mediaType}\n`;
            if (record.lang) outputMessage += `Idioma: ${record.lang}\n`;
            outputMessage += '------------------------\n';
          });
        }

        setMessage(outputMessage);
      };

      ndef.onreadingerror = (error) => {
        setMessage('Error al leer la tarjeta NFC: ' + error);
      };

    } catch (error) {
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
          margin: '20px 0',
          backgroundColor: '#007bff',
          color: 'white',
          border: 'none',
          borderRadius: '5px',
          cursor: 'pointer'
        }}
      >
        Iniciar Lectura NFC
      </button>
      <pre style={{ 
        whiteSpace: 'pre-wrap', 
        wordBreak: 'break-all',
        backgroundColor: '#f5f5f5',
        padding: '15px',
        borderRadius: '5px',
        marginTop: '20px'
      }}>
        {message}
      </pre>
    </div>
  );
}