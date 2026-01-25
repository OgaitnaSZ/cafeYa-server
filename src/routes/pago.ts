import express from "express";
const router = express.Router();
import * as pago from "../controllers/pago";
import * as validator from "../validators/pago";

// Crear pago
router.post("/pago", validator.validatorPago, pago.crearPago);

// Obtener pago
router.get("/pago/:id", validator.validatorId, pago.obtenerPago);

export { router };