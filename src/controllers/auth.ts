import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { matchedData } from "express-validator";
import { compare, encrypt } from "../utils/handlePassword";
import { tokenSign } from "../utils/handlerJwt";
import { handleHttpError } from "../utils/handleError";
const prisma = new PrismaClient()

// Iniciar sesion
export async function login(req: Request, res: Response) {
  try {
    const dataLogin = matchedData(req);

    const existingUser = await prisma.usuario.findUnique({
      where: { email: dataLogin.email }
    });
    
    if(!existingUser){ return handleHttpError(res, "USUARIO NO EXISTE", 404) }
    
    const hashPassword = existingUser.password;
    const check = await compare(dataLogin.password, hashPassword);
    if(!check){ return handleHttpError(res, "PASSWORD INVALIDO", 400) }

    const token = await tokenSign(existingUser.id, existingUser.nombre);
    const { password, ...userWithoutPassword } = existingUser; // Eliminar password para la respuesta
    
    const data = {
      token,
      user: userWithoutPassword
    }
        
    res.status(200).send({data});
  } catch (error) {
    return handleHttpError(res, "Error al iniciar session", 500)
  }
}