import { usuario } from "./generated/prisma/client";

// Extiende el namespace de Express
declare global {
  namespace Express {
    interface Request {
      user: usuario;
    }
  }
}