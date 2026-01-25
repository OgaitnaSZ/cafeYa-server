import { check, param } from "express-validator";
import { Request, Response, NextFunction } from "express";
import { validateResults } from "../utils/handleValidator";

export const validatorEstadoMesa = [
  check("idMesa")
    .exists().withMessage("Id de mesa es requerido")
    .notEmpty().withMessage("Id de mesa no puede estar vacío")
    .isUUID(),

  check("estado")
    .exists().withMessage("El estado es requerido")
    .notEmpty().withMessage("El estado no puede estar vacío"),

  (req: Request, res: Response, next: NextFunction) => validateResults(req, res, next)
];

export const validatorCodigoMesa = [
  check("idMesa")
    .exists().withMessage("Id de mesa es requerido")
    .notEmpty().withMessage("Id de mesa no puede estar vacío")
    .isUUID(),

  check("codigo")
    .exists().withMessage("El codigo es requerido")
    .notEmpty().withMessage("El codigo no puede estar vacío"),

  (req: Request, res: Response, next: NextFunction) => validateResults(req, res, next)
];

export const validatorEstadoPedido = [
  check("idPedido")
    .exists().withMessage("Id de pedido es requerido")
    .notEmpty().withMessage("Id de pedido no puede estar vacío")
    .isUUID(),

  check("estado")
    .exists().withMessage("El estado es requerido")
    .notEmpty().withMessage("El estado no puede estar vacío"),

  (req: Request, res: Response, next: NextFunction) => validateResults(req, res, next)
];

export const validatorCrearProducto = [
  check("nombre")
    .exists().withMessage("El nombre es requerido")
    .notEmpty().withMessage("El nombre no puede estar vacío")
    .isLength({ max: 30 }).withMessage("El nombre debe tener como máximo 30 caracteres"),

  check("descripcion")
    .exists().withMessage("La descripcion es requerida")
    .notEmpty().withMessage("La descripcion no puede estar vacía")
    .isLength({ max: 100 }).withMessage("La descripcion debe tener como máximo 100 caracteres"),

  check("imagen_url")
    .exists().withMessage("La url es requerida")
    .notEmpty().withMessage("La url no puede estar vacía")
    .isLength({ max: 100 }).withMessage("La url debe tener como máximo 100 caracteres"),

  check("categoria")
    .exists().withMessage("La categoria es requerida")
    .notEmpty().withMessage("La categoria no puede estar vacía")
    .isLength({ max: 30 }).withMessage("La categoria debe tener como máximo 30 caracteres"),

  check("precio")
    .exists().withMessage("El precio es requerido")
    .notEmpty().withMessage("El precio no puede estar vacío")
    .isFloat(),

  (req: Request, res: Response, next: NextFunction) => validateResults(req, res, next)
];

export const validatorActualizarProducto = [
check("idProducto")
    .exists().withMessage("Id de producto es requerido")
    .notEmpty().withMessage("Id de producto no puede estar vacío")
    .isUUID(),

  check("nombre")
    .exists().withMessage("El nombre es requerido")
    .notEmpty().withMessage("El nombre no puede estar vacío")
    .isLength({ max: 30 }).withMessage("El nombre debe tener como máximo 30 caracteres"),

  check("descripcion")
    .exists().withMessage("La descripcion es requerida")
    .notEmpty().withMessage("La descripcion no puede estar vacía")
    .isLength({ max: 100 }).withMessage("La descripcion debe tener como máximo 100 caracteres"),

  check("imagen_url")
    .exists().withMessage("La url es requerida")
    .notEmpty().withMessage("La url no puede estar vacía")
    .isLength({ max: 100 }).withMessage("La url debe tener como máximo 100 caracteres"),

  check("categoria")
    .exists().withMessage("La categoria es requerida")
    .notEmpty().withMessage("La categoria no puede estar vacía")
    .isLength({ max: 30 }).withMessage("La categoria debe tener como máximo 30 caracteres"),

  check("precio")
    .exists().withMessage("El precio es requerido")
    .notEmpty().withMessage("El precio no puede estar vacío")
    .isFloat(),

  (req: Request, res: Response, next: NextFunction) => validateResults(req, res, next)
];

export const validatorId = [
    param("id")
    .isUUID().withMessage('El ID debe ser un UUID válido.'),

  (req: Request, res: Response, next: NextFunction) => validateResults(req, res, next)
];