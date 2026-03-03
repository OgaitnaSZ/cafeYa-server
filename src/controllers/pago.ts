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

    const WIDTH   = 226; // 80mm en puntos
    const MARGIN  = 12;
    const CW      = WIDTH - MARGIN * 2; // content width

    const doc = new PDFDocument({ margin: MARGIN, size: [WIDTH, 1000] });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="recibo-${pedido.numero_pedido}.pdf"`);
    doc.pipe(res);

    const centerText = (text: string, fontSize: number, font = 'Courier') => {
      doc.font(font).fontSize(fontSize).text(text, MARGIN, doc.y, { width: CW, align: 'center' });
    };

    const rowText = (left: string, right: string, fontSize = 7.5, bold = false) => {
      const font = bold ? 'Courier-Bold' : 'Courier';
      const y = doc.y;
      doc.font(font).fontSize(fontSize);
      doc.text(left,  MARGIN,          y, { width: CW * 0.65 });
      doc.text(right, MARGIN + CW * 0.65, y, { width: CW * 0.35, align: 'right' });
      doc.moveDown(0.4);
    };

    const separator = (char = '-') => {
      const line = char.repeat(48);
      centerText(line, 7);
      doc.moveDown(0.2);
    };

    //  ENCABEZADO
    doc.moveDown(0.5);
    centerText('Cafe Ya', 14, 'Courier-Bold');
    doc.moveDown(0.3);
    centerText('Av. Falsa 526', 7.5);
    centerText('Tel: 381-000-0000', 7.5);
    doc.moveDown(0.4);
    separator('=');

    //  DATOS DEL PEDIDO
    const fecha = new Date(pago.created_at).toLocaleString('es-AR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });

    doc.moveDown(0.2);
    rowText('Pedido N°:', pedido.numero_pedido);
    rowText('Fecha:', fecha);
    rowText('Cliente:', pedido.nombre_cliente);
    rowText('Mesa:', String(pedido.mesa.numero));
    rowText('Pago:', pago.medio_de_pago.toUpperCase());
    doc.moveDown(0.2);
    separator();

    //  HEADER TABLA
    doc.moveDown(0.2);
    const y0 = doc.y;
    doc.font('Courier-Bold').fontSize(7.5);
    doc.text('DESCRIPCION',  MARGIN,          y0, { width: 90 });
    doc.text('UD',           MARGIN + 90,     y0, { width: 25, align: 'center' });
    doc.text('P.U.',         MARGIN + 115,    y0, { width: 40, align: 'right' });
    doc.text('IMPORTE',      MARGIN + 155,    y0, { width: 48, align: 'right' });
    doc.moveDown(0.5);
    separator();

    //  ITEMS
    doc.font('Courier').fontSize(7.5);

    for (const item of pedido.pedido_producto) {
      const subtotal = item.cantidad * Number(item.precio_unitario);
      const nombre   = item.producto.nombre.length > 13
        ? item.producto.nombre.substring(0, 12) + '.'
        : item.producto.nombre;

      const y = doc.y;
      doc.text(nombre,                                        MARGIN,       y, { width: 90 });
      doc.text(String(item.cantidad),                         MARGIN + 90,  y, { width: 25, align: 'center' });
      doc.text(`$${Number(item.precio_unitario).toFixed(0)}`, MARGIN + 115, y, { width: 40, align: 'right' });
      doc.text(`$${subtotal.toFixed(0)}`,                     MARGIN + 155, y, { width: 48, align: 'right' });
      doc.moveDown(0.7);
    }

    doc.moveDown(0.2);
    separator();

    //  TOTALES
    doc.moveDown(0.2);
    rowText('Subtotal:',  `$${Number(pago.monto).toFixed(2)}`);
    rowText('IVA (21%):', `$${Number(pago.IVA).toFixed(2)}`);
    doc.moveDown(0.3);
    separator('=');
    doc.moveDown(0.2);
    rowText('** TOTAL A PAGAR:', `$${Number(pago.monto_final).toFixed(2)} **`, 9, true);
    doc.moveDown(0.2);
    separator('=');

    //  PIE
    doc.moveDown(0.5);
    centerText('¡Gracias por su visita!', 8, 'Courier-Bold');
    doc.moveDown(0.3);
    centerText('Vuelva pronto :)', 7.5);
    doc.moveDown(0.3);
    centerText('Conserve este comprobante', 6.5);
    doc.moveDown(1);

    doc.end();

  } catch (error) {
    console.error(error);
    handleHttpError(res, "Error al generar recibo", 500);
  }
}
