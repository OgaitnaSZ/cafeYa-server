import { Request, Response, NextFunction } from "express";
import { handleHttpError } from "../utils/handleError";
import { usuario_rol } from "@prisma/client";

export const checkRol = (allowedRoles: usuario_rol[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = req.user;

      if (!user || !user.rol) return handleHttpError(res, "Usuario no válido.", 401);

      const userRole: usuario_rol = user.rol;

      if (!allowedRoles.includes(userRole)) return handleHttpError(res, "Permisos insuficientes", 403);

      next();
    } catch (e) {
      return handleHttpError(res, "Error al validar permisos", 403);
    }
  };
};
