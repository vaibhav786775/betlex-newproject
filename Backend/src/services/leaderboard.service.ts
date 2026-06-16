import * as leaderboardRepository from "../repositories/leaderboard.repository";
import { AppError } from "../utils/app-error";
import { EventEmitter } from "events";

const leaderboardEvents = new EventEmitter();

export const getLeaderboard = async (userId: string, userRole: string, eventId: string, query: { page?: string, limit?: string }) => {
  const status = await leaderboardRepository.getEventPublicationStatus(eventId);
  if (!status) throw new AppError("Event not found", 404, "EVENT_NOT_FOUND");

  // Visibility logic
  const isOrganizer = userRole === 'admin' || userRole === 'organizer';
  if (!status.isLeaderboardPublished && !isOrganizer) {
    throw new AppError("Leaderboard has not been published yet", 403, "NOT_PUBLISHED");
  }

  const data = await leaderboardRepository.getLeaderboardData(eventId);
  
  const page = parseInt(query.page || "1");
  const limit = parseInt(query.limit || "10");
  const skip = (page - 1) * limit;

  return {
    total: data.length,
    page,
    limit,
    results: data.slice(skip, skip + limit)
  };
};

// SSE notification logic
export const notifyScoreUpdate = (eventId: string) => {
  leaderboardEvents.emit(`update:${eventId}`);
};

export const subscribeToLeaderboard = (eventId: string, callback: () => void) => {
  const handler = () => callback();
  leaderboardEvents.on(`update:${eventId}`, handler);
  return () => leaderboardEvents.off(`update:${eventId}`, handler);
};
