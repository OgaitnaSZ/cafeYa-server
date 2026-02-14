import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { matchedData } from "express-validator";
import { handleHttpError } from "../utils/handleError";
const prisma = new PrismaClient()

// Obtener Productos
export async function obtenerProductos(req: Request, res: Response) {
    try {
        const existingProducts = await prisma.producto.findMany();

        if (existingProducts.length === 0) return handleHttpError(res, "No hay productos coincidentes", 404)

        return res.status(200).json(existingProducts);
    } catch (err) {
        return handleHttpError(res, "Error al obtener productos", 500);
    }
}

// Obtener Productos destacados
export async function obtenerProductosDestacados(req: Request, res: Response) {
      try {
        const existingProducts = await prisma.producto.findMany({
            where: { destacado: true }
        });
          
        if(!existingProducts) return handleHttpError(res, "No hay productos destacados.", 404)

        return res.status(200).json(existingProducts);
    } catch (err) {
        return handleHttpError(res, "Error al obtener productos destacados", 500)
    }
}

// Obtener Categorias
export async function obtenerCategorias(req: Request, res: Response) {
    try {
        const existingCategorias = await prisma.categoria.findMany();

        if (existingCategorias.length === 0) return handleHttpError(res, "No hay categorías coincidentes", 404)

        return res.status(200).json(existingCategorias);
    } catch (err) {
        return handleHttpError(res, "Error al obtener categorías", 500);
    }
}

