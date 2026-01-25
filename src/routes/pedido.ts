import express from "express";
const router = express.Router();
import * as pedido from "../controllers/pedido";
import * as validator from "../validators/pedido";

// Crear pedido
router.post("/crear", validator.validatorNuevoPedido, pedido.crearPedido);

export { router };