import { check } from "express-validator";
import { Request, Response, NextFunction } from "express";
import { validateResults } from "../utils/handleValidator";

export const validatorNuevoPedido = [
  check("nombreCliente")
    .exists().withMessage("El nombre es requerido")
    .notEmpty().withMessage("El nombre no puede estar vacío"),

  check("numeroMesa")
    .exists().withMessage("El numero de mesa es requerido")
    .notEmpty().withMessage("El numero de mesa no puede estar vacío"),

  (req: Request, res: Response, next: NextFunction) => validateResults(req, res, next)
];

export const validatorAgregarProductos = [
  check("id")
    .exists().withMessage("El id es requerido")
    .notEmpty().withMessage("El id no puede estar vacío"),

  check("productos")
    .exists().withMessage("Productos es requerido")
    .notEmpty().withMessage("Productos no puede estar vacío"),

  (req: Request, res: Response, next: NextFunction) => validateResults(req, res, next)
];

export const validatorAgregarNota = [
  check("id")
    .exists().withMessage("El id es requerido")
    .notEmpty().withMessage("El id no puede estar vacío"),

  check("nota")
    .exists().withMessage("Nota es requerido")
    .notEmpty().withMessage("Nota no puede estar vacío"),

  (req: Request, res: Response, next: NextFunction) => validateResults(req, res, next)
];