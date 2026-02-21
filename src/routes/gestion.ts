import express from "express";
const router = express.Router();
import * as gestion from "../controllers/gestion";
import * as validator from "../validators/gestion";
import { authMiddleware } from "../middleware/session";
import { checkRol } from "../middleware/rol";
import { usuario_rol } from "@prisma/client";
import { uploadMiddleware } from "../utils/handleStorage";

router.use(authMiddleware); // Middleware para todas las rutas

// Helpers de roles
const adminOnly = checkRol([usuario_rol.admin]);
const encargadoOrAdmin = checkRol([
  usuario_rol.admin,
  usuario_rol.encargado
]);
const cocinaOrAdmin = checkRol([
  usuario_rol.admin,
  usuario_rol.cocina
]);


/* --- USUARIOS --- */
// Obtener Usuarios
router.get("/usuario/usuarios", adminOnly, gestion.obteneUsuarios);

// Crear Usuario
router.post("/usuario/crear", adminOnly, validator.validatorCrearUsuario, gestion.crearUsuario);

// Actualizar Usuario
router.put("/usuario", adminOnly, validator.validatorActualizarUsuario, gestion.actualizarUsuario);

// Eliminar Usuario
router.delete("/usuario/eliminar/:id", validator.validatorId, gestion.eliminarUsuario);

/* --- MESAS --- */
// Obtener Mesas
router.get("/mesa/mesas", encargadoOrAdmin, gestion.obtenerMesas);

// Crear Mesa
router.post("/mesa/crear", adminOnly, validator.validatorCrearMesa, gestion.crearMesa);

// Actualizar Mesa
router.put("/mesa", adminOnly, validator.validatorEditarMesa, gestion.actualizarMesa);

// Actualizar codigo mesa
router.patch("/mesa/codigo/:id", encargadoOrAdmin, validator.validatorId, gestion.actualizarCodigoMesa);

// Eliminar Mesa
router.delete("/mesa/eliminar/:id", validator.validatorId, gestion.eliminarMesa);

/* --- PEDIDOS --- */
// Actualizar Estado Pedido
router.patch("/pedido/estado", validator.validatorEstadoPedido, gestion.actualizarEstadoPedido);

// Obtener Pedidos Activos
router.get("/pedidos/activos", cocinaOrAdmin, gestion.obtenerPedidosActivos);

//Obtener Pedidos Por Mesa
router.get("/mesa/:id/pedidos", adminOnly, validator.validatorId, gestion.obtenerPedidosPorMesa);

/* --- PRODUCTOS --- */
// Crear productos
router.post("/producto/crear", adminOnly, validator.validatorCrearProducto, gestion.crearProducto);

// Actualizar producto
router.put("/producto/editar", adminOnly, validator.validatorActualizarProducto, gestion.actualiarProducto);

// Obtener productos
router.get("/producto/productos", adminOnly, gestion.obtenerProductos);

// Toggle estado producto
router.patch("/producto/estado/:id", encargadoOrAdmin, validator.validatorId, gestion.toggleEstadoProducto);

// Destacar producto
router.patch("/producto/destacar/:id", encargadoOrAdmin, validator.validatorId, gestion.destacarProducto);

// Eliminar producto
router.delete("/producto/eliminar/:id", validator.validatorId, gestion.eliminarProducto);

// Subir foto producto
router.post("/producto/foto", uploadMiddleware, validator.validatorIdFoto, gestion.subirFoto);

/* --- CATEGORIAS --- */
// Obtener categorias
router.get("/categoria/categorias", encargadoOrAdmin, gestion.obtenerCategorias);

// Crear categoria
router.post("/categoria/crear", adminOnly, validator.validatorCrearCategoria, gestion.crearCategoria);

// Actualizar categoria
router.put("/categoria/editar", adminOnly, validator.validatorActualizarCategoria, gestion.actualizarCategoria);

// Eliminar categoria
router.delete("/categoria/eliminar/:id", validator.validatorIdInt, gestion.eliminarCategoria);

/* --- CALIFICACIONES --- */
// Obtener calificaciones
router.get("/calificaciones", adminOnly, gestion.obtenerCalificaciones);

export { router };