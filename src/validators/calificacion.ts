import { check, param } from "express-validator";
import { Request, Response, NextFunction } from "express";
import { validateResults } from "../utils/handleValidator";

export const validatorCrearCliente = [
  check("idPedido")
    .exists().withMessage("Id de pedido es requerido")
    .notEmpty().withMessage("Id de pedido no puede estar vacío")
    .isUUID(),

  check("medioDePago")
    .exists().withMessage("Medio de pago es requerido")
    .notEmpty().withMessage("Medio de pago no puede estar vacío")
    .isEmail().withMessage("Medio de pago no es válido")
    .isLength({ max: 30 }).withMessage("Medio de pago debe tener como máximo 30 caracteres"),

  check("monto")
    .exists().withMessage("El telefono es requerido")
    .notEmpty().withMessage("El telefono no puede estar vacío")
    .isFloat(),

  check("iva")
    .exists().withMessage("El telefono es requerido")
    .notEmpty().withMessage("El telefono no puede estar vacío")
    .isFloat(),

  check("montoFinal")
    .exists().withMessage("El telefono es requerido")
    .notEmpty().withMessage("El telefono no puede estar vacío")
    .isFloat(),

  (req: Request, res: Response, next: NextFunction) => validateResults(req, res, next)
];

export const validatorId = [
    param("id")
    .isUUID().withMessage('El ID debe ser un UUID válido.'),

  (req: Request, res: Response, next: NextFunction) => validateResults(req, res, next)
];