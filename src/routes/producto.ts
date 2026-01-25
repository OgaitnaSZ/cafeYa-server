import express from "express";
const router = express.Router();
import * as producto from "../controllers/producto";
import * as validator from "../validators/producto";

// Obtener producto
router.get("/productos", validator.validatorProductos, producto.obtenerProductos);

// Agregar productos
router.get("/:id", validator.validatorId, producto.obtenerProducto);

export { router };