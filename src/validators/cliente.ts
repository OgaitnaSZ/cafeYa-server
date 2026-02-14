import { check, param } from "express-validator";
import { Request, Response, NextFunction } from "express";
import { validateResults } from "../utils/handleValidator";

export const validatorCrearCliente = [
  check("nombre")
    .exists().withMessage("El nombre es requerido")
    .notEmpty().withMessage("El nombre no puede estar vacío")
    .isLength({ max: 30 }).withMessage("El nombre debe tener como máximo 30 caracteres"),

  check("email")
    .optional({ checkFalsy: true })
    .isEmail().withMessage("El email no es válido")
    .isLength({ max: 30 }).withMessage("El email debe tener como máximo 30 caracteres"),

  check("telefono")
    .optional({ checkFalsy: true })
    .isLength({ max: 30 }).withMessage("El telefono debe tener como máximo 30 caracteres"),

  (req: Request, res: Response, next: NextFunction) => validateResults(req, res, next)
];

export const validatorModificarCliente = [
  check("cliente_id")
    .exists().withMessage("El ID del producto es requerido")
    .notEmpty().withMessage("El ID del producto no puede estar vacío")
    .isUUID().withMessage('El ID del producto debe ser un UUID válido.'),

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

  check("duracion_minutos")
    .exists().withMessage("La duracion es requerida")
    .notEmpty().withMessage("La duracion no puede estar vacía")
    .isInt({ min: 15, max: 300 }),

  (req: Request, res: Response, next: NextFunction) => validateResults(req, res, next)
];

export const validatorId = [
    param("id")
    .isUUID().withMessage('El ID debe ser un UUID válido.'),

  (req: Request, res: Response, next: NextFunction) => validateResults(req, res, next)
];
