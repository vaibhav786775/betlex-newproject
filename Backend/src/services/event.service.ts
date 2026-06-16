import * as eventRepository from "../repositories/event.repository";
import { AppError } from "../utils/app-error";

export const createEvent = async (organizerId: string, data: any) => {
  const existingEvent = await eventRepository.findEventBySlug(data.slug);
  if (existingEvent) {
    throw new AppError("Slug already exists", 409, "SLUG_ALREADY_EXISTS");
  }

  return eventRepository.createEvent({
    ...data,
    organizer: { connect: { id: organizerId } },
  });
};

export const getEvents = async (query: {
  page?: string;
  limit?: string;
  status?: string;
  tag?: string;
}) => {
  const page = parseInt(query.page || "1");
  const limit = parseInt(query.limit || "10");
  const skip = (page - 1) * limit;

  const where: any = {};
  if (query.status) where.status = query.status;
  if (query.tag) where.tags = { has: query.tag };

  return eventRepository.getEvents({
    skip,
    take: limit,
    where,
  });
};

export const getEventBySlug = async (slug: string) => {
  const event = await eventRepository.findEventBySlug(slug);
  if (!event) {
    throw new AppError("Event not found", 404, "EVENT_NOT_FOUND");
  }
  return event;
};

export const updateEvent = async (
  userId: string,
  userRole: string,
  eventId: string,
  data: any
) => {
  const event = await eventRepository.findEventById(eventId);
  if (!event) {
    throw new AppError("Event not found", 404, "EVENT_NOT_FOUND");
  }

  if (userRole !== "admin" && event.organizerId !== userId) {
    throw new AppError("Forbidden", 403, "FORBIDDEN");
  }

  if (data.slug) {
    const existing = await eventRepository.findEventBySlug(data.slug);
    if (existing && existing.id !== eventId) {
      throw new AppError("Slug already exists", 409, "SLUG_ALREADY_EXISTS");
    }
  }

  return eventRepository.updateEvent(eventId, data);
};

export const deleteEvent = async (userRole: string, eventId: string) => {
  if (userRole !== "admin") {
    throw new AppError("Forbidden", 403, "FORBIDDEN");
  }

  const event = await eventRepository.findEventById(eventId);
  if (!event) {
    throw new AppError("Event not found", 404, "EVENT_NOT_FOUND");
  }

  return eventRepository.deleteEvent(eventId);
};

export const getEventStats = async (eventId: string) => {
  const stats = await eventRepository.getEventStats(eventId);
  if (!stats) {
    throw new AppError("Event not found", 404, "EVENT_NOT_FOUND");
  }
  return stats;
};
