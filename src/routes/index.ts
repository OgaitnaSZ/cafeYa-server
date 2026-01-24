import { readdirSync } from "fs";
import express, { Router } from "express";
import path from "path";

const router: Router = express.Router();
const PATH_ROUTES = __dirname;

// Detecta si está corriendo el código compilado o en ts-node
const isCompiled = path.extname(__filename) === ".js";

function removeExtension(fileName: string): string {
  return fileName.split(".").shift() as string;
}

function loadRouter(file: string): void {
  const name = removeExtension(file);
  if (name !== "index") {
    const routerModule = require(path.join(PATH_ROUTES, file));
    router.use(`/${name}`, routerModule.router);
  }
}

readdirSync(PATH_ROUTES)
  // En dev usa .ts, en prod usa .js
  .filter((file) => {
    const ext = path.extname(file);
    return isCompiled ? ext === ".js" : ext === ".ts";
  })
  .forEach((file) => loadRouter(file));

export default router;
