import { Request, Response } from "express";
import { pedido_estado, Prisma, PrismaClient } from "@prisma/client";
import { matchedData } from "express-validator";
import { handleHttpError } from "../utils/handleError";
import { encrypt } from "../utils/handlePassword";
import fs from 'fs';
const prisma = new PrismaClient()
const MEDIA_PATH = `${__dirname}/../uploads`;
const PUBLIC_URL = process.env.PUBLIC_URL;
const FRONTEND_URL = process.env.FRONTEND_URL;

// Usuarios
export async function obteneUsuarios(req: Request, res: Response) {
    try {
        const existingUsers = await prisma.usuario.findMany({where: {is_archived: 0}});
        
        if(!existingUsers) return handleHttpError(res, "No hay usuarios", 404)

        // Eliminar el atributo password de cada usuario
        const usersWithoutPassword = existingUsers.map(({ password, ...user }) => user);

        return res.status(200).json(usersWithoutPassword);
    } catch (err) {
        return handleHttpError(res, "Error al obtener usuarios", 500)
    }
}

export async function crearUsuario(req: Request, res: Response) {
  try{
    const dataUser = matchedData(req);

    const hashedPassword = await encrypt(dataUser.password);

    const newUser = await prisma.usuario.create({
      data: {
        nombre: dataUser.nombre,
        email: dataUser.email,
        password: hashedPassword,
        rol: dataUser.rol
      },
    });

    res.status(201).json(newUser);
  }catch(error){
    return handleHttpError(res, "Error al crear el usuario", 500);
  }
}

export async function actualizarUsuario(req: Request, res: Response) {
  try {
    const dataUser = matchedData(req);

    const dataToUpdate: any = {
      nombre: dataUser.nombre,
      email: dataUser.email,
      rol: dataUser.rol,
    };


    if (dataUser.password) {
      const hashedPassword = await encrypt(dataUser.password);
      dataToUpdate.password = hashedPassword;
    }

    const updatedUser = await prisma.usuario.update({
      where: { id: dataUser.id },
      data: dataToUpdate
    });

    if(!updatedUser) return handleHttpError(res, "ID de usuario incorrecto", 404)

    res.status(200).json(updatedUser);
  } catch (err) {
    return handleHttpError(res, "Error al actualizar usuario", 500)
  }
}

export async function eliminarUsuario(req: Request, res: Response) {
  try {
      const data = req.params;
      const id = <string>data.id;

      const user = await prisma.usuario.findUnique({
        where: { id }
      });
      
      if (!user) return handleHttpError(res, "ID del usuario incorrecto", 404);

      if (user.rol === "admin" && user.is_archived === 0) {
        const activeAdminsCount = await prisma.usuario.count({
          where: {
            rol: "admin",
            is_archived: 0
          }
        });
  
        if (activeAdminsCount === 1) return handleHttpError(res, "No se puede eliminar al único administrador", 400);
      }

      // Archivar usuario (soft delete)
      await prisma.usuario.update({
        where: { id },
        data: { 
          is_archived: 1
        }
      });

      return res.status(200).json({ success: true });
  } catch (err) {
      return handleHttpError(res, "Error al eliminar usuarios", 500)
  }
}

// Mesas
export async function obtenerMesas(req: Request, res: Response) {
    try {
        const existingMesas = await prisma.mesa.findMany({where:{is_archived: false}});
        
        if(!existingMesas) return handleHttpError(res, "No hay mesas", 404)

      const mesasConQr = existingMesas.map(mesa => ({
        ...mesa,
        qr_url: `${FRONTEND_URL}validate/${mesa.mesa_id}`
      }));

        return res.status(200).json(mesasConQr);
    } catch (err) {
        return handleHttpError(res, "Error al obtener mesas", 500)
    }
}

export async function crearMesa(req: Request, res: Response) {
  try{
    const dataMesa = matchedData(req);

    const codigoAleatorio = generarCodigoMesa();

    const newMesa = await prisma.mesa.create({
      data: {
        numero: dataMesa.numero,
        codigo: codigoAleatorio
      },
    });

    res.status(201).json(newMesa);
  }catch(error){
    return handleHttpError(res, "Error al crear el mesa", 500);
  }
}

export async function actualizarMesa(req: Request, res: Response) {
  try {
    const dataMesa = matchedData(req);
    
    const updatedMesa = await prisma.mesa.update({
      where: { mesa_id: dataMesa.mesa_id },
      data: {
        numero: dataMesa.numero,
        estado: dataMesa.estado
      },
    });

    if(!updatedMesa) return handleHttpError(res, "ID de mesa incorrecto", 404)

    res.status(200).json(updatedMesa);
  } catch (err) {
    return handleHttpError(res, "Error al actualizar mesa", 500)
  }
}

export async function actualizarCodigoMesa(req: Request, res: Response) {
  try {
    const dataMesa = matchedData(req);

    const codigoAleatorio = generarCodigoMesa();

    const updatedMesa = await prisma.mesa.update({
      where: { mesa_id: dataMesa.id },
      data: { 
        codigo: codigoAleatorio
      }
    });

    if(!updatedMesa) return handleHttpError(res, "ID de mesa incorrecto", 404)

    res.status(200).json(updatedMesa);
  } catch (err) {
    return handleHttpError(res, "Error al actualizar el codigo de la mesa", 500)
  }
}

export async function eliminarMesa(req: Request, res: Response) {
  try {
    const data = req.params;
    const id = <string>data.id;

    const mesa = await prisma.mesa.findUnique({
      where: { mesa_id: id }
    })

    if (!mesa) return handleHttpError(res, "ID de mesa incorrecto", 404);

    // Archivar mesa (soft delete)
    await prisma.mesa.update({
      where: { mesa_id: id },
      data: { 
        is_archived: true,
        numero: null
      }
    });

    return res.status(200).json({ message: "Mesa eliminada correctamente" });

  } catch (err) {
    return handleHttpError(res, "Error al eliminar mesa", 500)
  }
}

// Pedidos
// Obtener pedidos
export async function obtenerPedidos(req: Request, res: Response) {
try {
    const { cliente_id, mesa_id, estado, fecha_desde, fecha_hasta, search } = req.query;
    
    const where: any = {};

    if (cliente_id) {
      where.cliente_id = cliente_id;
    }

    if (mesa_id) {
      where.mesa_id = mesa_id;
    }

    if (estado && estado !== 'todos') {
      where.estado = estado;
    }

    if (fecha_desde || fecha_hasta) {
      where.fecha_creacion = {
        ...(fecha_desde && { gte: fecha_desde }),
        ...(fecha_hasta && { lte: fecha_hasta }),
      };
    }

    if (search) {
      where.OR = [
        { notas: { contains: search, mode: 'insensitive' } },
        { codigo_referencia: { contains: search, mode: 'insensitive' } }
      ];
    }
    
    const pedidos = await prisma.pedido.findMany({
      where,
      orderBy: {
        created_at: 'desc'
      },
      include: {
        cliente: true,
        mesa: true
      }
    });

    return res.status(200).json(pedidos);

  } catch (err) {
    console.error(err);
    return handleHttpError(res, "Error al obtener pedidos", 500);
  }
}

// Obtener pedido
export async function obtenerPedido(req: Request, res: Response) {
  try {
      const dataPedido = matchedData(req);
  
      const existingPedido = await prisma.pedido.findUnique({
          where: { pedido_id: dataPedido.id }
      });
        
      if(!existingPedido) return handleHttpError(res, "Pedido no existente", 404)

      return res.status(200).json(existingPedido);
  } catch (err) {
    return handleHttpError(res, "Error al validar id del pedido", 500)
  }
}

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
              mesa_id: data.id
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
        categoria_id: dataProducto.categoria_id,
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
        categoria_id: dataProducto.categoria_id,
        precio_unitario: dataProducto.precio_unitario
      }
    });

    if(!updatedProducto) return handleHttpError(res, "ID de producto incorrecto", 404)

    res.status(200).json(updatedProducto);
  } catch (err) {
    return handleHttpError(res, "Error al actualizar producto", 500)
  }
}

// Obtener todos 
export async function obtenerProductos(req: Request, res: Response) {
    try {
        const productos = await prisma.producto.findMany({
          where: { is_archived: false }
        });
        
        if(!productos) return handleHttpError(res, "No hay productos", 404)

        return res.status(200).json(productos);
    } catch (err) {
        return handleHttpError(res, "Error al obtener productos", 500)
    }
}

export async function toggleEstadoProducto(req: Request, res: Response) {
  try {
    const data = req.params;
    const id = <string>data.id;

    const producto = await prisma.producto.findUnique({
      where: { producto_id: id }
    })

    if (!producto) return handleHttpError(res, "ID del producto incorrecto", 404);

    // Cambiar a nuevo estado
    const nuevoEstado = producto.estado === "Activo" ? "Inactivo" : "Activo";

    if(nuevoEstado === "Inactivo"){
      await prisma.producto
    }

    const updatedProduct = await prisma.producto.update({
      where: { producto_id: id},
      data: { 
        estado: nuevoEstado,
        destacado: false
      }
    });

    res.status(200).json(updatedProduct);
  } catch (err) {
    return handleHttpError(res, "Error al actualizar el estado del usuario", 500)
  }
}

export async function destacarProducto(req: Request, res: Response) {
  try {
    const data = req.params;
    const id = <string>data.id;

    const producto = await prisma.producto.findUnique({
      where: { producto_id: id }
    })

    if (!producto) return handleHttpError(res, "ID del producto incorrecto", 404);

    const nuevoEstado = !producto.destacado;
    
    if (nuevoEstado) {
      const totalDestacados = await prisma.producto.count({
        where: {
          destacado: true,
          is_archived: false
        }
      });
  
      if (totalDestacados >= 4) {
        return handleHttpError(res, "Ya existen 4 productos destacados", 400);
      }
    }
  
    const productoActualizado = await prisma.producto.update({
      where: { producto_id: id },
      data: { destacado: nuevoEstado }
    });
  
    return res.status(200).json(productoActualizado);
    
  } catch (err) {
    return handleHttpError(res, "Error al actualizar el estado del producto", 500)
  }
}

export async function eliminarProducto(req: Request, res: Response) {
  try {
    const data = req.params;
    const id = <string>data.id;

    const producto = await prisma.producto.findUnique({
      where: { producto_id: id }
    })

    if (!producto) return handleHttpError(res, "ID del usuario incorrecto", 404);

    // Eliminar imagen solo si existe
    if (producto.imagen_url) {
      await eliminarFotoPorId(producto.producto_id);
    }

    // Archivar producto (soft delete)
    await prisma.producto.update({
      where: { producto_id: id },
      data: { 
        is_archived: true, 
        destacado: false 
      }
    });

    return res.status(200).json(producto);

  } catch (err) {
    return handleHttpError(res, "Error al eliminar producto", 500)
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

        // Si ya tiene imagen, eliminar la anterior
        if (existingProduct.imagen_url) {
          await eliminarFotoPorId(String(productoId));
        }
        
        // Guardar en la db
        const data = await prisma.producto.update({
          where: { producto_id: productoId },
          data: {
            imagen_url: `${PUBLIC_URL}/uploads/${file.filename}`
          }
        });
        
        return res.status(201).send(data);
    } catch (error) {
      return handleHttpError(res, "Error al subir foto", 500);
    }
}

// Categorias
export async function obtenerCategorias(req: Request, res: Response) {
    try {
        const categoriasRaw = await prisma.categoria.findMany({
          include: {
            _count: {
              select: {
                producto: true,
              },
            },
          },
        });

        const categorias = categoriasRaw.map(cat => ({
          ...cat,
          count: cat._count.producto,
        }));
        
        if(!categorias) return handleHttpError(res, "No hay categorias", 404)

        return res.status(200).json(categorias);
    } catch (err) {
        return handleHttpError(res, "Error al obtener categorias", 500)
    }
}

export async function crearCategoria(req: Request, res: Response) {
  try{
    const categoria = matchedData(req);

    const newCategoria = await prisma.categoria.create({
      data: {
        nombre: categoria.nombre,
        emoji: categoria.emoji
      },
    });

    res.status(201).json(newCategoria);
  }catch(error){
    return handleHttpError(res, "Error al crear el categoria", 500);
  }
}

export async function actualizarCategoria(req: Request, res: Response) {
  try {
    const dataCategoria = matchedData(req);

    const updatedCategoria = await prisma.categoria.update({
      where: { categoria_id: dataCategoria.categoria_id },
      data: { 
        nombre: dataCategoria.nombre,
        emoji: dataCategoria.emoji
      }
    });

    if(!updatedCategoria) return handleHttpError(res, "ID de categoria incorrecto", 404)

    res.status(200).json(updatedCategoria);
  } catch (err) {
    return handleHttpError(res, "Error al actualizar categoria", 500)
  }
}

export async function eliminarCategoria(req: Request, res: Response) {
    try {
        const id = Number(req.params.id);

        // Validar que sea número entero positivo
        if (!Number.isInteger(id) || id <= 0) {
            return handleHttpError(res, "ID de categoría inválido", 400);
        }

        const categoria = await prisma.categoria.findUnique({
          where: { categoria_id: Number(id) }
        })

        if (!categoria) return handleHttpError(res, "Categoría no encontrada", 404);

        // Desasociar productos y eliminar en una transacción
        await prisma.$transaction([
            prisma.producto.updateMany({
                where: { categoria_id: id },
                data: { categoria_id: 0 }
            }),
            prisma.categoria.delete({
                where: { categoria_id: id }
            })
        ]);

        return res.status(200).json(categoria);
    } catch (err) {
        return handleHttpError(res, "Error al obtener mesas", 500)
    }
}

// Clientes
export async function obtenerClientes(req: Request, res: Response) {
  try {
    const clientes = await prisma.cliente.findMany({
      include: {
        _count: {
          select: { pedido: true }
        },
        pedido: {
          select: {
            precio_total: true,
            created_at: true
          },
          orderBy: { created_at: 'desc' }
        }
      },
      orderBy: { created_at: 'desc' }
    });

    // Calcular stats
    const clientesConStats = clientes.map(cliente => {
      const total_gastado = cliente.pedido.reduce( (sum, p) => sum.add(p.precio_total), new Prisma.Decimal(0) );
      const ultimo_pedido = cliente.pedido.length > 0 ? cliente.pedido[0]!.created_at : null;

      return {
        cliente_id: cliente.cliente_id,
        nombre: cliente.nombre,
        email: cliente.email,
        telefono: cliente.telefono,
        duracion_minutos: cliente.duracion_minutos,
        created_at: cliente.created_at,
        _count: {
          pedidos: cliente._count.pedido
        },
        total_gastado,
        ultimo_pedido
      };
    });

    res.status(200).json(clientesConStats);
  } catch (error) {
    handleHttpError(res, "Error al obtener clientes", 500);
  }
}

export async function eliminarCliente(req: Request, res: Response) {
  try {
    const { id } = matchedData(req);

    // Verificar si tiene pedidos
    const cliente = await prisma.cliente.findUnique({
      where: { cliente_id: id },
      include: { _count: { select: { pedido: true } } }
    });

    if (!cliente) return handleHttpError(res, "Cliente no encontrado", 404);

    if (cliente._count.pedido > 0) {
      return handleHttpError(res, `No se puede eliminar. El cliente tiene ${cliente._count.pedido} pedido(s) asociado(s)`,400);
    }

    await prisma.cliente.delete({ where: { cliente_id: id }});

    res.status(200).json({ message: "Cliente eliminado" });
  } catch (error) {
    handleHttpError(res, "Error al eliminar cliente", 500);
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

// Utils
export async function eliminarFotoPorId(id: string) {
  const producto = await prisma.producto.findUnique({
    where: { producto_id: id }
  });

  if (!producto) {
    throw new Error("Producto no existe");
  }

  // Eliminar archivo fisico
  const filePath = producto.imagen_url;
  const fileName = filePath?.split('/').pop();

  if (fileName && fs.existsSync(`${MEDIA_PATH}/${fileName}`)) {
    fs.unlinkSync(`${MEDIA_PATH}/${fileName}`);
  }

  // Eliminar registro de la db
  await prisma.producto.update({
    where: { producto_id: id },
    data: { imagen_url: null }
  });

  return true;
}

export function generarCodigoMesa(): string{
  const numeros = Array.from({ length: 4 }, () =>
    Math.floor(Math.random() * 10)
  );

  const codigo = numeros.join("").split("").join("");

  return codigo;
}