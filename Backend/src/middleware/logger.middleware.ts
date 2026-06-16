import morgan from "morgan";

/**
 * Request logging middleware
 * Uses morgan for HTTP request logging
 */
export const requestLogger = morgan("dev");
