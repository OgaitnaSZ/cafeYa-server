import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { matchedData } from "express-validator";
import { handleHttpError } from "../utils/handleError";
const prisma = new PrismaClient()

export async function crearPago(req: Request, res: Response) {
    try {
        const dataPago = matchedData(req);
    
        const result = await prisma.$transaction(async (tx) => {
            // 1. Obtener el pedido y validar
            const pedido = await tx.pedido.findUnique({
                where: { pedido_id: dataPago.pedido_id },
                select: { estado: true }
            });

            if (!pedido) return handleHttpError(res, "Pedido no encontrado", 404)

            // 2. Obtener productos del pedido con precio y cantidad
            const pedidoProductos = await tx.pedido_producto.findMany({
                where: { pedido_id: dataPago.pedido_id },
                select: {
                    precio_unitario: true,
                    cantidad: true
                }
            });

            if (pedidoProductos.length === 0) return handleHttpError(res, "El pedido no tiene productos", 404)

            // 3. Calcular el monto total
            const monto = pedidoProductos.reduce((total, item) => {
                const precio = typeof item.precio_unitario === 'number'
                    ? item.precio_unitario
                    : parseFloat(item.precio_unitario.toString());
                
                const cantidad = item.cantidad || 1;
                
                return total + (precio * cantidad);
            }, 0);

            // 4. Calcular IVA y monto final
            const tasaIVA = 0.21;
            const iva = Number((monto * tasaIVA).toFixed(2));
            const montoFinal = Number((monto + iva).toFixed(2));

            // 5. Crear el pago
            const pago = await tx.pago.create({
                data: {
                    pedido_id: dataPago.pedido_id,
                    medio_de_pago: dataPago.medio_pago,
                    monto: monto,
                    IVA: iva,
                    monto_final: montoFinal
                },
            });

            return pago;
        });

        res.status(201).json(result);
    } catch (error) {
        return handleHttpError(res, "Error al crear el pago", 404)
    }
}

// Obtener Pago
export async function obtenerPago(req: Request, res: Response) {
    try {
        const idPago = String(req.params.id);
    
        const existingPago = await prisma.pago.findUnique({
            where: { pago_id: idPago }
        });
    
        if(!existingPago) return handleHttpError(res, "Pago no existe", 404)
    
        res.status(200).json(existingPago);
    } catch(error){
        return handleHttpError(res, "Error al obtener datos del pago", 500);
    }
}