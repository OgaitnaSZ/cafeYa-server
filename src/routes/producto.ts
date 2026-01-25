import express from "express";
const router = express.Router();
import * as pedido from "../controllers/pedido";
import * as validator from "../validators/producto";
import { authMiddleware } from "../middleware/session";

// Crear pedido
router.get("/producto/:id", authMiddleware, validator.validatorId, pedido.crearPedido);

// Agregar productos
router.get("/productos", authMiddleware, validator.validatorProductos, pedido.agregarProductos);

export { router };