import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { matchedData } from "express-validator";
import { handleHttpError } from "../utils/handleError";
const prisma = new PrismaClient()

// Crear Cliente
export async function crearCliente(req: Request, res: Response) {
  try{
    const dataUser = matchedData(req);

    const newClient = await prisma.cliente.create({
      data: {
        nombre: dataUser.nombre,
        email: dataUser.email,
        telefono: dataUser.telefono
      },
    });

    res.status(201).json({"message": "Suscripto correctamente.", "email": newClient });
  }catch(error){
    return handleHttpError(res, "Error al suscribir", 500);
  }
}

// Obtener Cliente
export async function obtenerCliente(req: Request, res: Response) {
    try {
        const idCliente = Number(req.params.id);
    
        const existingClient = await prisma.cliente.findUnique({
          where: { cliente_id: idCliente },
          select: {
            nombre: true,
            email: true,
            telefono: true
          },
        });
    
        if(!existingClient) return handleHttpError(res, "Cliente no existe", 404)
    
        res.status(200).json(existingClient);
    } catch(error){
      return handleHttpError(res, "Error al obtener datos del cliente", 500);
    }
}

// Modificar Cliente
export async function modificarCliente(req: Request, res: Response) {
  try {
    const dataClient = matchedData(req);

    const updatedClient = await prisma.cliente.update({
      where: { cliente_id: dataClient.id },
      data: { 
        nombre: dataClient.nombre,
        email: dataClient.email,
        telefono: dataClient.telefono
      },
      select: {
        cliente_id: true,
        nombre: true,
        email: true,
        telefono: true
      }
    });

    if(!updatedClient) return handleHttpError(res, "ID de cliente incorrecto", 404)

    res.status(200).json(updatedClient);
  } catch (err) {
    return handleHttpError(res, "Error al actualizar el cliente", 500)
  }
}