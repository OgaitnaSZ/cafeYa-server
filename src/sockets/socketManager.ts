import { Socket } from "socket.io";
import { io } from "../app";
import { Auth, CambioEstadoPedidoPayload, ClienteConectado, LlamadaMozoPayload, NuevaMesaOcupadaPayload, NuevaResenaPayload, NuevoPagoPayload, NuevoPedidoPayload } from "./interfaces";


// Estado en memoria 
const connectedClients = new Map<string, ClienteConectado>();
const connectedAdmins = new Set<string>();

// Inicialización 

export function initializeSocket() {
  io.on("connection", (socket: Socket) => {
    console.log(`✅ Socket conectado: ${socket.id}`);

    // Autenticación
    socket.on("authenticate", (data: {
      userId?: string;
      userName?: string;
      userRole?: string;
      mesaId?: string;
      mesaNumero?: number;
      // campos del admin
      usuario_id?: string;
      nombre_usuario?: string;
      rol_usuario?: string;
      token?: string;
    }) => {

        // Cliente
        if (data.mesaId) {
          const clienteData: ClienteConectado = {
            socketId: socket.id,
            usuario_id: data.userId ?? '',
            nombre_usuario: data.userName ?? 'Cliente',
            mesa_id: data.mesaId,
            mesa_numero: data.mesaNumero!,
            connectedAt: new Date(),
          };
      
          connectedClients.set(socket.id, clienteData);
          socket.join(`mesa-${data.mesaId}`);
          console.log(`👤 Cliente ${clienteData.nombre_usuario} → Mesa ${clienteData.mesa_numero}`);
          io.to('admin-room').emit('cliente:conectado', clienteData);
      
          socket.emit('authenticated', { success: true, role: 'cliente', socketId: socket.id });
          return;
        }

        // Admin / staff
        const rol = data.userRole ?? data.rol_usuario;
      
        if (rol && ['admin', 'encargado', 'cocina'].includes(rol)) {
          connectedAdmins.add(socket.id);
          socket.join('admin-room');
          console.log(`👨‍💼 Staff conectado: ${socket.id} (${rol})`);
      
          socket.emit('admin:clientes-conectados', Array.from(connectedClients.values()));
          socket.emit('authenticated', { success: true, role: rol, socketId: socket.id });
          return;
        }

        console.warn(`⚠️ Socket ${socket.id} sin datos válidos:`, data);
        socket.emit('authenticated', { success: false, socketId: socket.id });
    });

    // Llamada al mozo (único evento que viene del frontend cliente)
    socket.on("mozo:llamada", (data: LlamadaMozoPayload) => {
      const cliente = connectedClients.get(socket.id);

      if (!cliente) {
        socket.emit("error", { message: "No autenticado" });
        return;
      }

      const payload: LlamadaMozoPayload = {
        mesa_id: cliente.mesa_id,
        mesa_numero: cliente.mesa_numero,
        usuario_id: cliente.usuario_id,
        nombre_usuario: cliente.nombre_usuario,
        timestamp: new Date(),
      };

      io.to("admin-room").emit("admin:llamada-mozo", payload);
      console.log(`🔔 Llamada al mozo: Mesa ${cliente.mesa_numero}`);

      // Confirmar al cliente que la llamada fue enviada
      socket.emit("mozo:llamada-confirmada", { timestamp: payload.timestamp });
    });

    // Desconexión
    socket.on("disconnect", () => {
      console.log(`❌ Socket desconectado: ${socket.id}`);

      const clienteData = connectedClients.get(socket.id);
      if (clienteData) {
        io.to("admin-room").emit("cliente:desconectado", clienteData);
        connectedClients.delete(socket.id);
        console.log(`👤 Cliente desconectado: ${clienteData.nombre_usuario} - Mesa ${clienteData.mesa_numero}`);
      }

      connectedAdmins.delete(socket.id);
    });

    socket.on("ping", () => socket.emit("pong"));
  });
}

// Helpers para emitir desde servicios/endpoints del backend
export function notifyNuevoPedido(payload: NuevoPedidoPayload) {
  io.to("admin-room").emit("admin:nuevo-pedido", payload);
  console.log(`📦 Nuevo pedido ${payload.pedido_id} - Mesa ${payload.mesa_id}`);
}

export function notifyMesaOcupada(payload: NuevaMesaOcupadaPayload) {
  io.to("admin-room").emit("admin:mesa-ocupada", payload);
  console.log(`🪑 Mesa ${payload.mesa_numero}`);
}

export function notifyNuevaResena(payload: NuevaResenaPayload) {
  io.to("admin-room").emit("admin:nueva-reseña", payload);
  console.log(`⭐ Nueva reseña de ${payload.nombre_cliente}: ${payload.puntuacion}/5`);
}

export function notifyNuevoPago(payload: NuevoPagoPayload) {
  io.to("admin-room").emit("admin:nuevo-pago", payload);
  console.log(`💳 Pago recibido: $${payload.monto_final} - Mesa ${payload.mesa_numero}`);
}

export function notifyCambioEstadoPedido(payload: CambioEstadoPedidoPayload) {
  io.to(`mesa-${payload.mesa_id}`).emit("pedido:estado-actualizado", payload);
  console.log(`🔄 Pedido ${payload.pedido_id} → ${payload.estado}`);
}

// Utilidades
export function emitToMesa(mesa_id: string, event: string, data: unknown) {
  io.to(`mesa-${mesa_id}`).emit(event, data);
}

export function emitToAdmins(event: string, data: unknown) {
  io.to("admin-room").emit(event, data);
}

export function getConnectedClients() {
  return Array.from(connectedClients.values());
}

export function getClientesByMesa(mesa_id: string) {
  return Array.from(connectedClients.values()).filter((c) => c.mesa_id === mesa_id);
}