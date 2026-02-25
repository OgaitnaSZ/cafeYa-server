import express from "express";
const router = express.Router();
import * as pago from "../controllers/pago";
import * as validator from "../validators/pago";

// Crear pago
router.post("/crear", validator.validatorPago, pago.crearPago);

// Obtener pago
router.get("/:id", validator.validatorId, pago.obtenerPago);

// Generar recibo
router.get("/:id/recibo", validator.validatorId, pago.generarRecibo);

export { router };