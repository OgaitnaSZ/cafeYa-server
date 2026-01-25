import express from "express";
const router = express.Router();
import * as producto from "../controllers/producto";
import * as validator from "../validators/producto";
import { authMiddleware } from "../middleware/session";

// Obtener producto
router.get("/productos", authMiddleware, validator.validatorProductos, producto.obtenerProductos);

// Agregar productos
router.get("/producto/:id", authMiddleware, validator.validatorId, producto.obtenerProducto);

export { router };