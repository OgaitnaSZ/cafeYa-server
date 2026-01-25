import express from "express";
const router = express.Router();
import * as mesa from "../controllers/mesa";
import * as validator from "../validators/mesa";
import { authMiddleware } from "../middleware/session";

// Validar codigo mesa
router.post("/validar", authMiddleware, validator.validatorCodigoDinamico, mesa.validarCodigoDinamico);

export { router };