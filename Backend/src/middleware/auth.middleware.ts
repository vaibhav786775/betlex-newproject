import { Request, Response, NextFunction } from "express";
import { verifyAccessToken } from "../utils/jwt";
import * as userRepository from "../repositories/user.repository";
import { AppError } from "../utils/app-error";

export const authMiddleware = async (
	req: Request & { user?: any },
	res: Response,
	next: NextFunction
) => {
	const authHeader = req.headers.authorization;
	if (!authHeader || !authHeader.startsWith("Bearer ")) {
		return next(new AppError("Unauthorized", 401, "UNAUTHORIZED"));
	}
	const token = authHeader.split(" ")[1];
	try {
		const payload = verifyAccessToken(token);
		const userId = payload.userId;
		const user = await userRepository.findUserById(userId);
		if (!user) {
			return next(new AppError("Unauthorized", 401, "UNAUTHORIZED"));
		}
		const { passwordHash, ...userSafe } = user as any;
		req.user = userSafe;
		return next();
	} catch (err) {
		return next(new AppError("Unauthorized", 401, "UNAUTHORIZED"));
	}
};

export default authMiddleware;
