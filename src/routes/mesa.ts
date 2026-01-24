import express from "express";
const router = express.Router();
import * as mesa from "../controllers/mesa";
import * as validator from "../validators/mesa";
import { authMiddleware } from "../middleware/session";

// Obtener mesas
router.get("/mesas", authMiddleware, mesa.obtenerMesas);

// Obtener mesa
router.get("/mesa/:id", authMiddleware, mesa.obtenerMesa);

// Actualizar estado
router.patch("/mesa/:id/estado", authMiddleware, validator.validatorEstado, mesa.actualizarEstadoMesa);

// Regenerar codigo dinamico
router.patch("/mesa/:id/codigo", authMiddleware, validator.validatorCodigoDinamico, mesa.regenerarCodigoDinamico);

// Validar codigo dinamico
router.post("/mesa/:id/codigo", authMiddleware, validator.validatorCodigoDinamico, mesa.validarCodigoDinamico);

export { router };