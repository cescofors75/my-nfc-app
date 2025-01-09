
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
            // Verificar el tipo de los datos
            if (record.data instanceof ArrayBuffer) {
              // Si el dato es un ArrayBuffer, lo decodificamos
              const decoder = new TextDecoder();
              return decoder.decode(record.data);
            } else if (record.data instanceof Uint8Array) {
              // Si el dato es un Uint8Array, lo convertimos a un ArrayBuffer
              const decoder = new TextDecoder();
              return decoder.decode(record.data.buffer);
            } else if (record.data instanceof DOMString) {
              // Si el dato es una cadena de texto, lo devolvemos tal cual
              return record.data;
            } else {
              console.error('Tipo de dato no manejado:', record.data);
              return null; // Si el dato no es de un tipo conocido, lo ignoramos
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


  