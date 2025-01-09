'use client';

import { useEffect, useRef, useState } from 'react';

export default function NFCPage() {
  const [uid, setUid] = useState('');
  const [saldo, setSaldo] = useState(0);
  const [transacciones, setTransacciones] = useState([]);
  const wsRef = useRef(null);

  useEffect(() => {
    const wsUrl =
      process.env.NODE_ENV === 'production'
        ? `wss://${window.location.host}/api/socket`
        : 'ws://localhost:3000/api/socket';

    wsRef.current = new WebSocket(wsUrl);

    wsRef.current.onopen = () => console.log('Conexión WebSocket abierta');

    wsRef.current.onmessage = (event) => {
      const data = JSON.parse(event.data);

      if (data.action === 'respuesta') {
        console.log('Respuesta del servidor:', data.message);
      }

      if (data.action === 'info' || data.action === 'actualizacion') {
        setUid(data.uid);
        setSaldo(data.data.saldo);
        setTransacciones(data.data.transacciones);
      }

      if (data.action === 'error') alert(data.message);
    };

    wsRef.current.onclose = () => console.log('Conexión WebSocket cerrada');

    return () => wsRef.current.close();
  }, []);

  return (
    <div>
      <h1>Gestión de Pulseras NFC</h1>
      <button onClick={() => wsRef.current.send(JSON.stringify({ action: 'leer' }))}>
        Leer Pulsera NFC
      </button>
      <button onClick={() => wsRef.current.send(JSON.stringify({ action: 'cargar', monto: 50 }))}>
        Cargar 50€
      </button>
      <button onClick={() => wsRef.current.send(JSON.stringify({ action: 'gastar', monto: 20 }))}>
        Gastar 20€
      </button>
      <h2>UID: {uid}</h2>
      <h2>Saldo: {saldo}€</h2>
      <h3>Transacciones:</h3>
      <ul>
        {transacciones.map((tx, index) => (
          <li key={index}>
            {tx.tipo}: {tx.monto}€
          </li>
        ))}
      </ul>
    </div>
  );
}
