import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { matchedData } from "express-validator";
import { handleHttpError } from "../utils/handleError";
import { mesa_estado } from "@prisma/client";
const prisma = new PrismaClient()

// Validar codigo mesa
export async function validarCodigoDinamico(req: Request, res: Response) {
    try {
        const dataMesa = matchedData(req);
    
        const existingMesa = await prisma.mesa.findUnique({
            where: { mesa_id: dataMesa.numero }
        });
          
        if(!existingMesa) return handleHttpError(res, "MESA NO EXISTE", 404)

        if(existingMesa.codigo_dinamico !== dataMesa.codigo) return handleHttpError(res, "CODIGO INCORRECTO", 404)

        if(existingMesa.estado === mesa_estado.Ocupada) return handleHttpError(res, "MESA OCUPADA", 404)

        return res.status(200).json({ ok: true });
    } catch (err) {
      handleHttpError(res, "No se pudo actualizar el cliente", 500)
      return;
    }
}