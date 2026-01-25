import express from "express";
const router = express.Router();
import * as auth from "../controllers/login";
import * as validator from "../validators/login";

// Login
router.post("/login", validator.validatorLogin, auth.login);

export { router };