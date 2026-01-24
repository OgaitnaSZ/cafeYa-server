import express from "express";
const router = express.Router();
import * as pedido from "../controllers/pedido";
import * as validator from "../validators/pedido";
import { authMiddleware } from "../middleware/session";

// Crear pedido
router.post("/pedido", authMiddleware, validator.validatorNuevoPedido, pedido.crearPedido);

// Agregar productos
router.post("/pedido/productos", authMiddleware, validator.validatorAgregarProductos, pedido.agregarProductos);

// Agregar nota
router.post("/pedido/nota", authMiddleware, validator.validatorAgregarNota, pedido.agregarNota);

// Actualizar precio
router.patch("/pedido/precio", authMiddleware, pedido.actualizarPrecio);

export { router };