import { Request, Response } from "express";
import * as judgeService from "../services/judge.service";
import { asyncHandler } from "../utils/async-handler";
import { sendSuccess } from "../utils/api-response";

export const getAssignedProjects = asyncHandler(async (req: any, res: Response) => {
  const projects = await judgeService.getAssignedProjects(req.user.id);
  sendSuccess(res, projects, "Assigned projects fetched successfully");
});

export const getProjectForJudge = asyncHandler(async (req: any, res: Response) => {
  const project = await judgeService.getProjectForJudge(req.params.id as string, req.user.id);
  sendSuccess(res, project, "Project details fetched successfully");
});

export const submitScore = asyncHandler(async (req: any, res: Response) => {
  const score = await judgeService.submitScore(req.user.id, req.params.id as string, req.body);
  sendSuccess(res, score, "Score submitted successfully");
});

export const getEventScores = asyncHandler(async (req: any, res: Response) => {
  const scores = await judgeService.getEventScores(req.user.id, req.user.role, req.params.id as string);
  sendSuccess(res, scores, "Event scores fetched successfully");
});
