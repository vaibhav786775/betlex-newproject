import { Request, Response } from "express";
import * as teamService from "../services/team.service";
import { asyncHandler } from "../utils/async-handler";
import { sendSuccess } from "../utils/api-response";

export const createTeam = asyncHandler(async (req: any, res: Response) => {
  const team = await teamService.createTeam(req.user.id, req.params.id, req.body);
  sendSuccess(res, team, "Team created successfully", 201);
});

export const joinTeam = asyncHandler(async (req: any, res: Response) => {
  const member = await teamService.joinTeam(req.user.id, req.body.inviteCode);
  sendSuccess(res, member, "Joined team successfully");
});

export const updateTeam = asyncHandler(async (req: any, res: Response) => {
  const team = await teamService.updateTeam(req.user.id, req.params.id, req.body);
  sendSuccess(res, team, "Team updated successfully");
});

export const removeMember = asyncHandler(async (req: any, res: Response) => {
  await teamService.removeMember(req.user.id, req.params.id, req.params.userId);
  sendSuccess(res, null, "Member removed successfully");
});

export const deleteTeam = asyncHandler(async (req: any, res: Response) => {
  await teamService.deleteTeam(req.user.id, req.params.id);
  sendSuccess(res, null, "Team deleted successfully");
});

export const getEventTeams = asyncHandler(async (req: Request, res: Response) => {
  const teams = await teamService.getEventTeams(req.params.id as string, req.query as any);
  sendSuccess(res, teams, "Teams fetched successfully");
});

export const getTeamById = asyncHandler(async (req: Request, res: Response) => {
  const team = await teamService.getTeamById(req.params.id as string);
  sendSuccess(res, team, "Team details fetched successfully");
});
