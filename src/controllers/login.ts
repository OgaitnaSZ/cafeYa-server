import { Request, Response } from "express";
import { PrismaClient } from "../generated/prisma/client";
import { matchedData } from "express-validator";
import { compare } from "bcryptjs";
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
    
    if(!existingUser){
        handleHttpError(res, "USUARIO NO EXISTE", 404)
        return
    }
    
    const hashPassword = existingUser.password;
    const check = await compare(dataLogin.password, hashPassword);
    if(!check){
        handleHttpError(res, "PASSWORD INVALIDO", 400)
        return
    }

    const token = await tokenSign(existingUser);
    const { password, ...userWithoutPassword } = existingUser; // Eliminar password para la respuesta
    
    const data = {
      token,
      user: userWithoutPassword
    }
        
    res.status(200).send({data});
  } catch (error) {
      res.status(500)
      handleHttpError(res, "ERROR_LOGIN_USER")
      return;
  }
}