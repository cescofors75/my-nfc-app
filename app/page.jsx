'use client';

import { useEffect, useRef, useState } from 'react';

export default function HomePage() {
  const [uid, setUid] = useState('');
  const [saldo, setSaldo] = useState(0);
  const [transacciones, setTransacciones] = useState([]);
  const wsRef = useRef(null);

  useEffect(() => {
    wsRef.current = new WebSocket('ws://localhost:3001/api/socket');
    wsRef.current.onmessage = (event) => {
      const data = JSON.parse(event.data);

      if (data.action === 'info' || data.action === 'actualizacion') {
        setUid(data.uid);
        setSaldo(data.data.saldo);
        setTransacciones(data.data.transacciones);
      }

      if (data.action === 'error') alert(data.message);
    };

    return () => wsRef.current.close();
  }, []);

  const handleReadNFC = async () => {
    try {
      const ndef = new NDEFReader();
      await ndef.scan();

      ndef.onreading = (event) => {
        const record = event.message.records[0];
        const textDecoder = new TextDecoder();
        const data = textDecoder.decode(record.data);

        wsRef.current.send(JSON.stringify({ action: 'leer', uid: data }));
      };
    } catch (error) {
      console.error('Error al leer NFC:', error);
    }
  };

  const handleCargar = (amount) => {
    if (uid) {
      wsRef.current.send(JSON.stringify({ action: 'cargar', uid, amount }));
    } else {
      alert('Por favor, escanee una pulsera primero.');
    }
  };

  const handleGastar = (amount) => {
    if (uid) {
      wsRef.current.send(JSON.stringify({ action: 'gastar', uid, amount }));
    } else {
      alert('Por favor, escanee una pulsera primero.');
    }
  };

  return (
    <div className="container">
      <header>
        <h1>Gestión de Pulseras NFC</h1>
      </header>

      <main>
        <section className="actions">
          <button className="btn primary" onClick={handleReadNFC}>
            Leer Pulsera NFC
          </button>
          <button className="btn success" onClick={() => handleCargar(50)}>
            Cargar 50€
          </button>
          <button className="btn danger" onClick={() => handleGastar(20)}>
            Gastar 20€
          </button>
        </section>

        <section className="info">
          <div className="card">
            <h2>Información de la Pulsera</h2>
            <p>
              <strong>UID:</strong> {uid || 'No detectado'}
            </p>
            <p>
              <strong>Saldo:</strong> {saldo.toFixed(2)}€
            </p>
          </div>
        </section>

        <section className="transactions">
          <h3>Transacciones</h3>
          <ul>
            {transacciones.length > 0 ? (
              transacciones.map((tx, index) => (
                <li key={index} className={`tx ${tx.tipo}`}>
                  {tx.tipo.toUpperCase()}: {tx.monto.toFixed(2)}€
                </li>
              ))
            ) : (
              <li>No hay transacciones</li>
            )}
          </ul>
        </section>
      </main>

      <style jsx>{`
        .container {
          max-width: 800px;
          margin: 0 auto;
          padding: 20px;
          font-family: Arial, sans-serif;
          color: #333;
        }

        header {
          text-align: center;
          margin-bottom: 20px;
        }

        h1 {
          font-size: 2rem;
          color: #0070f3;
        }

        .actions {
          display: flex;
          justify-content: space-around;
          margin-bottom: 20px;
        }

        .btn {
          padding: 10px 20px;
          font-size: 1rem;
          border-radius: 5px;
          border: none;
          cursor: pointer;
          transition: background 0.3s ease;
        }

        .btn.primary {
          background: #0070f3;
          color: white;
        }

        .btn.primary:hover {
          background: #005bb5;
        }

        .btn.success {
          background: #28a745;
          color: white;
        }

        .btn.success:hover {
          background: #218838;
        }

        .btn.danger {
          background: #dc3545;
          color: white;
        }

        .btn.danger:hover {
          background: #c82333;
        }

        .info {
          margin-bottom: 20px;
        }

        .card {
          background: #f9f9f9;
          padding: 20px;
          border-radius: 10px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }

        .card h2 {
          margin-top: 0;
        }

        .transactions {
          margin-top: 20px;
        }

        .transactions ul {
          list-style: none;
          padding: 0;
        }

        .transactions li {
          background: #f1f1f1;
          padding: 10px;
          margin-bottom: 5px;
          border-radius: 5px;
        }

        .transactions .tx.cargar {
          background: #d4edda;
        }

        .transactions .tx.gastar {
          background: #f8d7da;
        }
      `}</style>
    </div>
  );
}
