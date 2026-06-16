import prisma from "../config/prisma";
import { Prisma } from "../../generated/prisma/client";

export const createProject = async (data: Prisma.ProjectCreateInput) => {
  return prisma.project.create({
    data,
  });
};

export const findProjectByTeamId = async (teamId: string) => {
  return prisma.project.findFirst({
    where: { teamId },
    include: {
      team: {
        include: {
          members: true
        }
      },
      event: true
    }
  });
};

export const findProjectById = async (id: string) => {
  return prisma.project.findUnique({
    where: { id },
    include: {
      team: true,
      event: true
    }
  });
};

export const updateProject = async (id: string, data: Prisma.ProjectUpdateInput) => {
  return prisma.project.update({
    where: { id },
    data,
  });
};

export const findProjectsByEventId = async (eventId: string, status?: any) => {
  return prisma.project.findMany({
    where: { 
      eventId,
      ...(status && { status })
    },
    include: {
      team: {
        select: { name: true }
      }
    },
    orderBy: { submittedAt: "desc" }
  });
};
