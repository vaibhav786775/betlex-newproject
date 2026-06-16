import { Router } from "express";
import * as authController from "../controllers/auth.controller";
import authMiddleware from "../middleware/auth.middleware";
import { authLimiter } from "../middleware/rate-limit.middleware";

const authRouter = Router();

authRouter.post("/register", authLimiter, authController.register);
authRouter.post("/login", authLimiter, authController.login);
authRouter.get("/me", authMiddleware, authController.me);
authRouter.patch("/me", authMiddleware, authController.updateProfile);
authRouter.post("/refresh", authController.refresh);
authRouter.post("/logout", authController.logout);

export default authRouter;

