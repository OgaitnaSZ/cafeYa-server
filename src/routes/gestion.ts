import express from "express";
const router = express.Router();
import * as gestion from "../controllers/gestion";
import * as validator from "../validators/gestion";
import { authMiddleware } from "../middleware/session";
import { checkRol } from "../middleware/rol";
import { usuario_rol } from "@prisma/client";
import { uploadMiddleware } from "../utils/handleStorage";

router.use(authMiddleware); // Middleware para todas las rutas

// Helpers de roles
const adminOnly = checkRol([usuario_rol.admin]);
const encargadoOrAdmin = checkRol([
  usuario_rol.admin,
  usuario_rol.encargado
]);
const cocinaOrAdmin = checkRol([
  usuario_rol.admin,
  usuario_rol.cocina
]);


/* --- ENCARGADO --- */
// Obtener Mesas
router.get("/mesas", encargadoOrAdmin, gestion.obtenerMesas);

// Actualizar estado mesas
router.patch("/mesas/estado", encargadoOrAdmin, validator.validatorEstadoMesa, gestion.actualizarEstadoMesa);

// Actualizar codigo mesa
router.patch("/mesas/codigo", encargadoOrAdmin, validator.validatorCodigoMesa, gestion.actualizarCodigoMesa);

// Actualizar Estado Pedido
router.patch("/pedido/estado", validator.validatorEstadoPedido, gestion.actualizarEstadoPedido);

/* --- COCINA --- */
// Obtener Pedidos Activos
router.get("/pedidos/activos", cocinaOrAdmin, gestion.obtenerPedidosActivos);

/* --- SOLO ADMIN --- */
// Obtener Usuarios
router.get("/usuario/usuarios", adminOnly, gestion.obteneUsuarios);

// Crear Usuario
router.post("/usuario/crear", adminOnly, validator.validatorCrearUsuario, gestion.crearUsuario);

// Actualizar Usuario
router.put("/usuario", adminOnly, validator.validatorActualizarUsuario, gestion.actualiarUsuario);

// Cambiar Estado usuario
router.patch("usuario", adminOnly, validator.validatorId, gestion.toggleEstadoUsuario);

// Eliminar Usuario
router.delete("usuario/eliminar/:id", validator.validatorId, gestion.eliminarUsuario);

//Obtener Pedidos Por Mesa
router.get("/mesa/:id/pedidos", adminOnly, validator.validatorId, gestion.obtenerPedidosPorMesa);

// Crear productos
router.post("/producto/crear", adminOnly, validator.validatorCrearProducto, gestion.crearProducto);

// Actualizar producto
router.put("/producto", adminOnly, validator.validatorActualizarProducto, gestion.actualiarProducto);

// Subir foto producto
router.post("/producto/foto", uploadMiddleware, validator.validatorIdFoto, gestion.subirFoto);

// Obtener productos
router.get("/productos", adminOnly, gestion.obtenerProductos);

// Eliminar producto


// Obtener calificaciones
router.get("/calificaciones", adminOnly, gestion.obtenerCalificaciones);


export { router };