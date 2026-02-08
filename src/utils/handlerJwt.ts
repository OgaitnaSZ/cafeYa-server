import { usuario } from "@prisma/client";
import jwt from "jsonwebtoken";
const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error("JWT_SECRET no está definido en el archivo .env");
}

/**
*Pasar el objeto usuario
* @param {*} usuario
*/
export const tokenSign = async (id: string, nombre: string)=>{

    return await jwt.sign(
        {
            id: id,
            nombre: nombre
        },
        JWT_SECRET,
        {
            expiresIn: "12h"
        }
    )
}

/**
 * Pasar token de session
 * @param {*} tokenJwt
 * @returns
 */
export const verifyToken = async (tokenJwt: string): Promise<any> => {
    try {
        return jwt.verify(tokenJwt, JWT_SECRET as string);
    } catch (error) {
        return null;
    }
};