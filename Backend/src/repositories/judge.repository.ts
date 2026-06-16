import prisma from "../config/prisma";
import { Prisma } from "../../generated/prisma/client";

export const findAssignedProjects = async (judgeId: string) => {
  // Find events where this user is a judge
  const assignments = await prisma.eventJudge.findMany({
    where: { judgeId },
    select: { eventId: true }
  });
  
  const eventIds = assignments.map(a => a.eventId);
  
  // Return projects from those events that are submitted
  return prisma.project.findMany({
    where: {
      eventId: { in: eventIds },
      status: 'submitted'
    },
    include: {
      team: {
        select: { name: true }
      },
      scores: {
        where: { judgeId }
      }
    }
  });
};

export const findProjectWithScore = async (projectId: string, judgeId: string) => {
  return prisma.project.findUnique({
    where: { id: projectId },
    include: {
      scores: {
        where: { judgeId }
      }
    }
  });
};

export const upsertScore = async (data: any) => {
  const { projectId, judgeId, ...scores } = data;
  
  return prisma.score.upsert({
    where: {
      projectId_judgeId: {
        projectId,
        judgeId
      }
    },
    create: data,
    update: scores
  });
};

export const getEventScores = async (eventId: string) => {
  return prisma.project.findMany({
    where: { eventId, status: 'submitted' },
    include: {
      team: {
        select: { name: true }
      },
      scores: {
        include: {
          judge: {
            select: { fullName: true }
          }
        }
      }
    }
  });
};
