import { Server, Socket } from "socket.io";
import { io } from "../app";
import { usuario_rol } from "@prisma/client";

interface SocketData {
  userId?: string;
  userRole?: usuario_rol;
  mesaId?: string;
  sesionId?: string;
}

// Mapa de conexiones activas
const connectedClients = new Map<string, Socket & { data: SocketData }>();
const connectedAdmins = new Map<string, Socket & { data: SocketData }>();

// Inicializar Socket.IO
export function initializeSocket() {
  io.on("connection", (socket: Socket & { data: SocketData }) => {
    console.log(`Cliente conectado: ${socket.id}`);

    // Autenticación inicial
    socket.on("authenticate", (data: { 
      userId: string, 
      userRole: 'cliente' | 'admin' | 'encargado' | 'cocina',
      mesaId?: string,
      sesionId?: string 
    }) => {
      socket.data = data;

      if (data.userRole === 'cliente') {
        connectedClients.set(socket.id, socket);
        
        // Unirse a room de la mesa
        if (data.mesaId) {
          socket.join(`mesa-${data.mesaId}`);
          console.log(`Cliente ${data.userId} unido a mesa-${data.mesaId}`);
        }

        // Notificar a admins que hay una nueva conexión
        io.to('admin-room').emit('cliente:conectado', {
          socketId: socket.id,
          userId: data.userId,
          mesaId: data.mesaId,
          sesionId: data.sesionId,
          timestamp: new Date()
        });

      } else if (['admin', 'encargado', 'cocina'].includes(data.userRole)) {
        connectedAdmins.set(socket.id, socket);
        socket.join('admin-room');
        console.log(`Admin ${data.userId} conectado`);

        // Enviar lista de clientes conectados
        const clientesConectados = Array.from(connectedClients.values()).map(s => ({
          socketId: s.id,
          userId: s.data.userId,
          mesaId: s.data.mesaId,
          sesionId: s.data.sesionId
        }));
        
        socket.emit('admin:clientes-conectados', clientesConectados);
      }

      // Confirmar autenticación
      socket.emit('authenticated', { 
        success: true, 
        role: data.userRole 
      });
    });

    // Desconexión
    socket.on("disconnect", () => {
      console.log(`Cliente desconectado: ${socket.id}`);

      // Si era un cliente
      if (connectedClients.has(socket.id)) {
        const clientSocket = connectedClients.get(socket.id)!;
        
        // Notificar a admins
        io.to('admin-room').emit('cliente:desconectado', {
          socketId: socket.id,
          userId: clientSocket.data.userId,
          mesaId: clientSocket.data.mesaId,
          timestamp: new Date()
        });

        connectedClients.delete(socket.id);
      }

      // Si era un admin
      if (connectedAdmins.has(socket.id)) {
        connectedAdmins.delete(socket.id);
      }
    });

    // Ping-pong para mantener conexión
    socket.on("ping", () => {
      socket.emit("pong");
    });
  });
}

// Funciones helper para emitir eventos
export function emitToMesa(mesaId: string, event: string, data: any) {
  io.to(`mesa-${mesaId}`).emit(event, data);
}

export function emitToAdmins(event: string, data: any) {
  io.to('admin-room').emit(event, data);
}

export function emitToCliente(socketId: string, event: string, data: any) {
  io.to(socketId).emit(event, data);
}

export function getConnectedClients() {
  return Array.from(connectedClients.values()).map(s => ({
    socketId: s.id,
    userId: s.data.userId,
    mesaId: s.data.mesaId,
    sesionId: s.data.sesionId
  }));
}