import express from "express";
const router = express.Router();
import * as mesa from "../controllers/mesa";
import * as validator from "../validators/mesa";

// Validar codigo mesa
router.post("/validar", validator.validatorCodigoDinamico, mesa.validarCodigoDinamico);

export { router };