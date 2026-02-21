import { check, param } from "express-validator";
import { Request, Response, NextFunction } from "express";
import { validateResults } from "../utils/handleValidator";
import { mesa_estado, pedido_estado } from "@prisma/client";

export const validatorCrearUsuario = [
  check("nombre")
    .exists().withMessage("El nombre es requerido")
    .notEmpty().withMessage("El nombre no puede estar vacío")
    .isLength({ max: 30 }).withMessage("El nombre debe tener como máximo 30 caracteres"),

  check("email")
    .exists().withMessage("El email es requerido")
    .notEmpty().withMessage("El email no puede estar vacío")
    .isEmail().withMessage("El email no es válido")
    .isLength({ max: 30 }).withMessage("El email debe tener como máximo 30 caracteres"),

  check("password")
    .exists().withMessage("Password requerido")
    .notEmpty().withMessage("Password no puede estar vacío")
    .isLength({ min: 5, max: 20 }).withMessage("Password debe tener entre 5 y 20 caracteres"),

  check("rol")
    .exists().withMessage("El rol es requerido")
    .notEmpty().withMessage("El rol no puede estar vacío"),

  (req: Request, res: Response, next: NextFunction) => validateResults(req, res, next)
];

export const validatorActualizarUsuario = [
  check("id")
    .isUUID().withMessage('El ID debe ser un UUID válido.')
    .exists().withMessage("El id es requerido")
    .notEmpty().withMessage("El id no puede estar vacío"),

  check("nombre")
    .exists().withMessage("El nombre es requerido")
    .notEmpty().withMessage("El nombre no puede estar vacío")
    .isLength({ max: 30 }).withMessage("El nombre debe tener como máximo 30 caracteres"),

  check("email")
    .exists().withMessage("El email es requerido")
    .notEmpty().withMessage("El email no puede estar vacío")
    .isEmail().withMessage("El email no es válido")
    .isLength({ max: 30 }).withMessage("El email debe tener como máximo 30 caracteres"),

  check("password")
    .exists().withMessage("Password requerido")
    .notEmpty().withMessage("Password no puede estar vacío")
    .isLength({ min: 5, max: 20 }).withMessage("Password debe tener entre 5 y 20 caracteres"),

  check("rol")
    .exists().withMessage("El rol es requerido")
    .notEmpty().withMessage("El rol no puede estar vacío"),

  (req: Request, res: Response, next: NextFunction) => validateResults(req, res, next)
];

export const validatorCrearMesa = [
  check("numero")
    .exists().withMessage("El nombre es requerido")
    .notEmpty().withMessage("El nombre no puede estar vacío")
    .isInt({ min: 0, max:30 }).withMessage("El valor debe ser entero positivo entre 0 y 30"),

  (req: Request, res: Response, next: NextFunction) => validateResults(req, res, next)
];

export const validatorEditarMesa = [
  check("mesa_id")
    .isUUID().withMessage('El ID debe ser un UUID válido.')
    .exists().withMessage("El id es requerido")
    .notEmpty().withMessage("El id no puede estar vacío"),

  check("numero")
    .exists().withMessage("El nombre es requerido")
    .notEmpty().withMessage("El nombre no puede estar vacío")
    .isInt({ min: 0, max:30 }).withMessage("El valor debe ser entero positivo entre 0 y 30"),

  check("estado")
    .exists().withMessage("El estado es requerido")
    .isIn(Object.values(mesa_estado))
    .withMessage("El estado no es válido"),
    
  (req: Request, res: Response, next: NextFunction) => validateResults(req, res, next)
];

export const validatorEstadoPedido = [
  check("pedido_id")
    .exists().withMessage("Id de pedido es requerido")
    .notEmpty().withMessage("Id de pedido no puede estar vacío")
    .isUUID(),

  check("estado")
    .exists().withMessage("El estado es requerido")
    .notEmpty().withMessage("El estado no puede estar vacío")
    .isIn(Object.values(pedido_estado)),

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

  check("categoria_id")
    .exists().withMessage("La categoria es requerida")
    .notEmpty().withMessage("La categoria no puede estar vacía")
    .isLength({ max: 30 }).withMessage("La categoria debe tener como máximo 30 caracteres"),

  check("precio_unitario")
    .exists().withMessage("El precio es requerido")
    .notEmpty().withMessage("El precio no puede estar vacío")
    .isFloat(),

  (req: Request, res: Response, next: NextFunction) => validateResults(req, res, next)
];

export const validatorActualizarProducto = [
check("producto_id")
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

  check("categoria_id")
    .exists().withMessage("La categoria es requerida")
    .notEmpty().withMessage("La categoria no puede estar vacía")
    .isLength({ max: 30 }).withMessage("La categoria debe tener como máximo 30 caracteres"),

  check("precio_unitario")
    .exists().withMessage("El precio es requerido")
    .notEmpty().withMessage("El precio no puede estar vacío")
    .isFloat(),

  (req: Request, res: Response, next: NextFunction) => validateResults(req, res, next)
];

export const validatorCrearCategoria = [
  check("nombre")
    .exists().withMessage("El nombre es requerido")
    .notEmpty().withMessage("El nombre no puede estar vacío")
    .isLength({ max: 30 }).withMessage("El nombre debe tener como máximo 30 caracteres"),

  check("emoji")
    .exists().withMessage("El emoji es requerido")
    .notEmpty().withMessage("El emoji no puede estar vacío")
    .isLength({ max: 2 }).withMessage("El emoji debe tener como máximo 2 caracteres"),

  (req: Request, res: Response, next: NextFunction) => validateResults(req, res, next)
]

export const validatorActualizarCategoria = [
  check("nombre")
    .exists().withMessage("El nombre es requerido")
    .notEmpty().withMessage("El nombre no puede estar vacío")
    .isLength({ max: 30 }).withMessage("El nombre debe tener como máximo 30 caracteres"),

  check("emoji")
    .exists().withMessage("El emoji es requerido")
    .notEmpty().withMessage("El emoji no puede estar vacío")
    .isLength({ max: 2 }).withMessage("El emoji debe tener como máximo 2 caracteres"),

  check("categoria_id")
    .exists().withMessage("El ID es obligatorio")
    .notEmpty().withMessage("El ID no puede estar vacío")
    .isInt({ min: 0}).withMessage("El valor debe ser entero positivo"),

  (req: Request, res: Response, next: NextFunction) => validateResults(req, res, next)
]

export const validatorId = [
    param("id")
    .isUUID().withMessage('El ID debe ser un UUID válido.'),

  (req: Request, res: Response, next: NextFunction) => validateResults(req, res, next)
];

export const validatorIdInt = [
    param("id")
    .exists().withMessage("El ID es obligatorio")
    .notEmpty().withMessage("El ID no puede estar vacío")
    .isInt({ min: 0}).withMessage("El valor debe ser entero positivo"),

  (req: Request, res: Response, next: NextFunction) => validateResults(req, res, next)
];

export const validatorIdFoto = [
  check("producto_id")
    .exists().withMessage("El ID del producto es requerido")
    .notEmpty().withMessage("El ID del producto no puede estar vacío")
    .isUUID().withMessage('El ID del producto debe ser un UUID válido.'),

  (req: Request, res: Response, next: NextFunction) => validateResults(req, res, next)
];