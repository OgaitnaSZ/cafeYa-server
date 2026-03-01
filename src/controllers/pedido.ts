import { Request, Response } from "express";
import { Prisma, PrismaClient, producto } from "@prisma/client";
import { matchedData } from "express-validator";
import { handleHttpError } from "../utils/handleError";
import { pedido_estado } from "@prisma/client";
const prisma = new PrismaClient();
import { notifyNuevoPedido } from "../sockets/socketManager";

// Crear Pedido
export async function crearPedido(req: Request, res: Response) {
  try {
    const dataPedido = matchedData(req);
    const productos: producto[] = dataPedido.productos;

    const precioTotal = productos.reduce((total: number, p: any) => {
      const precio = typeof p.precio_unitario === 'number'
        ? p.precio_unitario
        : typeof p.precio_unitario === 'string'
        ? parseFloat(p.precio_unitario)
        : p.precio_unitario?.toNumber?.() ?? 0;
      return total + (precio * (p.cantidad || 1));
    }, 0);

    // ✅ Mover fuera de la transacción
    const pedidoNumero = await generarNumeroPedido();

    const result = await prisma.$transaction(async (tx) => {

      const pedido = await tx.pedido.create({
        data: {
          numero_pedido: pedidoNumero,
          cliente_id: dataPedido.cliente_id,
          nombre_cliente: dataPedido.cliente_nombre,
          mesa_id: dataPedido.mesa_id,
          nota: dataPedido.nota,
          precio_total: new Prisma.Decimal(precioTotal),
          estado: pedido_estado.Pendiente,
          ...(dataPedido.pedido_padre_id && {
            pedido_padre: dataPedido.pedido_padre_id
          })
        }
      });

      await tx.pedido_producto.createMany({
        data: dataPedido.productos.map((p: any) => ({
          pedido_id: pedido.pedido_id,
          producto_id: p.producto.producto_id,
          cantidad: p.cantidad,
          precio_unitario: p.precio_unitario
        }))
      });

      // ✅ updateMany es más eficiente que múltiples update()
      await Promise.all(
        dataPedido.productos.map((p: any) =>
          tx.producto.update({
            where: { producto_id: p.producto.producto_id },
            data: { stock: { decrement: p.cantidad } }
          })
        )
      );

      return { pedido, productos };

    }, { timeout: 10000 });


    notifyNuevoPedido({
      pedido_id: result.pedido.pedido_id,
      numero_pedido: result.pedido.numero_pedido,
      mesa_id: result.pedido.mesa_id,
      cliente_id: result.pedido.cliente_id,
      nombre_cliente: result.pedido.nombre_cliente,
      productos: productos.length,
      precio_total: Number(result.pedido.precio_total)
    });

    res.status(201).json(result);

  } catch (error) {
    console.log(error);
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