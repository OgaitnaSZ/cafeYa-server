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
const allRoles = checkRol([
  usuario_rol.admin,
  usuario_rol.encargado,
  usuario_rol.cocina
])

/* --- USUARIOS --- */
// Obtener Usuarios
router.get("/usuario/usuarios", adminOnly, gestion.obteneUsuarios);

// Crear Usuario
router.post("/usuario/crear", adminOnly, validator.validatorCrearUsuario, gestion.crearUsuario);

// Actualizar Usuario
router.put("/usuario", adminOnly, validator.validatorActualizarUsuario, gestion.actualizarUsuario);

// Eliminar Usuario
router.delete("/usuario/eliminar/:id", adminOnly, validator.validatorId, gestion.eliminarUsuario);

/* --- MESAS --- */
// Obtener Mesas
router.get("/mesa/mesas", encargadoOrAdmin, gestion.obtenerMesas);

// Crear Mesa
router.post("/mesa/crear", encargadoOrAdmin, validator.validatorCrearMesa, gestion.crearMesa);

// Actualizar Mesa
router.put("/mesa", encargadoOrAdmin, validator.validatorEditarMesa, gestion.actualizarMesa);

// Actualizar codigo mesa
router.patch("/mesa/codigo/:id", encargadoOrAdmin, validator.validatorId, gestion.actualizarCodigoMesa);

// Eliminar Mesa
router.delete("/mesa/eliminar/:id", encargadoOrAdmin, validator.validatorId, gestion.eliminarMesa);

/* --- PEDIDOS --- */
// Obtener pedidos
router.get("/pedido/pedidos", encargadoOrAdmin, validator.validatorPedidosFiltro, gestion.obtenerPedidos);

// Obtener pedido
router.get("/pedido/pedido/:id", encargadoOrAdmin, validator.validatorId, gestion.obtenerPedido);

// Actualizar Estado Pedido
router.patch("/pedido/estado", allRoles, validator.validatorEstadoPedido, gestion.actualizarEstadoPedido);

// Obtener Pedidos Activos
router.get("/pedido/activos", allRoles, gestion.obtenerPedidosActivos);

/* --- PRODUCTOS --- */
// Crear productos
router.post("/producto/crear", encargadoOrAdmin, validator.validatorCrearProducto, gestion.crearProducto);

// Actualizar producto
router.put("/producto/editar", encargadoOrAdmin, validator.validatorActualizarProducto, gestion.actualiarProducto);

// Obtener productos
router.get("/producto/productos", encargadoOrAdmin, gestion.obtenerProductos);

// Toggle estado producto
router.patch("/producto/estado/:id", encargadoOrAdmin, validator.validatorId, gestion.toggleEstadoProducto);

// Destacar producto
router.patch("/producto/destacar/:id", encargadoOrAdmin, validator.validatorId, gestion.destacarProducto);

// Eliminar producto
router.delete("/producto/eliminar/:id", encargadoOrAdmin, validator.validatorId, gestion.eliminarProducto);

// Subir foto producto
router.post("/producto/foto", encargadoOrAdmin, uploadMiddleware, validator.validatorIdFoto, gestion.subirFoto);

/* --- CATEGORIAS --- */
// Obtener categorias
router.get("/categoria/categorias", encargadoOrAdmin, gestion.obtenerCategorias);

// Crear categoria
router.post("/categoria/crear", encargadoOrAdmin, validator.validatorCrearCategoria, gestion.crearCategoria);

// Actualizar categoria
router.put("/categoria/editar", encargadoOrAdmin, validator.validatorActualizarCategoria, gestion.actualizarCategoria);

// Eliminar categoria
router.delete("/categoria/eliminar/:id", encargadoOrAdmin, validator.validatorIdInt, gestion.eliminarCategoria);

/* --- CLIENTES --- */
// Obtener clientes
router.get("/cliente/clientes", encargadoOrAdmin, gestion.obtenerClientes);

// Eliminar clientes
router.delete("/cliente/eliminar/:id", adminOnly, validator.validatorId, gestion.eliminarCliente);

/* --- PAGOS --- */
// Obtener pagos
router.get("/pago/pagos", encargadoOrAdmin, validator.validatorPagosFiltro, gestion.obtenerPagos);

/* --- CALIFICACIONES --- */
// Obtener calificaciones
router.get("/calificaciones", encargadoOrAdmin, gestion.obtenerCalificaciones);

/* --- ANALYTICS --- */
// Obtener dashboard
router.get("/dashboard", encargadoOrAdmin, gestion.obtenerDashboard);

// Reportes
router.get("/reportes/resumen", encargadoOrAdmin, validator.validatorReporteResumen, gestion.obtenerReportesResumen);
router.get("/reportes/calendario", encargadoOrAdmin, validator.validatorCalendario, gestion.obtenerCalendario);

export { router };