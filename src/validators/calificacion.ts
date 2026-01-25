import { check, param } from "express-validator";
import { Request, Response, NextFunction } from "express";
import { validateResults } from "../utils/handleValidator";

export const validatorCalificacion = [
  check("pedido_id")
    .exists().withMessage("Id de pedido es requerido")
    .notEmpty().withMessage("Id de pedido no puede estar vacío")
    .isUUID(),

  check("puntuacion")
    .exists().withMessage("La cantidad es obligatoria")
    .notEmpty().withMessage("La cantidad no puede estar vacía")
    .isInt({ min: 1, max: 5 }).withMessage("El valor debe estar entre 1 y 5"),
    
  check("resena")
    .exists().withMessage("La reseña es requerida")
    .notEmpty().withMessage("La reseña no puede estar vacía")
    .isLength({ max: 100 }).withMessage("El email debe tener como máximo 100 caracteres"),

  check("nombre_cliente")
    .exists().withMessage("El nombre es requerido")
    .notEmpty().withMessage("El nombre no puede estar vacío")
    .isLength({ max: 30 }).withMessage("El nombre debe tener como máximo 30 caracteres"),

  (req: Request, res: Response, next: NextFunction) => validateResults(req, res, next)
];

export const validatorId = [
    param("id")
    .isUUID().withMessage('El ID debe ser un UUID válido.'),

  (req: Request, res: Response, next: NextFunction) => validateResults(req, res, next)
];