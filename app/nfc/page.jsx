
'use client';

export default function NFCPage() {
  const readNFC = async () => {
    try {
      if ('NDEFReader' in window) {
        const ndef = new NDEFReader();
        console.log('Iniciando escaneo NFC...');
        await ndef.scan();

        ndef.onreading = (event) => {
          const data = event.message.records.map((record) => {
            // Verifica si el dato es un ArrayBuffer antes de intentar decodificarlo
            if (record.data instanceof ArrayBuffer) {
              const decoder = new TextDecoder();
              return decoder.decode(record.data);
            } else {
              console.error('El registro no contiene un ArrayBuffer');
              return null; // O alguna acción apropiada
            }
          }).filter((item) => item !== null); // Elimina valores null

          console.log('Datos leídos:', data);
          alert('Datos NFC: ' + JSON.stringify(data));
        };

        ndef.onreadingerror = () => {
          console.error('Error leyendo NFC.');
          alert('Error leyendo NFC.');
        };
      } else {
        alert('El navegador no soporta Web NFC.');
        console.error('El navegador no soporta Web NFC.');
      }
    } catch (error) {
      console.error('Error al iniciar NDEFReader:', error.message);
      alert('Error al iniciar NDEFReader: ' + error.message);
    }
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial' }}>
      <h1>Lector NFC</h1>
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
  );
}

  