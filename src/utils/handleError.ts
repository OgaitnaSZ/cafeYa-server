import { Response } from "express";

const handleHttpError = (res: Response, message = 'Algo sucedió', code = 403) => {
    return res.status(code).json({ 
        success: false,
        error: message,
        statusCode: code
    });
}

export { handleHttpError };