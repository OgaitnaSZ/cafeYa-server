import { Request, Response, NextFunction } from "express";
import { handleHttpError } from "../utils/handleError";
import { usuario_rol } from "@prisma/client";

export const checkRol = (allowedRoles: usuario_rol[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = req.user;

      if (!user || !user.rol) return handleHttpError(res, "USER_NOT_FOUND_OR_INVALID", 401);

      const userRole: usuario_rol = user.rol;

      if (!allowedRoles.includes(userRole)) return handleHttpError(res, "USER_NOT_PERMISSIONS", 403);

      next();
    } catch (e) {
      return handleHttpError(res, "ERROR_PERMISSIONS", 403);
    }
  };
};
