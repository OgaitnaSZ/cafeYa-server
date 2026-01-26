import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { matchedData } from "express-validator";
import { handleHttpError } from "../utils/handleError";
const prisma = new PrismaClient()

// Crear Calificacion
export async function crearCalificacion(req: Request, res: Response) {
    try{
      const dataReview = matchedData(req);
  
      const newReview = await prisma.calificacion.create({
        data: {
          pedido_id: dataReview.pedido_id,
          puntuacion: dataReview.puntuacion,
          resena: dataReview.resena,
          nombre_cliente: dataReview.nombre_cliente
        },
      });
  
      res.status(201).json(newReview );
    }catch(error){
      return handleHttpError(res, "Error al crear calificacion", 500);
    }
}

// Obtener Calificacion
export async function obtenerCalificacion(req: Request, res: Response) {
    try {
        const idCalificacion = String(req.params.id);
    
        const existingCalificacion = await prisma.calificacion.findUnique({
            where: { id: idCalificacion}
        });
    
        if(!existingCalificacion){ return handleHttpError(res, "Calificacion no existe", 404) }
    
        res.status(200).json(existingCalificacion);
    } catch(error){
        return handleHttpError(res, "Error al obtener calificacion", 500);
    }
}

// Obtener Calificaciones
export async function obtenerCalificaciones(req: Request, res: Response) {
    try {
        const allCalificaciones = await prisma.calificacion.findMany();
    
        if(!allCalificaciones){ return handleHttpError(res, "No hay calificaciones", 404) }
    
        res.status(200).json(allCalificaciones);
    } catch(error){
        return handleHttpError(res, "Error al obtener calificaciones", 500);
    }
}
