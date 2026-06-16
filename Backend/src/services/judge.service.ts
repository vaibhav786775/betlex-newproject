import * as judgeRepository from "../repositories/judge.repository";
import { AppError } from "../utils/app-error";

export const getAssignedProjects = async (judgeId: string) => {
  return judgeRepository.findAssignedProjects(judgeId);
};

export const getProjectForJudge = async (projectId: string, judgeId: string) => {
  const project = await judgeRepository.findProjectWithScore(projectId, judgeId);
  if (!project) throw new AppError("Project not found", 404, "PROJECT_NOT_FOUND");
  return project;
};

export const submitScore = async (judgeId: string, projectId: string, data: any) => {
  const project = await judgeRepository.findProjectWithScore(projectId, judgeId);
  if (!project) throw new AppError("Project not found", 404, "PROJECT_NOT_FOUND");

  // Basic validation
  const scores = [data.innovation, data.technical, data.impact, data.presentation];
  if (scores.some(s => s < 1 || s > 10)) {
    throw new AppError("Scores must be between 1 and 10", 400, "VALIDATION_ERROR");
  }

  const total = scores.reduce((a, b) => a + b, 0) / 4;

  const score = await judgeRepository.upsertScore({
    projectId,
    judgeId,
    innovation: data.innovation,
    technical: data.technical,
    impact: data.impact,
    presentation: data.presentation,
    comments: data.comments,
    total
  });

  // Notify live leaderboard
  const projectDetail = await judgeRepository.findProjectWithScore(projectId, judgeId);
  if (projectDetail) {
    const { notifyScoreUpdate } = require("./leaderboard.service");
    notifyScoreUpdate(projectDetail.eventId);
  }

  return score;
};

export const getEventScores = async (userId: string, userRole: string, eventId: string) => {
  if (userRole !== 'admin' && userRole !== 'organizer') {
     throw new AppError("Forbidden", 403, "FORBIDDEN");
  }
  return judgeRepository.getEventScores(eventId);
};
