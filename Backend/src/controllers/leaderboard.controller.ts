import { Request, Response } from "express";
import * as leaderboardService from "../services/leaderboard.service";
import * as leaderboardRepository from "../repositories/leaderboard.repository";
import { asyncHandler } from "../utils/async-handler";
import { sendSuccess } from "../utils/api-response";

export const getLeaderboard = asyncHandler(async (req: any, res: Response) => {
  const data = await leaderboardService.getLeaderboard(
    req.user.id,
    req.user.role,
    req.params.id as string,
    req.query as any
  );
  sendSuccess(res, data, "Leaderboard fetched successfully");
});

export const getLiveLeaderboard = (req: Request, res: Response) => {
  const eventId = req.params.id;

  // SSE Headers
  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    "Connection": "keep-alive"
  });

  // Initial data
  const sendData = async () => {
    const data = await leaderboardRepository.getLeaderboardData(eventId as string);
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  sendData();

  // Subscribe to updates
  const unsubscribe = leaderboardService.subscribeToLeaderboard(eventId as string, () => {
    sendData();
  });

  // Cleanup on close
  req.on("close", () => {
    unsubscribe();
    res.end();
  });
};
