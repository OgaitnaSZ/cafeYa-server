import { check } from "express-validator";
import { Request, Response, NextFunction } from "express";
import { validateResults } from "../utils/handleValidator";

export const validatorNuevoPedido = [
  check("cliente_id")
    .isInt({ gt: 0 })
    .withMessage("El ID debe ser un número entero positivo"),
  
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

  check("idPedidoPadre")
    .optional()
    .isUUID(),

  (req: Request, res: Response, next: NextFunction) => validateResults(req, res, next)
];