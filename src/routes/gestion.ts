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


/* --- ENCARGADO --- */
// Obtener Mesas
router.get("/mesas", encargadoOrAdmin, gestion.obtenerMesas);

// Actualizar estado mesas
router.patch("/mesas/estado", encargadoOrAdmin, validator.validatorEstadoMesa, gestion.actualizarEstadoMesa);

// Actualizar codigo mesa
router.patch("/mesas/codigo", encargadoOrAdmin, validator.validatorCodigoMesa, gestion.actualizarCodigoMesa);

// Actualizar Estado Pedido
router.patch("/pedido/estado", validator.validatorEstadoPedido, gestion.actualizarEstadoPedido);

/* --- COCINA --- */
// Obtener Pedidos Activos
router.get("/pedidos/activos", cocinaOrAdmin, gestion.obtenerPedidosActivos);

/* --- ADMIN --- */
//Obtener Pedidos Por Mesa
router.get("/mesa/:id/pedidos", adminOnly, validator.validatorId, gestion.obtenerPedidosPorMesa);

// Crear productos
router.post("/producto/crear", adminOnly, validator.validatorCrearProducto, gestion.crearProducto);

// Actualizar producto
router.put("/producto", adminOnly, validator.validatorActualizarProducto, gestion.actualiarProducto);

// Subir foto producto
router.post("/producto/foto", uploadMiddleware, validator.validatorId, gestion.subirFoto);

// Obtener producto
router.get("/producto/:id", adminOnly, validator.validatorId, gestion.obtenerProducto);

// Obtener productos
router.get("/productos", adminOnly, gestion.obtenerProductos);

// Obtener calificaciones
router.get("/calificaciones", adminOnly, gestion.obtenerCalificaciones);


export { router };