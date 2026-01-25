import express from "express";
const router = express.Router();
import * as gestion from "../controllers/gestion";
import * as validator from "../validators/gestion";
import { authMiddleware } from "../middleware/session";

/* --- ENCARGADO --- */
// Obtener Mesas
router.get("/mesas", authMiddleware, gestion.obtenerMesas);

// Actualizar estado mesas
router.patch("/mesas/estado", validator.validatorEstadoMesa, authMiddleware, gestion.actualizarEstadoMesa);

// Actualizar codigo mesa
router.patch("/mesas/codigo", validator.validatorCodigoMesa, authMiddleware, gestion.actualizarCodigoMesa);

// Actualizar Estado Pedido
router.patch("/pedido/estado", validator.validatorEstadoPedido, authMiddleware, gestion.actualizarEstadoPedido);

/* --- COCINA --- */
// Obtener Pedidos Activos
router.get("/pedidos/activos", authMiddleware, gestion.obtenerPedidosActivos);

/* --- ADMIN --- */
//Obtener Pedidos Por Mesa
router.get("/mesa/:id/pedidos", validator.validatorId, authMiddleware, gestion.obtenerPedidosPorMesa);

// Crear productos
router.post("/pedido/productos", validator.validatorCrearProducto, authMiddleware, gestion.crearProducto);

// Actualizar producto
router.post("/pedido/productos", validator.validatorActualizarProducto, authMiddleware, gestion.actualiarProducto);

// Obtener producto
router.get("/producto/:id", validator.validatorId, authMiddleware, gestion.obtenerProducto);

// Obtener productos
router.get("/productos", authMiddleware, gestion.obtenerProductos);

// Obtener calificaciones
router.get("/calificaciones", authMiddleware, gestion.obtenerCalificaciones);


export { router };