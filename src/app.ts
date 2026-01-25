import './global-types';
import express from "express";
import cors from "cors";
import dotenv from 'dotenv';
dotenv.config();
import routes from "./routes/index";

const app = express();

app.use(express.json());
app.use(cors());

// Importacion dinamica de rutas
app.use("/api", routes);

const port = process.env.PORT || 4001;
const NODE_ENV = process.env.NODE_ENV;
if(NODE_ENV !== 'test') app.listen(port, ()=>{
    console.log("Running in: ", process.env.PUBLIC_URL);
});

export default app;