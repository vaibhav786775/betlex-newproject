import { Request, Response } from "express";
import { registerSchema } from "../validators/register.schema";
import { loginSchema } from "../validators/login.schema";
import * as authService from "../services/auth.service";
import { asyncHandler } from "../utils/async-handler";
import { sendSuccess } from "../utils/api-response";

export const register = asyncHandler(async (req: Request, res: Response) => {
  const body = registerSchema.parse(req.body);
  const user = await authService.register(body);
  sendSuccess(res, user, "User registered successfully", 201);
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const body = loginSchema.parse(req.body);
  const { accessToken, refreshToken, user } = await authService.login(body);

  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  sendSuccess(
    res,
    {
      accessToken,
      user,
    },
    "Login successful",
    200
  );
});

export const me = asyncHandler(async (req: any, res: Response) => {
  const userId = req.user!.id;
  const user = await authService.getMe(userId);
  sendSuccess(res, user, "Current user fetched", 200);
});

export const refresh = asyncHandler(async (req: Request, res: Response) => {
  const refreshToken = req.cookies?.refreshToken;
  const result = await authService.refresh(refreshToken);

  res.cookie("refreshToken", result.refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  sendSuccess(res, { accessToken: result.accessToken, user: result.user }, "Token refreshed", 200);
});

export const logout = asyncHandler(async (req: Request, res: Response) => {
  res.clearCookie("refreshToken", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
  });
  sendSuccess(res, null, "Logged out successfully", 200);
});
