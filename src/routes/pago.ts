import express from "express";
const router = express.Router();
import * as pago from "../controllers/pago";
import * as validator from "../validators/pago";
import { authMiddleware } from "../middleware/session";

// Crear pago
router.post("/pago", authMiddleware, validator.validatorPago, pago.crearPago);

// Obtener pago
router.get("/pago/:id", authMiddleware, validator.validatorId, pago.obtenerPago);

export { router };