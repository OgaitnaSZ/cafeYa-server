import { Request, Response } from "express";
import { PrismaClient } from "../generated/prisma/client";
import { matchedData } from "express-validator";
import { handleHttpError } from "../utils/handleError";
const prisma = new PrismaClient()

// Obtener Producto
export async function obtenerProducto(req: Request, res: Response) {
  
}

// Obtener Productos
export async function obtenerProductos(req: Request, res: Response) {
  
}
