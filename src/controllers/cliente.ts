import { Request, Response } from "express";
import { PrismaClient } from "../generated/prisma/client";
import { matchedData } from "express-validator";
import { handleHttpError } from "../utils/handleError";
const prisma = new PrismaClient()

// Crear Cliente
export async function crearCliente(req: Request, res: Response) {
  
}

// Obtener Cliente
export async function obtenerCliente(req: Request, res: Response) {
  
}

// Modificar Cliente
export async function modificarCliente(req: Request, res: Response) {
  
}

// Eliminar Cliente
export async function eliminarCliente(req: Request, res: Response) {
  
}