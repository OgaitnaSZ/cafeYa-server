import './global-types';
import express from "express";
import cors, { CorsOptions } from "cors";
import dotenv from 'dotenv';
dotenv.config();
import routes from "./routes/index";
import path from 'path';
import { createServer } from "http";
import { Server } from "socket.io";
import { initializeSocket } from "./sockets/socketManager";

const app = express();
const httpServer = createServer(app);

// Configurar Socket.IO con CORS
const io = new Server(httpServer, {
  cors: {
    origin: [
      process.env.FRONTEND_ADMIN_URL || "http://localhost:4200",
      process.env.FRONTEND_CLIENT_URL || 'http://localhost:4201',
    ],
    methods: ["GET", "POST"],
    credentials: true
  }
});
initializeSocket();

app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const allowedOrigins: string[] = [
  process.env.FRONTEND_ADMIN_URL || 'http://localhost:4200',
  process.env.FRONTEND_CLIENT_URL || 'http://localhost:4201',
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

// Rutas
app.use("/api", routes);

export { io };

const port = process.env.PORT || 4000;
const NODE_ENV = process.env.NODE_ENV;
if(NODE_ENV !== 'test' && NODE_ENV !== 'prod') httpServer.listen(port, () => {});

export default app;