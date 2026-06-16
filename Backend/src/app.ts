import dotenv from "dotenv";
dotenv.config();
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { requestLogger } from "./middleware/logger.middleware";
import { errorHandler } from "./middleware/error.middleware";
import { apiLimiter } from "./middleware/rate-limit.middleware";
import swaggerUi from "swagger-ui-express";
import { swaggerSpec } from "./config/swagger.config";
import authRouter from "./routes/auth.routes";
import eventRouter from "./routes/event.routes";
import teamRouter from "./routes/team.routes";
import projectRouter from "./routes/project.routes";
import judgeRouter from "./routes/judge.routes";
import leaderboardRouter from "./routes/leaderboard.routes";
import announcementRouter from "./routes/announcement.routes";






const app = express();

const corsOptions = {
  origin: process.env.FRONTEND_ORIGIN || "http://localhost:5173",
  credentials: true,
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json());
app.use(cookieParser());
app.use(requestLogger);
app.use("/api", apiLimiter);
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));


app.get("/", (req, res) => {
  res.send("BeetleX Backend Running");
});

// Routes
app.use("/api/auth", authRouter);
app.use("/api/events", eventRouter);
app.use("/api/teams", teamRouter);
app.use("/api", projectRouter);
app.use("/api/judge", judgeRouter);
app.use("/api/events", leaderboardRouter);
app.use("/api", announcementRouter);








// Global error handler (must be last)
app.use(errorHandler);

export default app;