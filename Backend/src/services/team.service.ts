import * as teamRepository from "../repositories/team.repository";
import * as registrationRepository from "../repositories/registration.repository";
import { AppError } from "../utils/app-error";
import * as crypto from "crypto";


export const createTeam = async (userId: string, eventId: string, data: { name: string, track?: string }) => {
  const registration = await registrationRepository.findRegistrationByUserIdAndEventId(userId, eventId);
  if (!registration || registration.status === 'cancelled') {
    throw new AppError("You must be registered for this event to create a team", 403, "NOT_REGISTERED");
  }

  const inviteCode = crypto.randomBytes(5).toString('hex').toUpperCase();

  const team = await teamRepository.createTeam({
    name: data.name,
    track: data.track,
    inviteCode,
    event: { connect: { id: eventId } },
    leader: { connect: { id: userId } },
    members: {
      create: {
        userId,
        role: 'leader'
      }
    }
  });

  await registrationRepository.updateRegistrationTeam(userId, eventId, team.id);
  return team;
};

export const joinTeam = async (userId: string, inviteCode: string) => {
  const team = await teamRepository.findTeamByInviteCode(inviteCode);
  if (!team) {
    throw new AppError("Team not found", 404, "TEAM_NOT_FOUND");
  }

  if (!team.isOpen) {
    throw new AppError("Team is not accepting new members", 400, "TEAM_CLOSED");
  }

  const registration = await registrationRepository.findRegistrationByUserIdAndEventId(userId, team.eventId);
  if (!registration || registration.status === 'cancelled') {
    throw new AppError("You must be registered for this event to join the team", 403, "NOT_REGISTERED");
  }

  if (team._count.members >= team.event.maxTeamSize) {
    throw new AppError("Team has reached maximum capacity", 400, "TEAM_FULL");
  }

  const existingMember = await teamRepository.findTeamById(team.id);
  if (existingMember?.members.some(m => m.userId === userId)) {
    throw new AppError("You are already a member of this team", 409, "ALREADY_MEMBER");
  }

  const member = await teamRepository.addMember(team.id, userId, 'member');
  await registrationRepository.updateRegistrationTeam(userId, team.eventId, team.id);
  return member;
};

export const updateTeam = async (userId: string, teamId: string, data: any) => {
  const team = await teamRepository.findTeamById(teamId);
  if (!team) throw new AppError("Team not found", 404, "TEAM_NOT_FOUND");
  
  if (team.leaderId !== userId) {
    throw new AppError("Only the team leader can update the team", 403, "FORBIDDEN");
  }

  const sanitizedData: any = {};
  if (data.name !== undefined) sanitizedData.name = data.name;
  if (data.track !== undefined) sanitizedData.track = data.track;
  if (data.isOpen !== undefined) sanitizedData.isOpen = data.isOpen;

  return teamRepository.updateTeam(teamId, sanitizedData);
};

export const removeMember = async (leaderId: string, teamId: string, memberUserId: string) => {
  const team = await teamRepository.findTeamById(teamId);
  if (!team) throw new AppError("Team not found", 404, "TEAM_NOT_FOUND");

  if (team.leaderId !== leaderId) {
    throw new AppError("Only the team leader can remove members", 403, "FORBIDDEN");
  }

  if (leaderId === memberUserId) {
    throw new AppError("Leader cannot remove themselves", 400, "CANNOT_REMOVE_LEADER");
  }

  const result = await teamRepository.removeMember(teamId, memberUserId);
  await registrationRepository.updateRegistrationTeam(memberUserId, team.eventId, null);
  return result;
};

export const deleteTeam = async (leaderId: string, teamId: string) => {
  const team = await teamRepository.findTeamById(teamId);
  if (!team) throw new AppError("Team not found", 404, "TEAM_NOT_FOUND");

  if (team.leaderId !== leaderId) {
    throw new AppError("Only the team leader can delete the team", 403, "FORBIDDEN");
  }

  if (new Date() > new Date(team.event.submissionDeadline)) {
    throw new AppError("Cannot delete team after submission deadline", 400, "DEADLINE_PASSED");
  }

  const memberUserIds = team.members.map(m => m.userId);
  await registrationRepository.clearRegistrationsTeam(memberUserIds, team.eventId);

  return teamRepository.deleteTeam(teamId);
};


export const getEventTeams = async (eventId: string, query: { page?: string, limit?: string }) => {
  const page = parseInt(query.page || "1");
  const limit = parseInt(query.limit || "10");
  const skip = (page - 1) * limit;

  return teamRepository.findTeamsByEventId(eventId, skip, limit);
};

export const getTeamById = async (teamId: string) => {
  const team = await teamRepository.findTeamById(teamId);
  if (!team) throw new AppError("Team not found", 404, "TEAM_NOT_FOUND");
  return team;
};
