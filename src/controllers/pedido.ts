import { Request, Response } from "express";
import { PrismaClient, producto } from "@prisma/client";
import { matchedData } from "express-validator";
import { handleHttpError } from "../utils/handleError";
import { pedido_estado } from "@prisma/client";
const prisma = new PrismaClient()

// Crear Pedido
export async function crearPedido(req: Request, res: Response) {
  try {
    const dataPedido = matchedData(req);

    
    const productos: producto[] = dataPedido.productos;
    
    const precioTotal = productos.reduce(
      (total: number, p: any) => {
        const precio = typeof p.precio_unitario === 'number' 
        ? p.precio_unitario
        : typeof p.precio_unitario === 'string'
        ? parseFloat(p.precio_unitario)
        : p.precio_unitario?.toNumber?.() ?? 0;
        
        const cantidad = p.cantidad || 1;
        
        return total + (precio * cantidad);
      },
      0
    );
    
    const result = await prisma.$transaction(async (tx) => {
      
      const pedidoNumero = await generarNumeroPedido();
      
      const pedido = await tx.pedido.create({
        data: {
          numero_pedido: pedidoNumero,
          cliente_id: dataPedido.cliente_id,
          nombre_cliente: dataPedido.cliente_nombre,
          mesa_id: dataPedido.mesa_id,
          nota: dataPedido.nota,
          precio_total: precioTotal,
          estado: pedido_estado.Pendiente,
          ...(dataPedido.pedido_padre_id && { pedido_padre: dataPedido.pedido_padre_id })
        }
      });
      
      const productosConPedido = dataPedido.productos.map((p: any) => ({
        pedido_id: pedido.pedido_id,
        producto_id: p.producto.producto_id,
        cantidad: p.cantidad,
        precio_unitario: p.precio_unitario
      }));
      
      await tx.pedido_producto.createMany({
        data: productosConPedido
      });

      await tx.pedido_producto.findMany({
        where: { pedido_id: pedido.pedido_id }
      });

      return { pedido, productos };
    });

    res.status(201).json(result);
  } catch (error) {
    return handleHttpError(res, "Error al crear pedido", 500);
  }
}

// Helpers
export async function generarNumeroPedido(): Promise<string> {
  const hoy = new Date();
  
  // Formato DDMM
  const dia = String(hoy.getDate()).padStart(2, '0');
  const mes = String(hoy.getMonth() + 1).padStart(2, '0');
  const prefijo = `${dia}${mes}`;
  
  // Obtener el último pedido del día
  const inicioDelDia = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate(), 0, 0, 0);
  const finDelDia = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate(), 23, 59, 59);
  
  const ultimoPedidoDelDia = await prisma.pedido.findFirst({
    where: {
      created_at: {
        gte: inicioDelDia,
        lte: finDelDia
      }
    },
    orderBy: {
      numero_pedido: 'desc'
    },
    select: {
      numero_pedido: true
    }
  });
  
  let numeroSecuencial = 1;
  
  if (ultimoPedidoDelDia?.numero_pedido) {
    // Extraer el número secuencial del último pedido
    const partes = ultimoPedidoDelDia.numero_pedido.split('-');
    if (partes != undefined && partes.length === 2 && partes[0] === prefijo) {
      numeroSecuencial = parseInt(partes[1]!) + 1;
    }
  }
  
  return `${prefijo}-${numeroSecuencial}`;
}