import * as registrationRepository from "../repositories/registration.repository";
import * as eventRepository from "../repositories/event.repository";
import { AppError } from "../utils/app-error";
import prisma from "../config/prisma";

export const registerForEvent = async (userId: string, eventId: string, data: any) => {
  return prisma.$transaction(async (tx) => {
    const event = await tx.event.findUnique({
      where: { id: eventId },
    });
    if (!event) {
      throw new AppError("Event not found", 404, "EVENT_NOT_FOUND");
    }

    const existing = await tx.registration.findUnique({
      where: {
        eventId_userId: { eventId, userId }
      }
    });
    if (existing) {
      throw new AppError("Already registered for this event", 409, "ALREADY_REGISTERED");
    }

    const now = new Date();
    if (now < new Date(event.registrationOpen)) {
      throw new AppError("Registration has not opened yet", 400, "REGISTRATION_NOT_OPEN");
    }
    
    if (now > new Date(event.registrationClose)) {
      throw new AppError("Registration period has closed", 400, "REGISTRATION_CLOSED");
    }

    if (event.maxRegistrations !== null && event.maxRegistrations !== undefined) {
      const currentCount = await tx.registration.count({
        where: { eventId },
      });
      if (currentCount >= event.maxRegistrations) {
        throw new AppError("Event registration has reached maximum capacity", 409, "REGISTRATION_FULL");
      }
    }

    return tx.registration.create({
      data: {
        registrationData: data.registrationData || {},
        status: 'confirmed',
        event: { connect: { id: eventId } },
        user: { connect: { id: userId } },
        ...(data.teamId && { team: { connect: { id: data.teamId } } }),
      },
    });
  });
};

export const getUserRegistration = async (userId: string, eventId: string) => {
  const registration = await registrationRepository.findRegistrationByUserIdAndEventId(userId, eventId);
  if (!registration) {
    throw new AppError("Registration not found", 404, "REGISTRATION_NOT_FOUND");
  }
  return registration;
};

export const cancelRegistration = async (userId: string, eventId: string) => {
  const registration = await registrationRepository.findRegistrationByUserIdAndEventId(userId, eventId);
  if (!registration) {
    throw new AppError("Registration not found", 404, "REGISTRATION_NOT_FOUND");
  }

  if (registration.status === 'cancelled') {
    throw new AppError("Registration is already cancelled", 400, "ALREADY_CANCELLED");
  }

  if (new Date() > new Date(registration.event.eventStart)) {
    throw new AppError("Cannot cancel registration after event has started", 403, "EVENT_ALREADY_STARTED");
  }

  return registrationRepository.updateRegistrationStatus(registration.id, 'cancelled', new Date());
};

export const getEventRegistrations = async (userId: string, userRole: string, eventId: string, query: { page?: string, limit?: string }) => {
  const event = await eventRepository.findEventById(eventId);
  if (!event) {
    throw new AppError("Event not found", 404, "EVENT_NOT_FOUND");
  }

  if (userRole !== "admin" && event.organizerId !== userId) {
    throw new AppError("Forbidden", 403, "FORBIDDEN");
  }

  const page = parseInt(query.page || "1");
  const limit = parseInt(query.limit || "10");
  const skip = (page - 1) * limit;

  const results = await registrationRepository.findRegistrationsByEventId(eventId, skip, limit);
  const total = await registrationRepository.countRegistrationsByEventId(eventId);

  return {
    total,
    page,
    limit,
    results,
  };
};

