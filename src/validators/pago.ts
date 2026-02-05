import { check, param } from "express-validator";
import { Request, Response, NextFunction } from "express";
import { validateResults } from "../utils/handleValidator";
import { pago_medio_de_pago } from "@prisma/client";

export const validatorPago = [
  check("pedido_id")
    .isUUID().withMessage('El ID debe ser un UUID válido.'),

  check("medio_pago")
    .exists().withMessage("Medio de pago es requerido")
    .notEmpty().withMessage("Medio de pago no puede estar vacío")
    .isIn(Object.values(pago_medio_de_pago))
    .withMessage("Medio de pago no es válido"),

  (req: Request, res: Response, next: NextFunction) => validateResults(req, res, next)
];

export const validatorId = [
    param("id")
    .isUUID().withMessage('El ID debe ser un UUID válido.'),

  (req: Request, res: Response, next: NextFunction) => validateResults(req, res, next)
];