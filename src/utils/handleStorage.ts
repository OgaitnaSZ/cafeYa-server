import multer from 'multer';
import fs from 'fs';
import path from 'path';

const uploadPath = path.join(__dirname, '../uploads');

// Asegurarse de que la carpeta exista
if (!fs.existsSync(uploadPath)) {
  fs.mkdirSync(uploadPath, { recursive: true });
}

const storage = multer.diskStorage({
    destination: function(req, file, cb){
        const pathArchivo = `${__dirname}/../uploads`;
        cb(null, pathArchivo);
    },
    filename: function(req, file, cb){
        const ext = file.originalname.split(".").pop();

        const name = file.originalname
        .replace(/\.[^/.]+$/, "") // quitar extensión
        .normalize("NFD")         // normalizar acentos
        .replace(/[\u0300-\u036f]/g, "") // eliminar diacríticos
        .replace(/[^a-zA-Z0-9\s]/g, "") // quitar caracteres especiales
        .replace(/\s+/g, "-");    // espacios por guiones

        const filename = `${name}-${Date.now()}.${ext}`;
        
        cb(null, filename)
    }
});

export const uploadMiddleware = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: (req, file, cb) => {
    // Solo permitir imágenes
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Solo se permiten archivos de tipo imagen'));
    }
    cb(null, true);
  },
}).single('foto')