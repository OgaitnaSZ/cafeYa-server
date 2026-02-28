import { Socket } from "socket.io";
import { io } from "../app";
import { pago_medio_de_pago, pedido_estado, usuario_rol } from "@prisma/client";

// Tipos

interface ClienteConectado {
  socketId: string;
  userId: string;
  userName: string;
  mesaId: string;
  mesaNumero: number;
  connectedAt: Date;
}

// Payloads de eventos cliente → admin
export interface NuevoPedidoPayload {
  pedido_id: string;
  numero_pedido: string;
  mesa_id: string;
  cliente_id: string;
  nombre_cliente: string;
  productos: number;
  precio_total: number;
}

export interface NuevaMesaOcupadaPayload {
  mesaId: string;
  mesaNumero: number;
  userId: string;
  userName: string;
  ocupadaAt: Date;
}

export interface NuevaReseñaPayload {
  reseñaId: string;
  mesaId: string;
  mesaNumero: number;
  userId: string;
  userName: string;
  rating: number;
  comentario?: string;
  createdAt: Date;
}

export interface NuevoPagoPayload {
  pagoId: string;
  pedidoId: string;
  mesaId: string;
  mesaNumero: number;
  userId: string;
  userName: string;
  monto: number;
  metodoPago: pago_medio_de_pago;
  createdAt: Date;
}

export interface LlamadaMozoPayload {
  mesaId: string;
  mesaNumero: number;
  userId: string;
  userName: string;
  timestamp: Date;
}

// Payloads de eventos admin → cliente
export interface CambioEstadoPedidoPayload {
  pedido_id: string;
  mesa_id: string;
  estado: pedido_estado;
}

// Estado en memoria 

const connectedClients = new Map<string, ClienteConectado>();
const connectedAdmins = new Set<string>();

// Inicialización 

export function initializeSocket() {
  io.on("connection", (socket: Socket) => {
    console.log(`✅ Socket conectado: ${socket.id}`);

    // Autenticación
    socket.on("authenticate", (data: {
      userId: string;
      userName: string;
      mesaId?: string;
      userRole: usuario_rol;
      mesaNumero?: number;
      token?: string;
    }) => {
        connectedAdmins.add(socket.id);
        socket.join("admin-room");
        console.log(`👨‍💼 Staff conectado: ${socket.id} (${data.userRole})`);

        socket.emit("admin:clientes-conectados", Array.from(connectedClients.values()));


      socket.emit("authenticated", {
        success: true,
        role: data.userRole,
        socketId: socket.id,
      });
    });

    // Llamada al mozo (único evento que viene del frontend cliente)
    socket.on("mozo:llamada", (data: LlamadaMozoPayload) => {
      const cliente = connectedClients.get(socket.id);

      if (!cliente) {
        socket.emit("error", { message: "No autenticado" });
        return;
      }

      const payload: LlamadaMozoPayload = {
        mesaId: cliente.mesaId,
        mesaNumero: cliente.mesaNumero,
        userId: cliente.userId,
        userName: cliente.userName,
        timestamp: new Date(),
      };

      io.to("admin-room").emit("admin:llamada-mozo", payload);
      console.log(`🔔 Llamada al mozo: Mesa ${cliente.mesaNumero}`);

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
        console.log(`👤 Cliente desconectado: ${clienteData.userName} - Mesa ${clienteData.mesaNumero}`);
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
  console.log(`🪑 Mesa ${payload.mesaNumero} ocupada por ${payload.userName}`);
}

export function notifyNuevaReseña(payload: NuevaReseñaPayload) {
  io.to("admin-room").emit("admin:nueva-reseña", payload);
  console.log(`⭐ Nueva reseña de Mesa ${payload.mesaNumero}: ${payload.rating}/5`);
}

export function notifyNuevoPago(payload: NuevoPagoPayload) {
  io.to("admin-room").emit("admin:nuevo-pago", payload);
  console.log(`💳 Pago recibido: $${payload.monto} - Mesa ${payload.mesaNumero}`);
}

export function notifyCambioEstadoPedido(payload: CambioEstadoPedidoPayload) {
  io.to(`mesa-${payload.mesa_id}`).emit("pedido:estado-actualizado", payload);
  console.log(`🔄 Pedido ${payload.pedido_id} → ${payload.estado}`);
}

// Utilidades
export function emitToMesa(mesaId: string, event: string, data: unknown) {
  io.to(`mesa-${mesaId}`).emit(event, data);
}

export function emitToAdmins(event: string, data: unknown) {
  io.to("admin-room").emit(event, data);
}

export function getConnectedClients() {
  return Array.from(connectedClients.values());
}

export function getClientesByMesa(mesaId: string) {
  return Array.from(connectedClients.values()).filter((c) => c.mesaId === mesaId);
}