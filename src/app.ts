import './global-types';
import express from "express";
import cors, { CorsOptions } from "cors";
import dotenv from 'dotenv';
dotenv.config();
import routes from "./routes/index";
import path from 'path';
import { Request, Response } from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import { initializeSocket } from "./sockets/socketManager";

const app = express();
const httpServer = createServer(app);

// Configurar Socket.IO con CORS
const io = new Server(httpServer, {
  cors: {
    origin: [
      process.env.FRONTEND_URL || "http://localhost:4200",
      "http://localhost:4201"
    ],
    methods: ["GET", "POST"],
    credentials: true
  }
});
initializeSocket();

app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const allowedOrigins: string[] = [
  process.env.FRONTEND_URL || '',
  'http://localhost:4200', // client
  'http://localhost:4201'  // admin
];

const corsOptions: CorsOptions = {
  origin: (origin, callback) => {
    if (!origin) {
      return callback(null, true);
    }

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};
app.use(cors(corsOptions));

// Importacion dinamica de rutas
app.use("/api", routes);
// Ruta de prueba
app.get('/test', (req: Request, res:Response) => {
  res.json({ message: 'Server is alive!' });
});

app.use("/api", routes);

export { io };

const port = process.env.PORT || 4001;
const NODE_ENV = process.env.NODE_ENV;
if(NODE_ENV !== 'test' && NODE_ENV !== 'production') httpServer.listen(port, () => {});

export default app;