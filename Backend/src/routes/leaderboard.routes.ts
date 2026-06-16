import { Router } from "express";
import * as leaderboardController from "../controllers/leaderboard.controller";
import { optionalAuthMiddleware } from "../middleware/auth.middleware";

const leaderboardRouter = Router();

/**
 * @openapi
 * /events/{id}/leaderboard:
 *   get:
 *     summary: Get leaderboard
 *     description: Returns the paginated ranked project list. If participant, enforces leaderboard visibility rules.
 *     tags:
 *       - Leaderboard
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - name: page
 *         in: query
 *         schema:
 *           type: integer
 *           default: 1
 *       - name: limit
 *         in: query
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: Leaderboard retrieved successfully.
 *       403:
 *         description: Forbidden. Leaderboard not published.
 */
leaderboardRouter.get("/:id/leaderboard", optionalAuthMiddleware, leaderboardController.getLeaderboard);

/**
 * @openapi
 * /events/{id}/leaderboard/live:
 *   get:
 *     summary: Live leaderboard updates via SSE
 *     description: Server-sent Events (SSE) stream returning rank updates live as scores are submitted.
 *     tags:
 *       - Leaderboard
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: SSE connection established.
 */
leaderboardRouter.get("/:id/leaderboard/live", leaderboardController.getLiveLeaderboard);

export default leaderboardRouter;

