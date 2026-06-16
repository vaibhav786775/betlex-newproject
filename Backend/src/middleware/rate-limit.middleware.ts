import rateLimit from "express-rate-limit";

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // Limit each IP to 20 requests per windowMs for authentication
  message: {
    status: 429,
    message: "Too many login/registration attempts from this IP, please try again after 15 minutes",
    code: "TOO_MANY_REQUESTS"
  },
  standardHeaders: true,
  legacyHeaders: false,
});

export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    status: 429,
    message: "Too many requests from this IP, please try again after 15 minutes",
    code: "TOO_MANY_REQUESTS"
  },
  standardHeaders: true,
  legacyHeaders: false,
});
