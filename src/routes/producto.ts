import express from "express";
const router = express.Router();
import * as producto from "../controllers/producto";
import * as validator from "../validators/producto";

// Obtener productos
router.get("/productos", producto.obtenerProductos);

// Obtener productos destacados
router.get("/destacados", producto.obtenerProductosDestacados);

// Obtener categorias
router.get("/categorias", producto.obtenerCategorias);

export { router };