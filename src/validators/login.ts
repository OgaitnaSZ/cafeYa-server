import { check } from "express-validator";
import { Request, Response, NextFunction } from "express";
import { validateResults } from "../utils/handleValidator";

export const validatorLogin = [
  check("email")
    .exists().withMessage("El email es requerido")
    .notEmpty().withMessage("El email no puede estar vacío")
    .isEmail().withMessage("El email no es válido")
    .isLength({ max: 30 }).withMessage("El email debe tener como máximo 30 caracteres"),

  check("password")
    .exists().withMessage("Password requerido")
    .notEmpty().withMessage("Password no puede estar vacío")
    .isLength({ min: 5, max: 20 }).withMessage("Password debe tener entre 5 y 20 caracteres"),

  (req: Request, res: Response, next: NextFunction) => validateResults(req, res, next)
];