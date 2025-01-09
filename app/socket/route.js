import { WebSocketServer } from 'ws';

let wss;

export function GET(req) {
  if (!wss) {
    console.log('Iniciando WebSocket...');
    const server = req.socket.server;

    if (!server._webSocketServer) {
      wss = new WebSocketServer({ server });
      server._webSocketServer = wss;

      wss.on('connection', (ws) => {
        console.log('Cliente conectado');

        ws.on('message', (message) => {
          console.log('Mensaje recibido:', message);

          // Responder al cliente
          ws.send(JSON.stringify({ action: 'respuesta', message: 'Hola desde el servidor!' }));
        });

        ws.on('close', () => {
          console.log('Cliente desconectado');
        });
      });
    }
  }

  return new Response('WebSocket configurado');
}
