import { check, param } from "express-validator";
import { Request, Response, NextFunction } from "express";
import { validateResults } from "../utils/handleValidator";

export const validatorCrearCliente = [
  check("nombre")
    .exists().withMessage("El nombre es requerido")
    .notEmpty().withMessage("El nombre no puede estar vacío")
    .isLength({ max: 30 }).withMessage("El nombre debe tener como máximo 30 caracteres"),

  check("email")
    .optional()
    .isEmail().withMessage("El email no es válido")
    .isLength({ max: 30 }).withMessage("El email debe tener como máximo 30 caracteres"),

  check("telefono")
    .optional()
    .isLength({ max: 30 }).withMessage("El telefono debe tener como máximo 30 caracteres"),

  (req: Request, res: Response, next: NextFunction) => validateResults(req, res, next)
];

export const validatorModificarCliente = [
  check("cliente_id")
    .isInt({ gt: 0 })
    .withMessage("El ID debe ser un número entero positivo"),

  check("nombre")
    .exists().withMessage("El nombre es requerido")
    .notEmpty().withMessage("El nombre no puede estar vacío")
    .isLength({ max: 30 }).withMessage("El nombre debe tener como máximo 30 caracteres"),

  check("email")
    .exists().withMessage("El email es requerido")
    .notEmpty().withMessage("El email no puede estar vacío")
    .isEmail().withMessage("El email no es válido")
    .isLength({ max: 30 }).withMessage("El email debe tener como máximo 30 caracteres"),

  check("telefono")
    .exists().withMessage("El telefono es requerido")
    .notEmpty().withMessage("El telefono no puede estar vacío")
    .isLength({ max: 30 }).withMessage("El telefono debe tener como máximo 30 caracteres"),

  (req: Request, res: Response, next: NextFunction) => validateResults(req, res, next)
];

export const validatorId = [
  param("id")
    .isInt({ gt: 0 })
    .withMessage("El ID debe ser un número entero positivo"),
];