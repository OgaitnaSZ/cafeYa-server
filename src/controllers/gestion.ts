import { Request, Response } from "express";
import { PrismaClient } from "../generated/prisma/client";
import { matchedData } from "express-validator";
import { handleHttpError } from "../utils/handleError";
const prisma = new PrismaClient()

// Mesas
// Obtener mesas
export async function obtenerMesas(req: Request, res: Response) {
  
}

// Actualizar estado
export async function actualizarEstadoMesa(req: Request, res: Response) {
  
}

// Actualizar codigo
export async function actualizarCodigoMesa(req: Request, res: Response) {
  
}

// Pedidos
// Actualizar estado de pedido
export async function actualizarEstadoPedido(req: Request, res: Response) {
  
}

// Obtener Pedidos por mesa
export async function obtenerPedidosPorMesa(req: Request, res: Response) {
  
}

// Obtener Pedidos activos
export async function obtenerPedidosActivos(req: Request, res: Response) {
  
}

// Productos
// Crear 
export async function crearProducto(req: Request, res: Response) {
  
}

// Actualizar 
export async function actualiarProducto(req: Request, res: Response) {
  
}

// Obtener 
export async function obtenerProducto(req: Request, res: Response) {
  
}

// Obtener todos 
export async function obtenerProductos(req: Request, res: Response) {
  
}

// Calificaciones
// Obtener calificaciones
export async function obtenerCalificaciones(req: Request, res: Response) {
  
}