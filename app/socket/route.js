import { NextResponse } from 'next/server';
import { WebSocketServer } from 'ws';

// Base de datos en memoria para simular (puedes usar una real)
const pulseras = {}; // { uid: { saldo: 100, transacciones: [] } }

let wss;

export function GET() {
  if (!wss) {
    wss = new WebSocketServer({ noServer: true });

    wss.on('connection', (ws) => {
      console.log('Cliente conectado');

      ws.on('message', (message) => {
        try {
          const { action, uid, amount } = JSON.parse(message);

          switch (action) {
            case 'leer':
              ws.send(
                JSON.stringify({
                  action: 'info',
                  uid,
                  data: pulseras[uid] || { saldo: 0, transacciones: [] },
                })
              );
              break;

            case 'cargar':
              if (!pulseras[uid]) pulseras[uid] = { saldo: 0, transacciones: [] };
              pulseras[uid].saldo += amount;
              pulseras[uid].transacciones.push({ tipo: 'cargar', monto: amount });

              broadcast({
                action: 'actualizacion',
                uid,
                data: pulseras[uid],
              });
              break;

            case 'gastar':
              if (pulseras[uid] && pulseras[uid].saldo >= amount) {
                pulseras[uid].saldo -= amount;
                pulseras[uid].transacciones.push({ tipo: 'gastar', monto: amount });

                broadcast({
                  action: 'actualizacion',
                  uid,
                  data: pulseras[uid],
                });
              } else {
                ws.send(
                  JSON.stringify({
                    action: 'error',
                    message: 'Saldo insuficiente',
                  })
                );
              }
              break;

            default:
              ws.send(
                JSON.stringify({ action: 'error', message: 'Acción no válida' })
              );
          }
        } catch (error) {
          console.error('Error procesando mensaje:', error);
          ws.send(
            JSON.stringify({ action: 'error', message: 'Error procesando acción' })
          );
        }
      });

      ws.on('close', () => {
        console.log('Cliente desconectado');
      });
    });
  }

  return NextResponse.json({ message: 'WebSocket Server activo' });
}

// Broadcast a todos los clientes conectados
function broadcast(data) {
  wss.clients.forEach((client) => {
    if (client.readyState === 1) {
      client.send(JSON.stringify(data));
    }
  });
}

export const config = {
  api: {
    bodyParser: false,
  },
};
