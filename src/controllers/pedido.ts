import { Request, Response } from "express";
import { PrismaClient } from "../generated/prisma/client";
import { matchedData } from "express-validator";
import { handleHttpError } from "../utils/handleError";
const prisma = new PrismaClient()

// Crear Pedido
export async function crearPedido(req: Request, res: Response) {
  
}

// Agregar Productos
export async function agregarProductos(req: Request, res: Response) {
  
}

// Agregar Nota
export async function agregarNota(req: Request, res: Response) {
  
}

// Actualizar Precio
export async function actualizarPrecio(req: Request, res: Response) {
  
}