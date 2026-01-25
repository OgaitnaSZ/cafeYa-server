import { usuario } from "./generated/prisma/client";

declare global {
  namespace Express {
    interface Request {
      user: usuario;
    }
  }
}

export {};
