import { Response } from "express";

interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  error?: string;
  code?: string;
  statusCode: number;
  data?: T;
}

export const sendSuccess = <T>(
  res: Response,
  data: T,
  message: string = "Success",
  statusCode: number = 200
): Response => {
  return res.status(statusCode).json({
    success: true,
    message,
    statusCode,
    data,
  } as ApiResponse<T>);
};

export const sendError = (
  res: Response,
  error: string,
  statusCode: number = 400,
  code: string = "ERROR"
): Response => {
  return res.status(statusCode).json({
    success: false,
    error,
    code,
    statusCode,
  } as ApiResponse);
};
