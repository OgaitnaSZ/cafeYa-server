import express from "express";
const router = express.Router();
import * as calificacion from "../controllers/calificacion";
import * as validator from "../validators/calificacion";
import { authMiddleware } from "../middleware/session";

// Crear calificacion
router.post("/calificacion", authMiddleware, validator.validatorCrearCliente, calificacion.crearCalificacion);

// Obtener calificacion
router.get("/calificacion/:id", authMiddleware, validator.validatorId, calificacion.obtenerCalificacion);

// Obtener calificaciones
router.get("/calificaciones", authMiddleware, calificacion.obtenerCalificaciones);

export { router };