import express from "express";
const router = express.Router();
import * as producto from "../controllers/producto";
import * as validator from "../validators/producto";

// Obtener producto
router.get("/producto/:id", validator.validatorId, producto.obtenerProducto);

// Obtener productos
router.get("/productos", validator.validatorProductos, producto.obtenerProductos);

export { router };