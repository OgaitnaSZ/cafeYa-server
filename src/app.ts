import './global-types';
import express from "express";
import cors from "cors";
import dotenv from 'dotenv';
dotenv.config();
import routes from "./routes/index";
import path from 'path';
import { Request, Response } from "express";

const app = express();

app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const corsOptions = {
  origin: process.env.FRONTEND_URL || '*',
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

app.use("/api", routes);|

const port = process.env.PORT || 4001;
const NODE_ENV = process.env.NODE_ENV;
if(NODE_ENV !== 'test' && NODE_ENV !== 'production') app.listen(port, ()=>{
    console.log("Running in: ", process.env.PUBLIC_URL);
});

export default app;