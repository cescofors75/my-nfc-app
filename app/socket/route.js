import { NextResponse } from 'next/server';
import { WebSocketServer } from 'ws';

// Singleton para el WebSocket Server
let wss;

export function GET() {
  if (!wss) {
    wss = new WebSocketServer({ noServer: true });

    // Manejar nuevas conexiones
    wss.on('connection', (ws) => {
      console.log('Cliente conectado');

      // Manejar mensajes del cliente
      ws.on('message', (message) => {
        console.log('Mensaje recibido:', message);

        // Difundir a todos los clientes conectados
        wss.clients.forEach((client) => {
          if (client.readyState === 1) { // WebSocket.OPEN
            client.send(message);
          }
        });
      });

      // Manejar desconexión
      ws.on('close', () => {
        console.log('Cliente desconectado');
      });
    });
  }

  return NextResponse.json({ message: 'WebSocket Server activo' });
}

// Actualiza el servidor HTTP para manejar WebSocket
export const config = {
  api: {
    bodyParser: false, // Desactiva el parseo automático de cuerpo
  },
};
