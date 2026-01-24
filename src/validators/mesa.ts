import { check } from "express-validator";
import { Request, Response, NextFunction } from "express";
import { validateResults } from "../utils/handleValidator";

export const validatorCodigoDinamico = [
  check("id")
    .exists().withMessage("El id es requerido")
    .notEmpty().withMessage("El id no puede estar vacío"),

  check("codigo")
    .exists().withMessage("El codigo es requerido")
    .notEmpty().withMessage("El codigo no puede estar vacío"),

  (req: Request, res: Response, next: NextFunction) => validateResults(req, res, next)
];

export const validatorEstado = [
  check("id")
    .exists().withMessage("El id es requerido")
    .notEmpty().withMessage("El id no puede estar vacío"),

  check("estado")
    .exists().withMessage("El estado es requerido")
    .notEmpty().withMessage("El estado no puede estar vacío"),

  (req: Request, res: Response, next: NextFunction) => validateResults(req, res, next)
];