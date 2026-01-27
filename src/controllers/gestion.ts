import { Request, Response } from "express";
import { pedido_estado, PrismaClient } from "@prisma/client";
import { matchedData } from "express-validator";
import { handleHttpError } from "../utils/handleError";
const prisma = new PrismaClient()

const PUBLIC_URL = process.env.PUBLIC_URL;

// Mesas
// Obtener mesas
export async function obtenerMesas(req: Request, res: Response) {
    try {
        const data = matchedData(req);
    
        const existingMesas = await prisma.mesa.findMany();
        
        if(!existingMesas) return handleHttpError(res, "No hay mesas", 404)

        return res.status(200).json(existingMesas);
    } catch (err) {
        return handleHttpError(res, "Error al obtener mesas", 500)
    }
}

// Actualizar estado
export async function actualizarEstadoMesa(req: Request, res: Response) {
  try {
    const dataMesa = matchedData(req);

    const updatedMesa = await prisma.mesa.update({
      where: { mesa_id: dataMesa.mesa_id },
      data: { 
        estado: dataMesa.estado
      }
    });

    if(!updatedMesa) return handleHttpError(res, "ID de mesa incorrecto", 404)

    res.status(200).json(updatedMesa);
  } catch (err) {
    return handleHttpError(res, "Error al actualizar el estado de la mesa", 500)
  }
}

// Actualizar codigo
export async function actualizarCodigoMesa(req: Request, res: Response) {
  try {
    const dataMesa = matchedData(req);

    const updatedMesa = await prisma.mesa.update({
      where: { mesa_id: dataMesa.mesa_id },
      data: { 
        codigo_dinamico: dataMesa.codigo_dinamico
      }
    });

    if(!updatedMesa) return handleHttpError(res, "ID de mesa incorrecto", 404)

    res.status(200).json(updatedMesa);
  } catch (err) {
    return handleHttpError(res, "Error al actualizar el codigo de la mesa", 500)
  }
}

// Pedidos
// Actualizar estado de pedido
export async function actualizarEstadoPedido(req: Request, res: Response) {
  try {
    const dataPedido = matchedData(req);

    const updatedPedido = await prisma.pedido.update({
      where: { pedido_id: dataPedido.pedido_id },
      data: { 
        estado: dataPedido.estado
      }
    });

    if(!updatedPedido) return handleHttpError(res, "ID de pedido incorrecto", 404)

    res.status(200).json(updatedPedido);
  } catch (err) {
    return handleHttpError(res, "Error al actualizar el estado del pedido", 500)
  }
}

// Obtener Pedidos por mesa
export async function obtenerPedidosPorMesa(req: Request, res: Response) {
    try {
        const data = matchedData(req);
    
        const existingPedidos = await prisma.pedido.findMany({
            where:{
              mesa_id: Number(data.id)
            }
        });
        
        if(existingPedidos.length === 0) return handleHttpError(res, "No hay pedidos en esta mesa", 404)

        return res.status(200).json(existingPedidos);
    } catch (err) {
        return handleHttpError(res, "No hay pedidos para esta mesa", 500)
    }
}

// Obtener Pedidos activos
export async function obtenerPedidosActivos(req: Request, res: Response) {
    try {
        const existingPedido = await prisma.pedido.findMany({
            where:{
                estado: {
                    not: pedido_estado.Entregado
                }
            }
        });
        
        if(!existingPedido) return handleHttpError(res, "No hay pedidos activos", 404)

        return res.status(200).json(existingPedido);
    } catch (err) {
        return handleHttpError(res, "Error al obtener pedidos activos", 500)
    }
}

// Productos
// Crear 
export async function crearProducto(req: Request, res: Response) {
  try{
    const dataProducto = matchedData(req);

    const newProduct = await prisma.producto.create({
      data: {
        nombre: dataProducto.nombre,
        descripcion: dataProducto.descripcion,
        imagen_url: dataProducto.imagen_url,
        categoria: dataProducto.categoria,
        precio_unitario: dataProducto.precio_unitario
      },
    });

    res.status(201).json(newProduct);
  }catch(error){
    return handleHttpError(res, "Error al crear el producto", 500);
  }
}

// Actualizar 
export async function actualiarProducto(req: Request, res: Response) {
  try {
    const dataProducto = matchedData(req);

    const updatedProducto = await prisma.producto.update({
      where: { producto_id: dataProducto.producto_id },
      data: { 
        nombre: dataProducto.nombre,
        descripcion: dataProducto.descripcion,
        imagen_url: dataProducto.imagen_url,
        categoria: dataProducto.categoria,
        precio_unitario: dataProducto.precio_unitario
        
      }
    });

    if(!updatedProducto) return handleHttpError(res, "ID de producto incorrecto", 404)

    res.status(200).json(updatedProducto);
  } catch (err) {
    return handleHttpError(res, "Error al actualizar producto", 500)
  }
}

// Obtener 
export async function obtenerProducto(req: Request, res: Response) {
    try {
        const data = matchedData(req);
        
        const existingProducto = await prisma.producto.findMany({
            where:{ producto_id: data.id }
        });
        
        if(!existingProducto) return handleHttpError(res, "No existe el producto", 404)

        return res.status(200).json(existingProducto);
    } catch (err) {
        return handleHttpError(res, "Error al obtener producto", 500)
    }
}

// Obtener todos 
export async function obtenerProductos(req: Request, res: Response) {
    try {
        const productos = await prisma.producto.findMany();
        
        if(!productos) return handleHttpError(res, "No hay productos", 404)

        return res.status(200).json(productos);
    } catch (err) {
        return handleHttpError(res, "Error al obtener productos", 500)
    }
}

// Calificaciones
// Obtener calificaciones
export async function obtenerCalificaciones(req: Request, res: Response) {
    try {
        const calificaciones = await prisma.calificacion.findMany();
        
        if(!calificaciones) return handleHttpError(res, "No hay calificaciones", 404)

        return res.status(200).json(calificaciones);
    } catch (err) {
        return handleHttpError(res, "Error al obtener calificaciones", 500)
    }
}

// Fotos
// Subir fotos
export async function subirFoto(req: Request, res: Response) {
    try {
        const { body, file } = req;

        const productoId = String(body.producto_id);
        
        if (!file) return handleHttpError(res, "No se recibieron fotos", 400);

        const existingProduct = await prisma.producto.findUnique({
          where: { producto_id: productoId }
        });
        
        if (!existingProduct) return handleHttpError(res, "Producto no encontrado", 404)
        
        // Guardar en la db
        const data = await prisma.producto.update({
          where: { producto_id: productoId },
          data: {
            imagen_url: `${PUBLIC_URL}/uploads/${file.filename}`
          }
        });
        
        return res.status(201).send({ 
          mensaje: `Foto subida con exito`, 
          data
        });
    } catch (error) {
      return handleHttpError(res, "Error al subir foto", 500);
    }
}