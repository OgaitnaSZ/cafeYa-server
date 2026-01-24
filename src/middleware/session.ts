import { Request, Response, NextFunction } from "express";
import { verifyToken } from "../utils/handlerJwt";
import { handleHttpError } from "../utils/handleError";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient()

export const authMiddleware = async (req:Request, res:Response, next:NextFunction) => {
    try{
        if(!req.headers.authorization){
            return handleHttpError(res, "NOT TOKEN", 401);
        }
        
        const token = req.headers.authorization.split(' ').pop();
        const dataToken = await verifyToken(String(token));

        if(!dataToken){
            return handleHttpError(res, "NOT PAYLOAD DATA", 401);
        }

        const user = await prisma.usuario.findUnique({
            where:{
                idUsuario: dataToken.idUsuario
            }
        })

        if (!user) return handleHttpError(res, "USUARIO NO ENCONTRADO", 404);
        
        req.user = user

        return next()

    }catch(error){
        return handleHttpError(res, "NOT SESSION", 401)
    }
}