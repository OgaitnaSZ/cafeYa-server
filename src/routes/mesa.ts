import express from "express";
const router = express.Router();
import * as mesa from "../controllers/mesa";
import * as validator from "../validators/mesa";

// Validar Mesa
router.get("/mesa/:id", validator.validatorId, mesa.ValidarMesa);

// Validar codigo mesa
router.post("/validar", validator.validatorCodigoDinamico, mesa.validarCodigoDinamico);

// Liberar mesa
router.get("/mesa/:id/liberar", validator.validatorId, mesa.liberarMesa);

export { router };