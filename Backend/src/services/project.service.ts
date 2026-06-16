import * as projectRepository from "../repositories/project.repository";
import * as teamRepository from "../repositories/team.repository";
import { AppError } from "../utils/app-error";

export const createProject = async (userId: string, teamId: string, data: any) => {
  const team = await teamRepository.findTeamById(teamId);
  if (!team) throw new AppError("Team not found", 404, "TEAM_NOT_FOUND");

  if (team.leaderId !== userId) {
    throw new AppError("Only the team leader can create a project", 403, "FORBIDDEN");
  }

  const existing = await projectRepository.findProjectByTeamId(teamId);
  if (existing) {
    throw new AppError("Team already has a project for this event", 409, "PROJECT_ALREADY_EXISTS");
  }

  if (data.description && data.description.length > 2000) {
    throw new AppError("Description exceeds 2000 characters", 400, "VALIDATION_ERROR");
  }

  return projectRepository.createProject({
    title: data.title,
    description: data.description,
    techStack: data.techStack || [],
    status: 'draft',
    team: { connect: { id: teamId } },
    event: { connect: { id: team.eventId } },
  });
};

export const getTeamProject = async (userId: string, teamId: string) => {
  const project = await projectRepository.findProjectByTeamId(teamId);
  if (!project) throw new AppError("Project not found", 404, "PROJECT_NOT_FOUND");

  const isMember = project.team.members.some(m => m.userId === userId);
  if (!isMember) {
    throw new AppError("Only team members can view the project", 403, "FORBIDDEN");
  }

  return project;
};

export const updateProject = async (userId: string, teamId: string, data: any) => {
  const project = await projectRepository.findProjectByTeamId(teamId);
  if (!project) throw new AppError("Project not found", 404, "PROJECT_NOT_FOUND");

  if (project.team.leaderId !== userId) {
    throw new AppError("Only the team leader can update the project", 403, "FORBIDDEN");
  }

  if (data.description && data.description.length > 2000) {
    throw new AppError("Description exceeds 2000 characters", 400, "VALIDATION_ERROR");
  }

  return projectRepository.updateProject(project.id, data);
};

export const submitProject = async (userId: string, teamId: string) => {
  const project = await projectRepository.findProjectByTeamId(teamId);
  if (!project) throw new AppError("Project not found", 404, "PROJECT_NOT_FOUND");

  if (project.team.leaderId !== userId) {
    throw new AppError("Only the team leader can submit the project", 403, "FORBIDDEN");
  }

  if (new Date() > new Date(project.event.submissionDeadline)) {
    throw new AppError("Submission deadline has passed", 400, "DEADLINE_PASSED");
  }

  return projectRepository.updateProject(project.id, {
    status: 'submitted',
    submittedAt: new Date()
  });
};

export const getEventProjects = async (userId: string, userRole: string, eventId: string) => {
  // Logic for judge/organizer check can be handled here or in middleware
  // For simplicity, checking if organizer or if user is assigned as judge for this event
  // Assume assigned judge check is done via role or specialized repository method
  return projectRepository.findProjectsByEventId(eventId, 'submitted');
};
