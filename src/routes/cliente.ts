import express from "express";
const router = express.Router();
import * as cliente from "../controllers/cliente";
import * as validator from "../validators/cliente";
import { authMiddleware } from "../middleware/session";

// Crear cliente
router.post("/clientes", validator.validatorCrearCliente, cliente.crearCliente);

// Obtener cliente
router.get("/cliente/:id", authMiddleware, cliente.obtenerCliente);

// Modificar cliente
router.put("/modificar", authMiddleware, validator.validatorCrearCliente, cliente.modificarCliente);

// Eliminar cliente
router.put("/eliminar/:id", authMiddleware, validator.validatorCrearCliente, cliente.eliminarCliente);

export { router };