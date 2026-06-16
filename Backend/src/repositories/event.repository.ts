import prisma from "../config/prisma"; 

import { Prisma } from "../../generated/prisma/client";

export const createEvent = async (data: Prisma.EventCreateInput) => {
  return prisma.event.create({
    data,
  });
};

export const findEventById = async (id: string) => {
  return prisma.event.findFirst({
    where: { id, deletedAt: null } as any,
  });
};

export const findEventBySlug = async (slug: string) => {
  return prisma.event.findFirst({
    where: { slug, deletedAt: null } as any,
    include: {
      _count: {
        select: {
          registrations: true,
          teams: true,
        },
      },
    },
  });
};

export const updateEvent = async (id: string, data: Prisma.EventUpdateInput) => {
  return prisma.event.update({
    where: { id },
    data,
  });
};

export const deleteEvent = async (id: string) => {
  return prisma.event.update({
    where: { id },
    data: { deletedAt: new Date() } as any,
  });
};

export const getEvents = async (params: {
  skip?: number;
  take?: number;
  where?: Prisma.EventWhereInput;
}) => {
  return prisma.event.findMany({
    skip: params.skip,
    take: params.take,
    where: { ...params.where, deletedAt: null } as any,
    orderBy: { createdAt: "desc" },
  });
};

export const getEventStats = async (id: string) => {
  const result = await prisma.event.findUnique({
    where: { id },
    include: {
      _count: {
        select: {
          registrations: true,
          teams: true,
          projects: true,
          judges: true,
        },
      },
    },
  });
  
  if (!result) return null;
  
  return {
    registrationsCount: result._count.registrations,
    teamsCount: result._count.teams,
    submissionsCount: result._count.projects,
    judgesAssignedCount: result._count.judges,
  };
};
