import { Request, Response } from "express";
import { PrismaClient } from "../generated/prisma/client";
import { matchedData } from "express-validator";
import { handleHttpError } from "../utils/handleError";
const prisma = new PrismaClient()

// Obtener Mesa
export async function obtenerMesa(req: Request, res: Response) {
  
}

// Obtener Mesas
export async function obtenerMesas(req: Request, res: Response) {
  
}

// Actualizar Estado
export async function actualizarEstadoMesa(req: Request, res: Response) {
  
}

// Regenerar codigo dinamico
export async function regenerarCodigoDinamico(req: Request, res: Response) {
  
}

// Validar codigo mesa
export async function validarCodigoDinamico(req: Request, res: Response) {
  
}