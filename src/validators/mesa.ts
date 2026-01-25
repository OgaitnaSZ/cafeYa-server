import { check } from "express-validator";
import { Request, Response, NextFunction } from "express";
import { validateResults } from "../utils/handleValidator";

export const validatorCodigoDinamico = [
  check("numero")
    .exists().withMessage("El numero es requerido")
    .notEmpty().withMessage("El numero no puede estar vacío"),

  check("codigo")
    .exists().withMessage("El codigo es requerido")
    .notEmpty().withMessage("El codigo no puede estar vacío"),

  (req: Request, res: Response, next: NextFunction) => validateResults(req, res, next)
];