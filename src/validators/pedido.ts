import { check } from "express-validator";
import { Request, Response, NextFunction } from "express";
import { validateResults } from "../utils/handleValidator";

export const validatorNuevoPedido = [
  check("cliente_id")
    .isUUID().withMessage('El ID del cliente debe ser un UUID válido.'),
  
  check("cliente_nombre")
    .exists().withMessage("El nombre es requerido")
    .notEmpty().withMessage("El nombre no puede estar vacío"),

  check("mesa_id")
    .exists().withMessage("El numero de mesa es requerido")
    .notEmpty().withMessage("El numero de mesa no puede estar vacío"),

  check("productos")
    .exists().withMessage("Productos es requerido")
    .notEmpty().withMessage("Productos no puede estar vacío"),

  check("nota")
    .exists().withMessage("Nota es requerido")
    .notEmpty().withMessage("Nota no puede estar vacío"),

  check("pedido_padre_id")
    .optional()
    .isUUID(),

  (req: Request, res: Response, next: NextFunction) => validateResults(req, res, next)
];