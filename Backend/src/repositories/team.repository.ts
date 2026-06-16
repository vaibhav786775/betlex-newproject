import prisma from "../config/prisma";
import { Prisma } from "../../generated/prisma/client";

export const createTeam = async (data: Prisma.TeamCreateInput) => {
  return prisma.team.create({
    data,
    include: {
      members: true,
    },
  });
};

export const findTeamById = async (id: string) => {
  return prisma.team.findUnique({
    where: { id },
    include: {
      members: {
        include: {
          user: {
            select: { id: true, fullName: true, username: true }
          }
        }
      },
      event: true,
    },
  });
};

export const findTeamByInviteCode = async (inviteCode: string) => {
  return prisma.team.findUnique({
    where: { inviteCode },
    include: {
      event: true,
      _count: {
        select: { members: true }
      }
    },
  });
};

export const updateTeam = async (id: string, data: Prisma.TeamUpdateInput) => {
  return prisma.team.update({
    where: { id },
    data,
  });
};

export const addMember = async (teamId: string, userId: string, role: any) => {
  return prisma.teamMember.create({
    data: {
      team: { connect: { id: teamId } },
      user: { connect: { id: userId } },
      role,
    },
  });
};

export const removeMember = async (teamId: string, userId: string) => {
  return prisma.teamMember.delete({
    where: {
      teamId_userId: {
        teamId,
        userId,
      },
    },
  });
};

export const deleteTeam = async (id: string) => {
  return prisma.$transaction([
    prisma.teamMember.deleteMany({ where: { teamId: id } }),
    prisma.team.delete({ where: { id } }),
  ]);
};

export const findTeamsByEventId = async (eventId: string, skip: number, take: number) => {
  return prisma.team.findMany({
    where: { eventId },
    skip,
    take,
    include: {
      _count: {
        select: { members: true }
      }
    },
    orderBy: { createdAt: "desc" },
  });
};
