import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { matchedData } from "express-validator";
import { handleHttpError } from "../utils/handleError";
const prisma = new PrismaClient()

// Obtener Producto
export async function obtenerProducto(req: Request, res: Response) {
      try {
        const data = matchedData(req);
    
        const existingProduct = await prisma.producto.findUnique({
            where: { producto_id: data.id }
        });
          
        if(!existingProduct) return handleHttpError(res, "PRODUCTO NO EXISTE", 404)

        return res.status(200).json(existingProduct);
    } catch (err) {
      return handleHttpError(res, "Error al obtener producto", 500)
    }
}

// Obtener Productos
export async function obtenerProductos(req: Request, res: Response) {
    try {
        const data = matchedData(req);
        const { categoria, search } = data;

        const existingProducts = await prisma.producto.findMany({
            where: {
                AND: [
                    { disponibilidad: true },
                    categoria ? { categoria } : {},
                    search
                        ? {
                            OR: [
                                { categoria: { contains: search } },
                                { nombre: { contains: search } },
                                { descripcion: { contains: search } }
                            ]
                        }
                        : {}
                ]
            }
        });

        if (existingProducts.length === 0) return handleHttpError(res, "No hay productos coincidentes", 404)

        return res.status(200).json(existingProducts);
    } catch (err) {
        return handleHttpError(res, "Error al obtener productos", 500);
    }
}
