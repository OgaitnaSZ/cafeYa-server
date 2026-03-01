import { Request, Response } from "express";
import { pedido_estado, Prisma, PrismaClient } from "@prisma/client";
import { matchedData } from "express-validator";
import { handleHttpError } from "../utils/handleError";
import { encrypt } from "../utils/handlePassword";
import fs from 'fs';
const prisma = new PrismaClient();
import { notifyCambioEstadoPedido } from "../sockets/socketManager";
const MEDIA_PATH = `${__dirname}/../uploads`;
const PUBLIC_URL = process.env.PUBLIC_URL;
const FRONTEND_CLIENT_URL = process.env.FRONTEND_CLIENT_URL;

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
        qr_url: `${FRONTEND_CLIENT_URL}/validate/${mesa.mesa_id}`
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

    if(!updatedPedido) return handleHttpError(res, "ID de pedido incorrecto", 404);

    notifyCambioEstadoPedido({
      pedido_id: updatedPedido.pedido_id,
      numero_pedido: updatedPedido.numero_pedido,
      mesa_id: updatedPedido.mesa_id,
      estado: updatedPedido.estado
    });

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
    const { pedido_id, fecha_desde, fecha_hasta, search, puntuacion } = req.query;

    let whereClause: any = {};

    if (pedido_id) {
      whereClause.pedido_id = pedido_id as string;
    }

    if (puntuacion) {
      whereClause.puntuacion = parseInt(puntuacion as string);
    }

    if (search) {
      whereClause.nombre_cliente = {
        contains: search as string,
        mode: 'insensitive'
      };
    }

    if (fecha_desde || fecha_hasta) {
      whereClause.created_at = {};
      if (fecha_desde) {
        whereClause.created_at.gte = new Date(fecha_desde as string);
      }
      if (fecha_hasta) {
        whereClause.created_at.lte = new Date(fecha_hasta as string);
      }
    }

    const calificaciones = await prisma.calificacion.findMany({
      where: whereClause,
      include: {
        pedido: {
          select: {
            pedido_id: true,
            numero_pedido: true,
            precio_total: true,
            mesa: {
              select: {
                numero: true
              }
            }
          }
        }
      },
      orderBy: { created_at: 'desc' }
    });

    res.status(200).json(calificaciones);
  } catch (error) {
    handleHttpError(res, "Error al obtener calificaciones", 500);
  }
}

// Pagos
export async function obtenerPagos(req: Request, res: Response) {
  try {
    const { pedido_id, medio_de_pago, fecha_desde, fecha_hasta } = req.query;

    let whereClause: any = {};

    if (pedido_id) {
      whereClause.pedido_id = pedido_id as string;
    }

    if (medio_de_pago) {
      whereClause.medio_de_pago = medio_de_pago as string;
    }

    if (fecha_desde || fecha_hasta) {
      whereClause.created_at = {};
      if (fecha_desde) {
        whereClause.created_at.gte = new Date(fecha_desde as string);
      }
      if (fecha_hasta) {
        whereClause.created_at.lte = new Date(fecha_hasta as string);
      }
    }

    const pagos = await prisma.pago.findMany({
      where: whereClause,
      include: {
        pedido: {
          select: {
            pedido_id: true,
            numero_pedido: true,
            nombre_cliente: true,
            precio_total: true,
            estado: true,
            mesa: {
              select: {
                numero: true
              }
            }
          }
        }
      },
      orderBy: { created_at: 'desc' }
    });

    res.status(200).json(pagos);
  } catch (error) {
    handleHttpError(res, "Error al obtener pagos", 500);
  }
}

// Analiticas
export async function obtenerDashboard(req: Request, res: Response) {
  try {
    const hoy  = getArgentinaDay(0);
    const ayer = getArgentinaDay(-1);

    const whereHoy  = { created_at: { gte: hoy.start,  lte: hoy.end  } };
    const whereAyer = { created_at: { gte: ayer.start, lte: ayer.end } };

    const [
      // Pagos hoy / ayer (para recaudado)
      pagosHoy,
      pagosAyer,

      // Pedidos hoy / ayer (conteo + activos)
      pedidosHoy,
      pedidosAyer,

      // Mesas
      mesas,

      // Top productos hoy
      topProductos,

      // Calificaciones hoy
      calificacionesHoy,
      calificacionesRecientes,
    ] = await Promise.all([

      // Pagos hoy
      prisma.pago.findMany({
        where: whereHoy,
        select: { monto_final: true, medio_de_pago: true },
      }),

      // Pagos ayer
      prisma.pago.findMany({
        where: whereAyer,
        select: { monto_final: true },
      }),

      // Pedidos hoy (incluye activos con detalle)
      prisma.pedido.findMany({
        where: {
          ...whereHoy,
          pedido_padre: null, // excluir sub-pedidos si aplica
        },
        select: {
          pedido_id: true,
          numero_pedido: true,
          nombre_cliente: true,
          precio_total: true,
          estado: true,
          created_at: true,
          mesa: { select: { numero: true } },
          pedido_producto: {
            select: {
              cantidad: true,
              producto: { select: { nombre: true } },
            },
          },
        },
        orderBy: { created_at: "desc" },
      }),

      // Pedidos ayer (solo conteo)
      prisma.pedido.count({
        where: { ...whereAyer, pedido_padre: null },
      }),

      // Mesas con pedido activo
      prisma.mesa.findMany({
        where: { is_archived: false },
        select: {
          mesa_id: true,
          numero: true,
          estado: true,
          pedido: {
            where: {
              estado: { in: ["Pendiente", "En_preparacion", "Listo"] },
            },
            orderBy: { created_at: "desc" },
            take: 1,
            select: {
              numero_pedido: true,
              nombre_cliente: true,
              precio_total: true,
              estado: true,
              created_at: true,
            },
          },
        },
        orderBy: { numero: "asc" },
      }),

      // Top 5 productos del día
      prisma.pedido_producto.groupBy({
        by: ["producto_id"],
        where: {
          pedido: whereHoy,
        },
        _sum: { cantidad: true },
        orderBy: { _sum: { cantidad: "desc" } },
        take: 5,
      }),

      // Calificaciones hoy (para promedio)
      prisma.calificacion.findMany({
        where: whereHoy,
        select: { puntuacion: true },
      }),

      // Últimas 5 calificaciones del día
      prisma.calificacion.findMany({
        where: whereHoy,
        select: {
          nombre_cliente: true,
          puntuacion: true,
          resena: true,
          created_at: true,
          pedido: { select: { numero_pedido: true } },
        },
        orderBy: { created_at: "desc" },
        take: 5,
      }),
    ]);

    // Nombres de productos del top
    const productosIds = topProductos.map((p) => p.producto_id);
    const productosInfo = await prisma.producto.findMany({
      where: { producto_id: { in: productosIds } },
      select: { producto_id: true, nombre: true, precio_unitario: true },
    });
    const productosMap = Object.fromEntries(
      productosInfo.map((p) => [p.producto_id, p])
    );

    // Calcular recaudado
    const recaudadoHoy = pagosHoy.reduce(
      (acc, p) => acc + Number(p.monto_final),
      0
    );
    const recaudadoAyer = pagosAyer.reduce(
      (acc, p) => acc + Number(p.monto_final),
      0
    );

    // Resumen de medios de pago
    const resumenPagos = pagosHoy.reduce(
      (acc, p) => {
        acc[p.medio_de_pago] = (acc[p.medio_de_pago] ?? 0) + Number(p.monto_final);
        return acc;
      },
      { efectivo: 0, tarjeta: 0, app: 0 } as Record<string, number>
    );

    // Pedidos activos (no entregados)
    const pedidosActivos = pedidosHoy
      .filter((p) => p.estado !== "Entregado")
      .map((p) => ({
        pedido_id: p.pedido_id,
        numero_pedido: p.numero_pedido,
        nombre_cliente: p.nombre_cliente,
        mesa_numero: p.mesa?.numero ?? null,
        precio_total: Number(p.precio_total),
        estado: p.estado,
        created_at: p.created_at,
        productos: p.pedido_producto.map(
          (pp) => `${pp.producto.nombre} x${pp.cantidad}`
        ),
      }));

    // Calificación promedio
    const calificacionPromedio =
      calificacionesHoy.length > 0
        ? calificacionesHoy.reduce((acc, c) => acc + c.puntuacion, 0) /
          calificacionesHoy.length
        : null;

    // Mesas con pedido activo mapeado
    const mesasMapeadas = mesas.map((m) => ({
      mesa_id: m.mesa_id,
      numero: m.numero,
      estado: m.estado,
      pedido_activo: m.pedido[0]
        ? {
            numero_pedido: m.pedido[0].numero_pedido,
            nombre_cliente: m.pedido[0].nombre_cliente,
            precio_total: Number(m.pedido[0].precio_total),
            estado: m.pedido[0].estado,
            created_at: m.pedido[0].created_at,
          }
        : null,
    }));

    // Top productos formateado
    const topProductosFormateado = topProductos.map((tp) => {
      const info = productosMap[tp.producto_id];
      const cantidad = tp._sum.cantidad ?? 0;
      return {
        producto_id: tp.producto_id,
        nombre: info?.nombre ?? "Desconocido",
        cantidad,
        total: cantidad * Number(info?.precio_unitario ?? 0),
      };
    });

    res.status(200).json({
      // Recaudación
      recaudadoHoy: Number(recaudadoHoy.toFixed(2)),
      recaudadoAyer: Number(recaudadoAyer.toFixed(2)),

      // Pedidos
      totalPedidosHoy: pedidosHoy.length,
      pedidosAyer,

      // Ticket promedio
      ticketPromedioHoy:
        pedidosHoy.length > 0
          ? Number((recaudadoHoy / pedidosHoy.length).toFixed(2))
          : 0,

      // Mesas
      mesas: mesasMapeadas,
      mesasOcupadas: mesasMapeadas.filter((m) => m.estado === "Ocupada").length,
      totalMesas: mesasMapeadas.length,

      // Pedidos activos en tiempo real
      pedidosActivos,

      // Medios de pago
      resumenPagos,

      // Top productos
      topProductos: topProductosFormateado,

      // Calificaciones
      calificacionPromedio:
        calificacionPromedio !== null
          ? Number(calificacionPromedio.toFixed(1))
          : null,
      totalCalificaciones: calificacionesHoy.length,
      calificacionesRecientes: calificacionesRecientes.map((c) => ({
        nombre_cliente: c.nombre_cliente,
        puntuacion: c.puntuacion,
        resena: c.resena,
        created_at: c.created_at,
        numero_pedido: c.pedido.numero_pedido,
      })),

      // Metadata
      generadoEn: new Date(),
    });
  } catch (error) {
    handleHttpError(res, "Error al obtener datos del dashboard", 500);
  }
}

// Reportes y analiticas
interface RawDiaSerie {
  fecha: Date;
  pedidos: bigint;
  clientes: bigint;
  recaudado: string | null;
}

interface RawHora {
  hora: number;
  pedidos: bigint;
}

interface RawTopProducto {
  producto_id: string;
  nombre: string;
  cantidad: bigint;
  total: string;
}

interface RawMedioPago {
  medio_de_pago: string;
  total: string;
}

interface RawEstado {
  estado: string;
  count: bigint;
}

interface RawKpi {
  recaudado: string | null;
  pedidos: bigint;
  clientes: bigint;
  calificacion: string | null;
}

export async function obtenerReportesResumen(req: Request, res: Response) {
  try {
    const { from, to } = req.query as { from?: string; to?: string };

    // Default: últimos 7 días
    const today = new Date();
    const defaultTo   = today.toISOString().slice(0, 10);
    const defaultFrom = new Date(today.getTime() - 6 * 86_400_000)
      .toISOString()
      .slice(0, 10);

    const fromStr = from ?? defaultFrom;
    const toStr   = to   ?? defaultTo;

    const fromDate = arDateToUTC(fromStr);
    const toDate   = arDateToUTC(toStr, true);
    const { prevFrom, prevTo } = periodoAnterior(fromDate, toDate);

    // Todas las queries en paralelo
    const [
      kpiActual,
      kpiAnterior,
      serieTemporal,
      topProductos,
      pagosPorMedio,
      pedidosPorEstado,
      horasPico,
    ] = await Promise.all([

      // KPIs período actual
      prisma.$queryRaw<RawKpi[]>`
        SELECT
          SUM(pg.monto_final)                        AS recaudado,
          COUNT(DISTINCT p.pedido_id)                AS pedidos,
          COUNT(DISTINCT p.cliente_id)               AS clientes,
          AVG(c.puntuacion)                          AS calificacion
        FROM pedido p
        LEFT JOIN pago          pg ON pg.pedido_id  = p.pedido_id
        LEFT JOIN calificacion  c  ON c.pedido_id   = p.pedido_id
        WHERE p.created_at BETWEEN ${fromDate} AND ${toDate}
          AND p.pedido_padre IS NULL
      `,

      // KPIs período anterior (para variación)
      prisma.$queryRaw<RawKpi[]>`
        SELECT
          SUM(pg.monto_final)                        AS recaudado,
          COUNT(DISTINCT p.pedido_id)                AS pedidos,
          COUNT(DISTINCT p.cliente_id)               AS clientes,
          AVG(c.puntuacion)                          AS calificacion
        FROM pedido p
        LEFT JOIN pago          pg ON pg.pedido_id  = p.pedido_id
        LEFT JOIN calificacion  c  ON c.pedido_id   = p.pedido_id
        WHERE p.created_at BETWEEN ${prevFrom} AND ${prevTo}
          AND p.pedido_padre IS NULL
      `,

      // Serie temporal día a día
      // Usada tanto para el gráfico de línea como para el calendario
      prisma.$queryRaw<RawDiaSerie[]>`
        SELECT
          DATE(CONVERT_TZ(p.created_at, '+00:00', '-03:00')) AS fecha,
          COUNT(DISTINCT p.pedido_id)                         AS pedidos,
          COUNT(DISTINCT p.cliente_id)                        AS clientes,
          COALESCE(SUM(pg.monto_final), 0)                    AS recaudado
        FROM pedido p
        LEFT JOIN pago pg ON pg.pedido_id = p.pedido_id
        WHERE p.created_at BETWEEN ${fromDate} AND ${toDate}
          AND p.pedido_padre IS NULL
        GROUP BY DATE(CONVERT_TZ(p.created_at, '+00:00', '-03:00'))
        ORDER BY fecha ASC
      `,

      // Top 10 productos
      prisma.$queryRaw<RawTopProducto[]>`
        SELECT
          pp.producto_id,
          pr.nombre,
          SUM(pp.cantidad)                        AS cantidad,
          SUM(pp.cantidad * pp.precio_unitario)   AS total
        FROM pedido_producto pp
        JOIN producto pr ON pr.producto_id = pp.producto_id
        JOIN pedido   p  ON p.pedido_id    = pp.pedido_id
        WHERE p.created_at BETWEEN ${fromDate} AND ${toDate}
          AND p.pedido_padre IS NULL
        GROUP BY pp.producto_id, pr.nombre
        ORDER BY cantidad DESC
        LIMIT 10
      `,

      // Recaudado por medio de pago
      prisma.$queryRaw<RawMedioPago[]>`
        SELECT
          pg.medio_de_pago,
          SUM(pg.monto_final) AS total
        FROM pago pg
        JOIN pedido p ON p.pedido_id = pg.pedido_id
        WHERE pg.created_at BETWEEN ${fromDate} AND ${toDate}
          AND p.pedido_padre IS NULL
        GROUP BY pg.medio_de_pago
      `,

      // Pedidos por estado
      prisma.$queryRaw<RawEstado[]>`
        SELECT estado, COUNT(*) AS count
        FROM pedido
        WHERE created_at BETWEEN ${fromDate} AND ${toDate}
          AND pedido_padre IS NULL
        GROUP BY estado
      `,

      // Horas pico (promedio por hora del día)
      prisma.$queryRaw<RawHora[]>`
        SELECT
          HOUR(CONVERT_TZ(created_at, '+00:00', '-03:00')) AS hora,
          COUNT(*)                                          AS pedidos
        FROM pedido
        WHERE created_at BETWEEN ${fromDate} AND ${toDate}
          AND pedido_padre IS NULL
        GROUP BY HOUR(CONVERT_TZ(created_at, '+00:00', '-03:00'))
        ORDER BY hora ASC
      `,
    ]);

    // Normalizar KPIs
    const kpiA = kpiActual[0];
    const kpiP = kpiAnterior[0];

    const recaudadoActual = Number(kpiA!.recaudado ?? 0);
    const pedidosActual = Number(kpiA!.pedidos ?? 0);
    const clientesActual = Number(kpiA!.clientes ?? 0);
    const califActual = kpiA!.calificacion ? Number(Number(kpiA!.calificacion).toFixed(1)) : null;
    const ticketActual = pedidosActual > 0 ? recaudadoActual / pedidosActual : 0;

    const recaudadoAnterior = Number(kpiP!.recaudado ?? 0);
    const pedidosAnterior = Number(kpiP!.pedidos ?? 0);
    const clientesAnterior = Number(kpiP!.clientes ?? 0);
    const ticketAnterior = pedidosAnterior > 0 ? recaudadoAnterior / pedidosAnterior : 0;

    const variacion = (actual: number, anterior: number) =>
      anterior > 0
        ? Number(((actual - anterior) / anterior * 100).toFixed(1))
        : null;

    // Normalizar serie temporal
    const serie = serieTemporal.map((row) => ({
      fecha: row.fecha instanceof Date
        ? row.fecha.toISOString().slice(0, 10)
        : String(row.fecha).slice(0, 10),
      pedidos: Number(row.pedidos),
      clientes: Number(row.clientes),
      recaudado: Number(row.recaudado ?? 0),
    }));

    // Normalizar top productos
    const maxCantidad = topProductos.length > 0
      ? Math.max(...topProductos.map((p) => Number(p.cantidad)))
      : 1;

    const top = topProductos.map((p) => ({
      producto_id: p.producto_id,
      nombre: p.nombre,
      cantidad: Number(p.cantidad),
      total: Number(p.total),
      porcentaje: Math.round((Number(p.cantidad) / maxCantidad) * 100),
    }));

    // Normalizar pagos
    const pagos = { efectivo: 0, tarjeta: 0, app: 0 };
    for (const row of pagosPorMedio) {
      const key = row.medio_de_pago as keyof typeof pagos;
      if (key in pagos) pagos[key] = Number(row.total);
    }

    // Normalizar estados
    const estadoMap: Record<string, number> = {};
    for (const row of pedidosPorEstado) {
      estadoMap[row.estado] = Number(row.count);
    }
    const estados = {
      Pendiente: estadoMap["Pendiente"] ?? 0,
      En_preparacion: estadoMap["En_preparacion"] ?? 0,
      Listo: estadoMap["Listo"] ?? 0,
      Entregado: estadoMap["Entregado"] ?? 0,
      Cancelado: estadoMap["Cancelado"] ?? 0,
    };

    // Normalizar horas pico
    const maxPedidosHora = horasPico.length > 0
      ? Math.max(...horasPico.map((h) => Number(h.pedidos)))
      : 1;

    const horas = horasPico.map((h) => ({
      hora: Number(h.hora),
      pedidos: Number(h.pedidos),
      intensity: Number(h.pedidos) / maxPedidosHora,
    }));

    // Response
    res.status(200).json({
      // Metadata del período
      periodo: { from: fromStr, to: toStr },

      // KPIs actuales
      kpis: {
        recaudado: Number(recaudadoActual.toFixed(2)),
        pedidos: pedidosActual,
        clientes:clientesActual,
        ticket: Number(ticketActual.toFixed(2)),
        calificacion: califActual,
      },

      // Variaciones vs período anterior
      variaciones: {
        recaudado: variacion(recaudadoActual, recaudadoAnterior),
        pedidos: variacion(pedidosActual, pedidosAnterior),
        clientes: variacion(clientesActual, clientesAnterior),
        ticket: variacion(ticketActual, ticketAnterior),
      },

      // Serie temporal día a día (para gráfico de línea)
      serie,

      // Top productos
      topProductos: top,

      // Medios de pago
      pagos,

      // Pedidos por estado
      estados,

      // Horas pico
      horasPico: horas,
    });
  } catch (error) {
    console.error(error);
    handleHttpError(res, "Error al obtener reportes", 500);
  }
}

export async function obtenerCalendario(req: Request, res: Response) {
  try {
    const today = new Date();
    const year  = parseInt((req.query.year  as string) ?? today.getFullYear().toString());
    const month = parseInt((req.query.month as string) ?? (today.getMonth() + 1).toString());

    if (isNaN(year) || isNaN(month) || month < 1 || month > 12) handleHttpError(res, "year y month son requeridos y deben ser válidos", 400);

    // Primer y último día del mes en UTC considerando AR UTC-3
    const fromDate = arDateToUTC(`${year}-${String(month).padStart(2, "0")}-01`);
    const lastDay  = new Date(year, month, 0).getDate(); // último día del mes
    const toDate   = arDateToUTC(
      `${year}-${String(month).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`,
      true
    );

    const rows = await prisma.$queryRaw<RawDiaSerie[]>`
      SELECT
        DATE(CONVERT_TZ(p.created_at, '+00:00', '-03:00')) AS fecha,
        COUNT(DISTINCT p.pedido_id) AS pedidos,
        COUNT(DISTINCT p.cliente_id) AS clientes,
        COALESCE(SUM(pg.monto_final), 0) AS recaudado
      FROM pedido p
      LEFT JOIN pago pg ON pg.pedido_id = p.pedido_id
      WHERE p.created_at BETWEEN ${fromDate} AND ${toDate}
        AND p.pedido_padre IS NULL
      GROUP BY DATE(CONVERT_TZ(p.created_at, '+00:00', '-03:00'))
      ORDER BY fecha ASC
    `;

    const dias = rows.map((row) => ({
      fecha: row.fecha instanceof Date
        ? row.fecha.toISOString().slice(0, 10)
        : String(row.fecha).slice(0, 10),
      pedidos: Number(row.pedidos),
      clientes: Number(row.clientes),
      recaudado: Number(row.recaudado ?? 0),
    }));

    res.status(200).json({
      year,
      month,
      dias,
      totales: {
        recaudado: dias.reduce((a, d) => a + d.recaudado, 0),
        pedidos: dias.reduce((a, d) => a + d.pedidos,   0),
        clientes: dias.reduce((a, d) => a + d.clientes,  0),
      },
    });
  } catch (error) {
    console.error(error);
    handleHttpError(res, "Error al obtener calendario", 500);
  }
}

// Utils
export async function eliminarFotoPorId(id: string) {
  const producto = await prisma.producto.findUnique({
    where: { producto_id: id }
  });

  if (!producto) throw new Error("Producto no existe");

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

// Horario de Argentina UTC-3
const AR_OFFSET_MS = -3 * 60 * 60 * 1000;

function getArgentinaDay(offsetDays = 0): { start: Date; end: Date } {
  // Fecha actual en hora argentina
  const nowUtc = Date.now() + AR_OFFSET_MS;
  const arDate = new Date(nowUtc);

  // Midnight del día pedido en hora argentina
  const startAr = new Date(arDate);
  startAr.setUTCHours(0, 0, 0, 0);
  startAr.setUTCDate(startAr.getUTCDate() + offsetDays);

  const endAr = new Date(startAr);
  endAr.setUTCHours(23, 59, 59, 999);

  // Convertir de vuelta a UTC para las queries de Prisma
  const start = new Date(startAr.getTime() - AR_OFFSET_MS);
  const end   = new Date(endAr.getTime()   - AR_OFFSET_MS);

  return { start, end };
}

function arDateToUTC(dateStr: string, endOfDay = false): Date {
  const [y, m, d] = dateStr.split("-").map(Number);
  const arMidnight = Date.UTC(y!, m! - 1, d, 0, 0, 0, 0) - AR_OFFSET_MS;
  return new Date(endOfDay ? arMidnight + 86_399_999 : arMidnight);
}

function periodoAnterior(from: Date, to: Date): { prevFrom: Date; prevTo: Date } {
  const diff = to.getTime() - from.getTime();
  const prevTo   = new Date(from.getTime() - 1);
  const prevFrom = new Date(prevTo.getTime() - diff);
  return { prevFrom, prevTo };
}