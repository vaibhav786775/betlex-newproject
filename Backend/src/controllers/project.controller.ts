import { Request, Response } from "express";
import * as projectService from "../services/project.service";
import { asyncHandler } from "../utils/async-handler";
import { sendSuccess } from "../utils/api-response";

export const createProject = asyncHandler(async (req: any, res: Response) => {
  const project = await projectService.createProject(req.user.id, req.params.id as string, req.body);
  sendSuccess(res, project, "Project created successfully", 201);
});

export const getProject = asyncHandler(async (req: any, res: Response) => {
  const project = await projectService.getTeamProject(req.user.id, req.params.id as string);
  sendSuccess(res, project, "Project fetched successfully");
});

export const updateProject = asyncHandler(async (req: any, res: Response) => {
  const project = await projectService.updateProject(req.user.id, req.params.id as string, req.body);
  sendSuccess(res, project, "Project updated successfully");
});

export const submitProject = asyncHandler(async (req: any, res: Response) => {
  const project = await projectService.submitProject(req.user.id, req.params.id as string);
  sendSuccess(res, project, "Project submitted successfully");
});

export const uploadDeck = asyncHandler(async (req: any, res: Response) => {
  const mockUrl = `https://cdn.beetlex.com/decks/team-${req.params.id}-${Date.now()}.pdf`;
  const project = await projectService.updateProject(req.user.id, req.params.id as string, { deckUrl: mockUrl });
  sendSuccess(res, { deckUrl: mockUrl }, "Pitch deck uploaded successfully (Mocked)");
});


export const getEventProjects = asyncHandler(async (req: any, res: Response) => {
  const projects = await projectService.getEventProjects(req.user.id, req.user.role, req.params.id as string);
  sendSuccess(res, projects, "Projects fetched successfully");
});
