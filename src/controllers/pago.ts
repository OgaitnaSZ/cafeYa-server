import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import PDFDocument from 'pdfkit';
import { matchedData } from "express-validator";
import { handleHttpError } from "../utils/handleError";
import { notifyNuevoPago } from "../sockets/socketManager";
const prisma = new PrismaClient()

export async function crearPago(req: Request, res: Response) {
    try {
        const dataPago = matchedData(req);
    
        const result = await prisma.$transaction(async (tx) => {
            // 1. Obtener el pedido y validar
            const pedido = await tx.pedido.findUnique({
                where: { pedido_id: dataPago.pedido_id },
                select: { 
                    estado: true,
                    mesa_id: true,
                    mesa: {
                        select: {
                            numero: true
                        }
                    },
                    cliente: {
                        select: {
                            cliente_id: true,
                            nombre: true
                        }
                    }
                }
            });

            if (!pedido) {
                throw new Error("Pedido no encontrado");
            }

            // 2. Obtener productos del pedido con precio y cantidad
            const pedidoProductos = await tx.pedido_producto.findMany({
                where: { pedido_id: dataPago.pedido_id },
                select: {
                    precio_unitario: true,
                    cantidad: true
                }
            });

            if (pedidoProductos.length === 0) {
                throw new Error("El pedido no tiene productos");
            }

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

            return { pago, pedido };
        });

        notifyNuevoPago({
            pago_id: result.pago.pago_id,
            pedido_id: result.pago.pedido_id,
            mesa_id: result.pedido.mesa_id,
            mesa_numero: result.pedido.mesa.numero!,
            usuario_id: result.pedido.cliente.cliente_id,
            nombre_usuario: result.pedido.cliente.nombre,
            monto_final: Number(result.pago.monto_final),
            metodoPago: result.pago.medio_de_pago,
            createdAt: new Date()
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

// Generar recibo
export async function generarRecibo(req: Request, res: Response) {
  try {
    const data = req.params;
    const id = <string>data.id;
    
    const pago = await prisma.pago.findUnique({
      where: { pago_id: id },
      include: {
        pedido: {
          include: {
            cliente: true,
            mesa: true,
            pedido_producto: {
              include: { producto: true }
            }
          }
        }
      }
    });

    if (!pago) return handleHttpError(res, "Pago no encontrado", 404);

    const { pedido } = pago;

    const doc = new PDFDocument({ margin: 50, size: 'A4' });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="recibo-${pedido.numero_pedido}.pdf"`);
    doc.pipe(res);

    // ── ENCABEZADO ──────────────────────────────────────────
    doc.fontSize(20).font('Helvetica-Bold').text('CAFETERÍA', { align: 'center' });
    doc.fontSize(10).font('Helvetica').text('Tu dirección aquí', { align: 'center' });
    doc.moveDown(0.5);
    doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke();
    doc.moveDown(0.5);

    // ── DATOS DEL PEDIDO ────────────────────────────────────
    doc.fontSize(10);
    doc.text(`Pedido N°: ${pedido.numero_pedido}`, { continued: true });
    doc.text(`Fecha: ${pago.created_at.toLocaleDateString('es-AR')}`, { align: 'right' });

    doc.text(`Cliente: ${pedido.nombre_cliente}`, { continued: true });
    doc.text(`Mesa: ${pedido.mesa.numero}`, { align: 'right' });

    doc.text(`Medio de pago: ${pago.medio_de_pago}`);
    if (pedido.nota) doc.text(`Nota: ${pedido.nota}`);

    doc.moveDown(0.5);
    doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke();
    doc.moveDown(0.5);

    // ── TABLA DE PRODUCTOS ──────────────────────────────────
    const colProducto = 50;
    const colCantidad = 300;
    const colPrecioU  = 370;
    const colSubtotal = 460;

    doc.font('Helvetica-Bold');
    doc.text('Producto',    colProducto, doc.y);
    doc.text('Cant.',       colCantidad, doc.y - doc.currentLineHeight(), { width: 60, align: 'right' });
    doc.text('P. Unit.',    colPrecioU,  doc.y - doc.currentLineHeight(), { width: 70, align: 'right' });
    doc.text('Subtotal',    colSubtotal, doc.y - doc.currentLineHeight(), { width: 80, align: 'right' });
    doc.moveDown(0.3);
    doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke();
    doc.moveDown(0.3);

    doc.font('Helvetica');
    for (const item of pedido.pedido_producto) {
      const subtotal = item.cantidad * Number(item.precio_unitario);
      const y = doc.y;

      doc.text(item.producto.nombre,                    colProducto, y, { width: 240 });
      doc.text(String(item.cantidad),                   colCantidad, y, { width: 60,  align: 'right' });
      doc.text(`$${Number(item.precio_unitario).toFixed(2)}`, colPrecioU, y, { width: 70, align: 'right' });
      doc.text(`$${subtotal.toFixed(2)}`,               colSubtotal, y, { width: 80, align: 'right' });
      doc.moveDown(0.5);
    }

    // ── TOTALES ─────────────────────────────────────────────
    doc.moveDown(0.3);
    doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke();
    doc.moveDown(0.5);

    const rightCol = 380;
    const valueCol = 460;

    doc.font('Helvetica');
    doc.text('Subtotal:',  rightCol, doc.y, { width: 80, align: 'right' });
    doc.text(`$${Number(pago.monto).toFixed(2)}`, valueCol, doc.y - doc.currentLineHeight(), { width: 80, align: 'right' });
    doc.moveDown(0.5);

    doc.text('IVA:',       rightCol, doc.y, { width: 80, align: 'right' });
    doc.text(`$${Number(pago.IVA).toFixed(2)}`, valueCol, doc.y - doc.currentLineHeight(), { width: 80, align: 'right' });
    doc.moveDown(0.5);

    doc.font('Helvetica-Bold');
    doc.text('TOTAL:',     rightCol, doc.y, { width: 80, align: 'right' });
    doc.text(`$${Number(pago.monto_final).toFixed(2)}`, valueCol, doc.y - doc.currentLineHeight(), { width: 80, align: 'right' });

    // ── PIE ─────────────────────────────────────────────────
    doc.moveDown(2);
    doc.font('Helvetica').fontSize(9).text('¡Gracias por tu visita!', { align: 'center' });

    doc.end();

  } catch (error) {
    console.error(error);
    handleHttpError(res, "Error al generar recibo", 500);
  }
}
