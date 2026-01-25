import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { matchedData } from "express-validator";
import { handleHttpError } from "../utils/handleError";
const prisma = new PrismaClient()

// Crear Pago
export async function crearPago(req: Request, res: Response) {
  
}

// Obtener Pago
export async function obtenerPago(req: Request, res: Response) {
  
}