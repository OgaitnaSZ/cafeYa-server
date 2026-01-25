import express from "express";
const router = express.Router();
import * as calificacion from "../controllers/calificacion";
import * as validator from "../validators/calificacion";

// Crear calificacion
router.post("/calificacion", validator.validatorCalificacion, calificacion.crearCalificacion);

// Obtener calificacion
router.get("/calificacion/:id", validator.validatorId, calificacion.obtenerCalificacion);

// Obtener calificaciones
router.get("/calificaciones", calificacion.obtenerCalificaciones);

export { router };