import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { matchedData } from "express-validator";
import { handleHttpError } from "../utils/handleError";
const prisma = new PrismaClient()

// Crear Calificacion
export async function crearCalificacion(req: Request, res: Response) {
  
}

// Obtener Calificacion
export async function obtenerCalificacion(req: Request, res: Response) {
  
}

// Obtener Calificaciones
export async function obtenerCalificaciones(req: Request, res: Response) {
  
}
