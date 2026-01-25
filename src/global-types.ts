import { usuario } from "@prisma/client";

declare global {
  namespace Express {
    interface Request {
      user: usuario;
    }
  }
}

export {};
