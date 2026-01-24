import { validationResult } from "express-validator";
import { Request, Response, NextFunction } from "express";

const validateResults = (req:Request, res:Response, next:NextFunction) => {
    try{
        validationResult(req).throw();
        return next();  //Continua hacia el controlador
    }catch(error: any){
        res.status(403);
        res.send({errors: error.array()});
    }
}

export { validateResults }