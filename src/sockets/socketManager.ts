import { Server, Socket } from "socket.io";
import { io } from "../app";

interface ClienteConectado {
  socketId: string;
  userId: string;
  userName: string;
  mesaId: string;
  mesaNumero: number;
  connectedAt: Date;
}

// Mapa simple de clientes conectados
const connectedClients = new Map<string, ClienteConectado>();
const connectedAdmins = new Set<string>();

// Inicializar Socket.IO
export function initializeSocket() {
  io.on("connection", (socket: Socket) => {
    console.log(`✅ Socket conectado: ${socket.id}`);

    // Autenticación
    socket.on("authenticate", (data: { 
      userId: string,
      userName: string,
      userRole: 'cliente' | 'admin' | 'encargado' | 'cocina',
      mesaId?: string,
      mesaNumero?: number,
      token?: string
    }) => {
      if (data.userRole === 'cliente') {
        // Guardar cliente conectado
        const clienteData: ClienteConectado = {
          socketId: socket.id,
          userId: data.userId,
          userName: data.userName,
          mesaId: data.mesaId!,
          mesaNumero: data.mesaNumero!,
          connectedAt: new Date()
        };
        
        connectedClients.set(socket.id, clienteData);
        
        // Unirse a room de la mesa
        socket.join(`mesa-${data.mesaId}`);
        console.log(`👤 Cliente ${data.userName} (${data.userId}) → Mesa ${data.mesaNumero}`);

        // Notificar a admins
        io.to('admin-room').emit('cliente:conectado', clienteData);

      } else if (['admin', 'encargado', 'cocina'].includes(data.userRole)) {
        // Admin conectado
        connectedAdmins.add(socket.id);
        socket.join('admin-room');
        console.log(`👨‍💼 Admin/Staff conectado: ${socket.id}`);

        // Enviar lista de clientes conectados al admin
        const clientesArray = Array.from(connectedClients.values());
        socket.emit('admin:clientes-conectados', clientesArray);
      }

      // Confirmar autenticación
      socket.emit('authenticated', { 
        success: true, 
        role: data.userRole,
        socketId: socket.id
      });
    });

    // Desconexión
    socket.on("disconnect", () => {
      console.log(`❌ Socket desconectado: ${socket.id}`);

      // Si era un cliente
      const clienteData = connectedClients.get(socket.id);
      if (clienteData) {
        console.log(`👤 Cliente desconectado: ${clienteData.userName} - Mesa ${clienteData.mesaNumero}`);
        
        // Notificar a admins
        io.to('admin-room').emit('cliente:desconectado', clienteData);
        
        connectedClients.delete(socket.id);
      }

      // Si era un admin
      if (connectedAdmins.has(socket.id)) {
        connectedAdmins.delete(socket.id);
      }
    });

    // Ping-pong
    socket.on("ping", () => {
      socket.emit("pong");
    });
  });
}

// Helper functions para emitir eventos
export function emitToMesa(mesaId: string, event: string, data: any) {
  io.to(`mesa-${mesaId}`).emit(event, data);
  console.log(`📤 Evento "${event}" enviado a mesa-${mesaId}`);
}

export function emitToAdmins(event: string, data: any) {
  io.to('admin-room').emit(event, data);
  console.log(`📤 Evento "${event}" enviado a admins`);
}

export function emitToCliente(socketId: string, event: string, data: any) {
  io.to(socketId).emit(event, data);
  console.log(`📤 Evento "${event}" enviado a ${socketId}`);
}

export function getConnectedClients() {
  return Array.from(connectedClients.values());
}

export function getClientesByMesa(mesaId: string) {
  return Array.from(connectedClients.values()).filter(c => c.mesaId === mesaId);
}