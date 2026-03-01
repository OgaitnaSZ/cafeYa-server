import { pago_medio_de_pago, pedido_estado, usuario_rol } from "@prisma/client";

// Tipos
export interface Auth {
    usuario_id: string;
    nombre_usuario: string;
    rol_usuario: usuario_rol;
    token?: string;
}

export interface ClienteConectado {
  socketId: string;
  usuario_id: string;
  nombre_usuario: string;
  mesa_id: string;
  mesa_numero: number;
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
  mesa_id: string;
  mesa_numero: number;
  ocupadaAt: Date;
}

export interface NuevaResenaPayload {
  resena_id: string;
  pedido_id: string;
  nombre_cliente: string;
  puntuacion: number;
  resena: string;
  createdAt: Date;
}

export interface NuevoPagoPayload {
  pago_id: string;
  pedido_id: string;
  mesa_id: string;
  mesa_numero: number;
  usuario_id: string;
  nombre_usuario: string;
  monto_final: number;
  metodoPago: pago_medio_de_pago;
  createdAt: Date;
}

export interface LlamadaMozoPayload {
  mesa_id: string;
  mesa_numero: number;
  usuario_id: string;
  nombre_usuario: string;
  timestamp: Date;
}

// Payloads de eventos admin → cliente
export interface CambioEstadoPedidoPayload {
  pedido_id: string;
  numero_pedido: string;
  mesa_id: string;
  estado: pedido_estado;
}
