import { Router } from "express";
import * as leaderboardController from "../controllers/leaderboard.controller";
import authMiddleware from "../middleware/auth.middleware";

const leaderboardRouter = Router();

leaderboardRouter.get("/:id/leaderboard", authMiddleware, leaderboardController.getLeaderboard);
leaderboardRouter.get("/:id/leaderboard/live", leaderboardController.getLiveLeaderboard);

export default leaderboardRouter;
