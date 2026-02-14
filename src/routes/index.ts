import express, { Router } from "express";

import { router as auth } from "./auth";
import { router as calificacion } from "./calificacion";
import { router as cliente } from "./cliente";
import { router as gestion } from "./gestion";
import { router as mesa } from "./mesa";
import { router as pago } from "./pago";
import { router as pedido } from "./pedido";
import { router as producto } from "./producto";

const router: Router = express.Router();

router.use("/auth", auth);
router.use("/calificacion", calificacion);
router.use("/cliente", cliente);
router.use("/gestion", gestion);
router.use("/mesa", mesa);
router.use("/pago", pago);
router.use("/pedido", pedido);
router.use("/producto", producto);

export default router;
