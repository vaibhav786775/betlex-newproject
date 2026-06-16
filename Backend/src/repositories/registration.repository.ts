import prisma from "../config/prisma";
import { Prisma } from "../../generated/prisma/client";

export const createRegistration = async (data: Prisma.RegistrationCreateInput) => {
  return prisma.registration.create({
    data,
  });
};

export const findRegistrationByUserIdAndEventId = async (userId: string, eventId: string) => {
  return prisma.registration.findUnique({
    where: {
      eventId_userId: {
        eventId,
        userId,
      },
    },
    include: {
      event: true,
      user: true,
    }
  });
};

export const updateRegistrationStatus = async (id: string, status: any, cancelledAt?: Date) => {
  return prisma.registration.update({
    where: { id },
    data: { 
      status,
      ...(cancelledAt && { cancelledAt })
    },
  });
};

export const findRegistrationsByEventId = async (eventId: string, skip: number, take: number) => {
  return prisma.registration.findMany({
    where: { eventId },
    skip,
    take,
    include: {
      user: {
        select: {
          id: true,
          fullName: true,
          username: true,
          email: true,
        },
      },
    },
    orderBy: { registeredAt: "desc" },
  });
};

export const countRegistrationsByEventId = async (eventId: string) => {
  return prisma.registration.count({
    where: { eventId },
  });
};

export const updateRegistrationTeam = async (userId: string, eventId: string, teamId: string | null) => {
  return prisma.registration.update({
    where: {
      eventId_userId: {
        eventId,
        userId,
      },
    },
    data: {
      teamId,
    },
  });
};

export const clearRegistrationsTeam = async (userIds: string[], eventId: string) => {
  return prisma.registration.updateMany({
    where: {
      eventId,
      userId: { in: userIds },
    },
    data: {
      teamId: null,
    },
  });
};


