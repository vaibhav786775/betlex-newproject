import { Request, Response, NextFunction } from "express";
import { AppError } from "../utils/app-error";
import { sendError } from "../utils/api-response";
import { ZodError } from "zod";

/**
 * Global error handling middleware
 * All errors in the application should be caught and handled here
 */
export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error("Error:", err);

  if (err instanceof AppError) {
    return sendError(res, err.message, err.statusCode, err.code);
  }

  if (err instanceof ZodError) {
    const validationMessage = err.issues.map((e) => `${e.path.join(".")}: ${e.message}`).join(", ");
    return sendError(res, validationMessage, 400, "VALIDATION_ERROR");
  }



  // Handle unexpected errors
  if (err instanceof SyntaxError) {
    return sendError(res, "Invalid request body", 400, "INVALID_JSON");
  }

  // Default to 500 for unhandled errors
  return sendError(
    res,
    process.env.NODE_ENV === "production"
      ? "Internal server error"
      : err.message,
    500,
    "INTERNAL_ERROR"
  );
};
