import express from "express";
const router = express.Router();
import * as cliente from "../controllers/cliente";
import * as validator from "../validators/cliente";

// Crear cliente
router.post("/crear", validator.validatorCrearCliente, cliente.crearCliente);

// Obtener cliente
router.get("/:id", validator.validatorId,cliente.obtenerCliente);

// Modificar cliente
router.put("/modificar", validator.validatorModificarCliente, cliente.modificarCliente);

export { router };