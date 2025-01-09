'use client';

import { useEffect, useRef, useState } from 'react';

export default function HomePage() {
  const [messages, setMessages] = useState([]);
  const wsRef = useRef(null);

  // Conectar al WebSocket
  useEffect(() => {
    wsRef.current = new WebSocket('ws://localhost:3000/api/socket');
    wsRef.current.onopen = () => console.log('Conectado al servidor WebSocket');
    wsRef.current.onmessage = (event) => {
      setMessages((prev) => [...prev, JSON.parse(event.data)]);
    };
    wsRef.current.onclose = () => console.log('Conexión WebSocket cerrada');
    return () => wsRef.current.close();
  }, []);

  // Leer NFC
  const handleReadNFC = async () => {
    try {
      const ndef = new NDEFReader();
      await ndef.scan();
      console.log('Escaneo NFC iniciado. Esperando pulsera...');

      ndef.onreading = (event) => {
        const record = event.message.records[0];
        const textDecoder = new TextDecoder();
        const data = textDecoder.decode(record.data);

        console.log('Datos NFC leídos:', data);

        // Enviar al WebSocket
        wsRef.current.send(
          JSON.stringify({
            uid: data,
            action: 'cargar',
            amount: 100,
            timestamp: new Date().toISOString(),
          })
        );
      };
    } catch (error) {
      console.error('Error al leer NFC:', error);
    }
  };

  return (
    <div>
      <h1>WebSocket & NFC Demo</h1>
      <button onClick={handleReadNFC}>Leer Pulsera NFC</button>
      <h2>Mensajes recibidos:</h2>
      <ul>
        {messages.map((msg, index) => (
          <li key={index}>{JSON.stringify(msg)}</li>
        ))}
      </ul>
    </div>
  );
}
